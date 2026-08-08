"""
API do sistema adaptativo de aprendizagem.

Fluxo:
  GET  /adaptive/dashboard   -> estado do dia (revisões, erros, domínio, recomendação)
  GET  /adaptive/recommend   -> "o que devo estudar agora" + motivos
  POST /adaptive/session/start -> monta a sessão inteligente (intercalada)
  POST /adaptive/session/{id}/answer -> processa resposta: domínio, intervalo SRS,
                                        caderno de erros, análise e questão de recuperação
  POST /adaptive/session/{id}/end  -> encerra sessão e devolve resumo
  GET  /adaptive/errors      -> caderno de erros
  POST /adaptive/errors/{id}/classify -> classificação do erro pelo aluno
  POST /adaptive/errors/{id}/resolve  -> marca erro corrigido
  GET  /adaptive/domain      -> mapa de domínio (disciplina -> tópicos)
  GET  /adaptive/topics      -> tópicos disponíveis no banco de questões
"""

import json
import logging
import random
import re
from datetime import date, datetime, timezone, timedelta

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional

from services.srs import (
    apply_result,
    decay_mastery,
    initial_skill,
    mastery_label,
    mastery_state,
    result_grade,
)
from services.adaptive_store import adaptive_store
from services.adaptive_seed import build_question_pool
from utils.auth import get_current_user

logger = logging.getLogger(__name__)
router = APIRouter()

ERROR_TYPES = [
    "nao_sabia",
    "esqueci_formula",
    "nao_entendi_enunciado",
    "estrategia_errada",
    "erro_calculo",
    "distracao",
    "nao_sabia_por_onde_comecar",
    "confundi_conceitos",
    "interpretei_errado",
    "outro",
]

ERROR_TYPE_LABELS = {
    "nao_sabia": "Não sabia o conteúdo",
    "esqueci_formula": "Esqueci a fórmula",
    "nao_entendi_enunciado": "Não entendi o enunciado",
    "estrategia_errada": "Escolhi a estratégia errada",
    "erro_calculo": "Errei o cálculo",
    "distracao": "Errei por distração",
    "nao_sabia_por_onde_comecar": "Não sabia por onde começar",
    "confundi_conceitos": "Confundi dois conceitos",
    "interpretei_errado": "Interpretei errado",
    "outro": "Outro",
}

POOL = []
POOL_SEEDED = False

# Mapeia disciplinas do cronograma (schedule) para as disciplinas do banco adaptativo
SCHEDULE_SUBJECT_MAP = {
    "calc2": "calculo2",
    "calc3": "calculo3",
    "calcnum": "calculonumerico",
    "ed1": "estruturadedados",
    "sdig": "sistemasdigitais",
}


# ------------------------------------------------------------------- models
class SessionStartRequest(BaseModel):
    limit: int = 8
    simulado: bool = False
    subjects: Optional[list] = None
    difficulty: Optional[int] = None
    time_limit_min: Optional[int] = None


class AnswerRequest(BaseModel):
    item_id: str
    answer: Optional[int] = None
    answer_text: str = ""
    confidence: int = 50
    dont_know: bool = False
    time_spent_sec: int = 0
    hints_used: int = 0
    classification: str = ""


class SessionEndRequest(BaseModel):
    stats: dict = {}


class ErrorClassifyRequest(BaseModel):
    error_type: str
    note: str = ""


class ErrorResolveRequest(BaseModel):
    correction: str = ""


# ------------------------------------------------------------------- helpers
def _today() -> date:
    return date.today()


async def _ensure_seeded():
    global POOL, POOL_SEEDED
    if not POOL:
        POOL = build_question_pool()
    if not POOL_SEEDED:
        await adaptive_store.seed_questions(POOL)
        POOL_SEEDED = True


def _pub_question(q: dict) -> dict:
    """Questão pública (sem resposta) para o frontend."""
    if q is None:
        return None
    pub = dict(q)
    pub.pop("correct_answer", None)
    pub.pop("answer", None)
    return pub


def _skill_for_topic(skill, topic_meta: dict) -> dict:
    if skill:
        return skill
    return initial_skill(
        topic_meta["topic_id"], topic_meta.get("subject", ""), topic_meta.get("topic_name", "")
    )


def _decayed(skill: dict) -> dict:
    """Aplica decaimento por esquecimento na exibição (sem gravar)."""
    if not skill or not skill.get("next_review"):
        return skill
    nxt = date.fromisoformat(skill["next_review"])
    overdue = (_today() - nxt).days
    if overdue > 0 and skill.get("mastery"):
        s = dict(skill)
        s["mastery"] = decay_mastery(s["mastery"], overdue)
        return s
    return skill


async def _classify_error_ai(question: dict, student_answer, dont_know: bool) -> Optional[str]:
    """Sugestão automática do tipo de erro via IA (fallback silencioso)."""
    if dont_know:
        return "nao_sabia"
    try:
        from backend.services.chat_service import chat_service
        from backend.services.providers import ProviderType

        q_text = (question.get("question") or "")[:500]
        prompt = (
            "Classifique o ERRO de um aluno nesta questão de múltipla escolha.\n"
            f"QUESTÃO: {q_text}\n"
            f"RESPOSTA DO ALUNO (índice): {student_answer}\n\n"
            f"Responda APENAS com uma das opções (sem aspas, sem texto extra): "
            f"{', '.join(ERROR_TYPES)}"
        )
        resp = await chat_service.chat(
            message=prompt,
            provider_type=ProviderType.GROQ,
            system_prompt="Você é um especialista em análise pedagógica de erros.",
            temperature=0.2,
            max_tokens=60,
        )
        text = (resp.get("content") or "").strip().lower()
        for t in ERROR_TYPES:
            if t in text:
                return t
    except Exception as exc:  # noqa: BLE001
        logger.info("Classificação IA indisponível: %s", exc)
    return None


def _classify_error_heuristic(student_answer, correct_answer, dont_know, question) -> str:
    if dont_know:
        return "nao_sabia"
    if student_answer is None and not question.get("options"):
        return "nao_sabia_por_onde_comecar"
    if isinstance(student_answer, int) and isinstance(correct_answer, int):
        if abs(student_answer - correct_answer) == 1:
            return "erro_calculo"
    return "interpretei_errado"


def _analysis_for_error(error_type: str, question: dict, topic_name: str) -> dict:
    """Análise inteligente do erro (o que fez / o que deveria perceber / como evitar)."""
    explanation = question.get("explanation") or ""
    q_text = (question.get("question") or "").strip().split("\n")[0][:160]
    guidance = {
        "nao_sabia": {
            "fez": "Você não conseguiu recuperar o conteúdo exigido pela questão.",
            "perceber": f"Esta questão testa {topic_name}. O conceito central é:\n{explanation[:240]}",
            "evitar": "Estude o conceito, feche o material e tente explicar com suas palavras antes de praticar.",
        },
        "esqueci_formula": {
            "fez": "Você reconheceu o assunto, mas não lembrou da fórmula ou propriedade necessária.",
            "perceber": "A ideia-chave desta questão está em: " + (explanation[:240] or topic_name),
            "evitar": "Na revisão, anote as fórmulas do tópico e reescreva-as de memória (active recall).",
        },
        "nao_entendi_enunciado": {
            "fez": "A resposta mostra que o comando do problema foi mal interpretado.",
            "perceber": "O enunciado pedia: {}. Identifique o verbo do comando (calcule, mostre, compare...).".format(q_text),
            "evitar": "Sublinhe o que a questão pede ANTES de tentar resolver.",
        },
        "estrategia_errada": {
            "fez": "Você usou uma estratégia que não se aplicava a esta questão.",
            "perceber": "A forma correta de atacar é: " + (explanation[:240] or "refletir sobre qual método o tópico exige"),
            "evitar": "Antes de calcular, pergunte: qual método deste tópico eu já usei em questões parecidas?",
        },
        "erro_calculo": {
            "fez": "A estratégia estava certa, mas o cálculo saiu errado no meio do caminho.",
            "perceber": "Confira o passo a passo: " + (explanation[:240] or ""),
            "evitar": "Refaça a conta devagar e confira o resultado final em relação ao enunciado.",
        },
        "distracao": {
            "fez": "A resposta parece ter sido escolhida por leitura rápida ou pressa.",
            "perceber": "Revise a pergunta uma segunda vez antes de responder.",
            "evitar": "Leia todas as alternativas até o fim e elimine as claramente falsas.",
        },
        "nao_sabia_por_onde_comecar": {
            "fez": "Você não encontrou um ponto de partida para a questão.",
            "perceber": "Comece identificando os dados do enunciado e o que é pedido: " + q_text,
            "evitar": "Escreva os dados, a incógnita e o método antes de qualquer cálculo.",
        },
        "confundi_conceitos": {
            "fez": "Dois conceitos parecidos foram trocados na sua resposta.",
            "perceber": "A distinção central está em: " + (explanation[:240] or topic_name),
            "evitar": "Faça uma tabela comparando os dois conceitos que você costuma confundir.",
        },
        "interpretei_errado": {
            "fez": "O resultado mostra que o enunciado foi interpretado de outra forma.",
            "perceber": "O que a questão realmente pedia: " + (explanation[:240] or q_text),
            "evitar": "Reescreva o enunciado com suas palavras antes de resolver.",
        },
        "outro": {
            "fez": "O erro aconteceu por um motivo específico seu.",
            "perceber": "Identifique o passo exato em que a resposta divergiu.",
            "evitar": "Registre a causa para reconhecê-la nas próximas questões.",
        },
    }
    return guidance.get(error_type, guidance["outro"])


def _question_pool_meta(pool: list) -> dict:
    """topic_id -> {subject, topic_name, count} a partir do pool."""
    meta = {}
    for q in pool:
        m = meta.setdefault(q["topic_id"], {"subject": q.get("subject", ""), "topic_name": q.get("topic_name", ""), "count": 0})
        m["count"] += 1
    return meta


async def _schedule_subjects() -> dict:
    """Disciplinas pendentes do cronograma: {subject_id_schedule: {"name", "pending_topics"}}.

    Considera disciplinas com tópicos não concluídos OU com tarefas pendentes.
    Retorna {} quando o banco não está acessível (modo memória) — a sessão
    simplesmente ignora o cronograma.
    """
    try:
        if adaptive_store.db is None:
            return {}
        subs = await adaptive_store.db.subjects.find(
            {"user_id": "default"}, {"_id": 0, "user_id": 0}
        ).to_list(100)
        tasks = await adaptive_store.db.tasks.find(
            {"user_id": "default", "completed": False}, {"_id": 0, "user_id": 0}
        ).to_list(1000)

        result = {}
        for s in subs:
            sid = s.get("subject_id")
            pending = [t for t in s.get("topics", []) if not t.get("completed")]
            if not pending:
                continue
            result[sid] = {"name": s.get("name", sid), "pending_topics": len(pending)}
        for t in tasks:
            sid = t.get("subject")
            if sid:
                result.setdefault(sid, {"name": sid, "pending_topics": 0})
        return result
    except Exception as exc:  # noqa: BLE001
        logger.warning("Cronograma indisponível: %s", exc)
        return {}


def _schedule_priority_subjects(schedule: dict) -> set:
    """Mapeia disciplinas pendentes do cronograma para as disciplinas do pool adaptativo."""
    return {SCHEDULE_SUBJECT_MAP.get(sid, sid) for sid in schedule}


def _interleave(items: list) -> list:
    """Reordena para intercalar assuntos (sem dois iguais seguidos quando possível)."""
    if len(items) <= 2:
        return items
    by_subject = {}
    order = []
    for it in items:
        subj = it.get("subject", "")
        by_subject.setdefault(subj, []).append(it)
        if subj not in order:
            order.append(subj)
    result = []
    idx = {s: 0 for s in order}
    total = len(items)
    rounds = 0
    while len(result) < total and rounds < 50:
        rounds += 1
        advanced = False
        for s in order:
            if idx[s] < len(by_subject[s]) and len(result) < total:
                result.append(by_subject[s][idx[s]])
                idx[s] += 1
                advanced = True
        if not advanced:
            break
    # sobras
    for s in order:
        result.extend(by_subject[s][idx[s]:])
    return result


async def _pick_question(topic_id: str, exclude_ids: list = None, difficulty: int = None) -> Optional[dict]:
    exclude_ids = exclude_ids or []
    qs = await adaptive_store.find_questions(
        topic_id=topic_id, exclude_ids=exclude_ids, limit=8, difficulty=difficulty
    )
    if not qs and difficulty:
        qs = await adaptive_store.find_questions(topic_id=topic_id, exclude_ids=exclude_ids, limit=8)
    if not qs and exclude_ids:
        qs = await adaptive_store.find_questions(topic_id=topic_id, limit=1)
    if qs:
        return qs[0]
    return None


async def _build_recovery_question(topic_id: str, failed_question_id: str) -> Optional[dict]:
    """Nova questão que testa a MESMA habilidade (nunca a mesma questão).

    Se o tópico só tiver a questão que falhou, devolve None — o frontend
    sugere repetir depois (o erro fica no caderno para revisão).
    """
    qs = await adaptive_store.find_questions(
        topic_id=topic_id, exclude_ids=[failed_question_id], limit=8
    )
    return qs[0] if qs else None


async def _question_for_skill(skill: dict, exclude_ids: list = None) -> Optional[dict]:
    q = await _pick_question(skill["topic_id"], exclude_ids=exclude_ids)
    return q


# ----------------------------------------------------------------- dashboard
@router.get("/dashboard")
async def dashboard(user: dict = Depends(get_current_user)):
    await _ensure_seeded()
    user_id = user["email"]
    today = _today()
    skills = [(_decayed(s)) for s in await adaptive_store.list_skills(user_id)]
    errors = await adaptive_store.list_errors(user_id, resolved=False)
    sessions = await adaptive_store.list_sessions_today(user_id, today.isoformat())

    overall = round(sum(s.get("mastery", 0) for s in skills) / len(skills), 1) if skills else None
    due = [s for s in skills if s.get("next_review") and s["next_review"] <= today.isoformat()]
    due.sort(key=lambda s: s["next_review"])
    at_risk = [
        s for s in skills
        if (s.get("mastery") or 0) < 41 or (s.get("next_review") and s["next_review"] <= today.isoformat())
    ]
    weak_ids = [s["topic_id"] for s in skills if (s.get("mastery") or 0) < 61]
    scheduled = _schedule_priority_subjects(await _schedule_subjects())
    weak_ids += [m["topic_id"] for m in await adaptive_store.list_topics() if not any(
        s["topic_id"] == m["topic_id"] for s in skills
    ) and (not scheduled or m.get("subject") in scheduled)]
    recommended_count = 0
    for tid in set(weak_ids):
        recommended_count += await adaptive_store.count_questions(topic_id=tid)
    recommended_count = min(recommended_count, 30)

    time_today_min = 0
    for s in sessions:
        dur = s.get("duration_min")
        if not dur and s.get("ended_at") and s.get("created_at"):
            try:
                a = datetime.fromisoformat(s["created_at"])
                b = datetime.fromisoformat(s["ended_at"])
                dur = int((b - a).total_seconds() // 60)
            except Exception:
                dur = 0
        time_today_min += dur or 0

    recommendation = await build_recommendation(user_id, skills, errors)

    return {
        "today": today.isoformat(),
        "due_reviews": len(due),
        "recommended_questions": recommended_count,
        "errors_to_review": len(errors),
        "at_risk_topics": len(at_risk),
        "overall_mastery": overall,
        "overall_label": mastery_label(overall) if overall is not None else None,
        "time_studied_min": time_today_min,
        "recommendation": recommendation,
        "streak_topics": sorted(
            [{"topic_id": s["topic_id"], "topic_name": s.get("topic_name", s["topic_id"]),
              "days_left": (date.fromisoformat(s["next_review"]) - today).days}
             for s in due if s.get("next_review")],
            key=lambda x: x["days_left"],
        )[:10],
    }


async def build_recommendation(user_id: str, skills: list, errors: list) -> dict:
    """Motor de recomendação: prioridade -> erros recentes, revisão vencida, tópico fraco, novo.

    Tópicos novos só são recomendados se a disciplina estiver no cronograma
    do aluno (planejamento). Sem cronograma, considera o banco completo.
    """
    today = _today()
    reasons = []
    chosen = None

    scheduled = _schedule_priority_subjects(await _schedule_subjects())

    if errors:
        e = errors[0]
        chosen = {"topic_id": e["topic_id"], "topic_name": e.get("topic_name", e["topic_id"]),
                  "subject": e.get("subject", "")}
        reasons = [
            f"Você errou esta questão recentemente: {str(e.get('question', ''))[:90]}",
            "Corrigir o erro com uma questão de recuperação reforça a mesma habilidade",
        ]
        minutes = 15

    if not chosen:
        due = [s for s in skills if s.get("next_review") and s["next_review"] <= today.isoformat()]
        if due:
            due.sort(key=lambda s: s["next_review"])
            s = due[0]
            chosen = {"topic_id": s["topic_id"], "topic_name": s.get("topic_name", s["topic_id"]),
                      "subject": s.get("subject", "")}
            days = (today - date.fromisoformat(s["next_review"])).days
            reasons = [
                f"Revisão vencida há {days} dia(s) — o domínio de {s.get('topic_name', '')} está em risco de esquecimento",
                f"Domínio atual: {s.get('mastery', 0)}% ({mastery_label(s.get('mastery', 0))})",
            ]
            minutes = 20

    if not chosen:
        weak = sorted([s for s in skills if (s.get("mastery") or 0) < 41], key=lambda s: s["mastery"])
        if weak:
            s = weak[0]
            chosen = {"topic_id": s["topic_id"], "topic_name": s.get("topic_name", s["topic_id"]),
                      "subject": s.get("subject", "")}
            reasons = [
                f"Domínio atual: {s.get('mastery', 0)}% — {mastery_label(s.get('mastery', 0))}",
                "Conteúdo com desempenho baixo precisa de prática focada",
            ]
            minutes = 25

    if not chosen:
        pool_meta = _question_pool_meta(POOL)
        # Só recomenda tópico novo se a disciplina estiver no planejamento
        if scheduled:
            pool_meta = {tid: m for tid, m in pool_meta.items()
                         if m.get("subject") in scheduled}
        for tid, m in pool_meta.items():
            if not any(s["topic_id"] == tid for s in skills):
                chosen = {"topic_id": tid, "topic_name": m["topic_name"], "subject": m["subject"]}
                reasons = ["Tópico ainda não estudado — comece com questões básicas para mapear o domínio"]
                minutes = 20
                break

    if not chosen:
        if scheduled:
            return {"has_recommendation": False,
                    "title": "Nenhum tópico pendente no seu planejamento",
                    "reasons": ["Marque novos tópicos no Cronograma para receber recomendações "
                                "ou complete os tópicos atuais."], "minutes": 0}
        return {"has_recommendation": False, "title": "Você já domina o material disponível",
                "reasons": ["Explore um novo tópico no mapa de domínio ou gere novos exercícios."], "minutes": 0}
    return {
        "has_recommendation": True,
        "title": f"Estude {chosen['topic_name']} por {minutes} minutos",
        "topic_id": chosen["topic_id"],
        "topic_name": chosen["topic_name"],
        "subject": chosen["subject"],
        "minutes": minutes,
        "reasons": reasons,
    }


@router.get("/recommend")
async def recommend(user: dict = Depends(get_current_user)):
    await _ensure_seeded()
    user_id = user["email"]
    skills = [(_decayed(s)) for s in await adaptive_store.list_skills(user_id)]
    errors = await adaptive_store.list_errors(user_id, resolved=False)
    rec = await build_recommendation(user_id, skills, errors)
    return rec


# ------------------------------------------------------------- session start
@router.post("/session/start")
async def session_start(req: SessionStartRequest, user: dict = Depends(get_current_user)):
    await _ensure_seeded()
    user_id = user["email"]
    today = _today()
    limit = max(3, min(20, req.limit or 8))

    skills = await adaptive_store.list_skills(user_id)
    skills_map = {s["topic_id"]: _decayed(s) for s in skills}
    errors = await adaptive_store.list_errors(user_id, resolved=False)
    pool_meta = _question_pool_meta(POOL)
    used_qids = set()

    # Cronograma do aluno: disciplinas pendentes ganham prioridade na sessão
    schedule = await _schedule_subjects()
    priority_subjects = _schedule_priority_subjects(schedule)

    # Filtro por disciplinas (simulado/cronograma: estudar só o que foi escolhido)
    if req.subjects:
        wanted = [s for s in req.subjects if s in {m.get("subject") for m in pool_meta.values()}]
        pool_meta = {tid: m for tid, m in pool_meta.items() if m.get("subject") in wanted}
        if not pool_meta:
            raise HTTPException(
                status_code=400,
                detail="Nenhuma questão disponível para as disciplinas selecionadas",
            )
    elif priority_subjects:
        # Sem filtro explícito e com cronograma: restringe às disciplinas planejadas
        full_pool_meta = pool_meta
        pool_meta = {tid: m for tid, m in pool_meta.items()
                     if m.get("subject") in priority_subjects}
        if not pool_meta:
            # Fallback honesto: planejamento sem questões disponíveis, usa o banco completo
            pool_meta = full_pool_meta

    simulado = bool(req.subjects) or req.simulado

    async def make_item(item_type: str, title: str, reason: str, topic_id: str, q: dict,
                        error_id: str = None, skill_id: str = None) -> dict:
        used_qids.add(q["id"])
        return {
            "item_id": adaptive_store._new_id("it_"),
            "type": item_type,
            "title": title,
            "reason": reason,
            "subject": q.get("subject", ""),
            "topic_id": topic_id,
            "topic_name": q.get("topic_name", topic_id),
            "skill_id": skill_id,
            "error_id": error_id,
            "question_id": q["id"],
            "status": "pending",
        }

    items = []

    if simulado:
        # Simulado: questões (aleatórias) das disciplinas escolhidas
        for tid, m in pool_meta.items():
            q = await _pick_question(tid, exclude_ids=list(used_qids), difficulty=req.difficulty)
            if not q:
                continue
            items.append(await make_item(
                "simulado", "Simulado", f"Questão de simulado — {m['topic_name']}",
                tid, q, skill_id=tid,
            ))
        random.shuffle(items)
        items = items[:limit]
        if not items:
            raise HTTPException(status_code=404, detail="Nenhuma questão disponível para o simulado")
        session = await adaptive_store.add_session(user_id, {
            "started_at": datetime.now(timezone.utc).isoformat(),
            "mode": "simulado",
            "time_limit_min": req.time_limit_min,
            "subjects": req.subjects or [],
            "items": items,
            "stats": {"correct": 0, "wrong": 0, "dont_know": 0, "total": len(items)},
        })
        return {
            "session_id": session["id"],
            "created_at": session["created_at"],
            "total": len(items),
            "mode": "simulado",
            "time_limit_min": req.time_limit_min,
            "items": [
                {**it,
                 "question": _pub_question(await adaptive_store.get_question(it["question_id"]))}
                for it in session["items"]
            ],
        }

    # 1) Recuperação de erros não corrigidos
    for e in errors[:3]:
        if len(items) >= limit:
            break
        q = await _pick_question(e["topic_id"], exclude_ids=[e.get("question_id")])
        if not q:
            q = await adaptive_store.get_question(e.get("question_id"))
        if not q or q["id"] in used_qids:
            continue
        items.append(await make_item(
            "recuperacao", "Questão de recuperação",
            f"Você errou isso antes ({e.get('error_type_label') or 'erro'}) — reteste a mesma habilidade",
            e["topic_id"], q, error_id=e["id"],
        ))

    # 2) Revisões vencidas (esquecimento)
    due = [s for s in skills if s.get("next_review") and s["next_review"] <= today.isoformat()]
    due.sort(key=lambda s: s["next_review"])
    for s in due[:2]:
        if len(items) >= limit:
            break
        q = await _question_for_skill(s, exclude_ids=list(used_qids))
        if not q:
            continue
        days = (today - date.fromisoformat(s["next_review"])).days
        items.append(await make_item(
            "revisao", "Revisão crítica",
            f"Revisão vencida há {days} dia(s) — recuperar antes de esquecer",
            s["topic_id"], q, skill_id=s["topic_id"],
        ))

    # 3) Tópicos fracos
    weak = sorted([s for s in skills if (s.get("mastery") or 0) < 61], key=lambda s: s["mastery"])
    for s in weak[:2]:
        if len(items) >= limit:
            break
        q = await _question_for_skill(s, exclude_ids=list(used_qids))
        if not q:
            continue
        items.append(await make_item(
            "fraco", "Conteúdo fraco",
            f"Domínio atual {s.get('mastery', 0)}% — {mastery_label(s.get('mastery', 0))}",
            s["topic_id"], q, skill_id=s["topic_id"],
        ))

    # 4) Tópicos novos + preenchimento (disciplinas do cronograma primeiro)
    if len(items) < limit:
        unknown = [tid for tid in pool_meta if tid not in skills_map]
        random.shuffle(unknown)
        unknown.sort(key=lambda tid: 0 if pool_meta[tid].get("subject") in priority_subjects else 1)
        for tid in unknown[:2]:
            if len(items) >= limit:
                break
            q = await _pick_question(tid, exclude_ids=list(used_qids))
            if not q:
                continue
            items.append(await make_item(
                "novo", "Questão nova",
                "Tópico ainda não estudado — primeira avaliação do domínio",
                tid, q,
            ))
        # preencher com questões extras (fracos/novos/qualquer tópico disponível)
        if len(items) < limit:
            ordered_topics = sorted(
                pool_meta.items(),
                key=lambda kv: 0 if kv[1].get("subject") in priority_subjects else 1,
            )
            for tid, m in ordered_topics:
                if len(items) >= limit:
                    break
                q = await _pick_question(tid, exclude_ids=list(used_qids))
                if not q:
                    continue
                skill = skills_map.get(tid)
                if skill and (skill.get("mastery") or 0) >= 76:
                    continue
                items.append(await make_item(
                    "intercalado", "Mini teste",
                    "Intercalar assuntos treina escolher a estratégia certa",
                    tid, q, skill_id=tid,
                ))

    if not items:
        raise HTTPException(status_code=404, detail="Nenhuma questão disponível. Gere exercícios primeiro.")

    items = _interleave(items)
    session = await adaptive_store.add_session(user_id, {
        "started_at": datetime.now(timezone.utc).isoformat(),
        "mode": "adaptive",
        "items": items,
        "stats": {"correct": 0, "wrong": 0, "dont_know": 0, "total": len(items)},
    })

    return {
        "session_id": session["id"],
        "created_at": session["created_at"],
        "total": len(items),
        "mode": "adaptive",
        "items": [
            {**it,
             "question": _pub_question(await adaptive_store.get_question(it["question_id"]))}
            for it in session["items"]
        ],
    }


# ----------------------------------------------------------- session answer
@router.post("/session/{session_id}/answer")
async def session_answer(session_id: str, req: AnswerRequest, user: dict = Depends(get_current_user)):
    await _ensure_seeded()
    user_id = user["email"]
    session = await adaptive_store.get_session(user_id, session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Sessão não encontrada")

    item = next((it for it in session.get("items", []) if it["item_id"] == req.item_id), None)
    if not item:
        raise HTTPException(status_code=404, detail="Item não encontrado na sessão")

    question = await adaptive_store.get_question(item["question_id"])
    if not question:
        raise HTTPException(status_code=404, detail="Questão não encontrada")

    dont_know = bool(req.dont_know)
    if dont_know:
        correct = False
        result = "dont_know"
    else:
        if question.get("options"):
            correct = req.answer == question.get("correct_answer")
        else:
            expected = (question.get("answer") or "").strip().lower()
            given = (req.answer_text or "").strip().lower()
            correct = bool(expected) and given == expected
        result = "correct" if correct else "wrong"

    confidence = max(0, min(100, req.confidence or 50))
    difficulty = question.get("difficulty") or 2

    # ---- atualiza domínio do tópico (skill)
    topic_id = item["topic_id"]
    skill = await adaptive_store.get_skill(user_id, topic_id)
    if not skill:
        skill = initial_skill(topic_id, item.get("subject", ""), item.get("topic_name", topic_id))
    old_mastery = _decayed(skill).get("mastery", 0) if skill.get("mastery") else 0
    new_skill = apply_result(skill, result, confidence, difficulty, _today())
    await adaptive_store.upsert_skill(user_id, new_skill)
    await adaptive_store.add_review(user_id, {
        "topic_id": topic_id,
        "topic_name": item.get("topic_name", topic_id),
        "result": result,
        "confidence": confidence,
        "interval_days": new_skill["interval_days"],
        "next_review": new_skill["next_review"],
        "question_id": question["id"],
    })
    await adaptive_store.add_attempt(user_id, {
        "question_id": question["id"],
        "session_id": session_id,
        "item_id": req.item_id,
        "topic_id": topic_id,
        "topic_name": item.get("topic_name", topic_id),
        "subject": item.get("subject", ""),
        "correct": correct,
        "result": result,
        "confidence": confidence,
        "time_spent_sec": req.time_spent_sec,
        "hints_used": req.hints_used,
        "difficulty": difficulty,
    })

    # ---- caderno de erros + análise + recuperação
    analysis = None
    recovery_question = None
    error_id = None
    suggested_type = None

    if not correct:
        suggested_type = await _classify_error_ai(question, req.answer, dont_know)
        if not suggested_type:
            suggested_type = _classify_error_heuristic(req.answer, question.get("correct_answer"), dont_know, question)
        error = await adaptive_store.add_error(user_id, {
            "question_id": question["id"],
            "question": question.get("question", ""),
            "student_answer": req.answer_text or req.answer,
            "correct_answer": question.get("correct_answer"),
            "subject": item.get("subject", ""),
            "topic_id": topic_id,
            "topic_name": item.get("topic_name", topic_id),
            "difficulty": difficulty,
            "error_type": suggested_type,
            "error_type_label": ERROR_TYPE_LABELS.get(suggested_type, suggested_type),
            "explanation": question.get("explanation", ""),
            "confidence": confidence,
            "repetitions": 0,
        })
        error_id = error["id"]
        analysis = {
            "error_type": suggested_type,
            "error_type_label": ERROR_TYPE_LABELS.get(suggested_type, suggested_type),
            **(_analysis_for_error(suggested_type, question, item.get("topic_name", topic_id))),
            "explanation": question.get("explanation", ""),
        }
        recovery = await _build_recovery_question(topic_id, question["id"])
        if recovery:
            recovery_question = {
                "question": _pub_question(recovery),
                "error_id": error_id,
            }

    # ---- insere a questão de recuperação na sessão (logo após este item)
    answered_pos = next(
        (i for i, it in enumerate(session.get("items", [])) if it["item_id"] == req.item_id), -1
    )
    if recovery_question and answered_pos >= 0:
        rec_item = {
            "item_id": adaptive_store._new_id("it_"),
            "type": "recuperacao",
            "title": "Questão de recuperação",
            "reason": f"Você errou em {item.get('topic_name', topic_id)} — teste novamente a mesma habilidade",
            "subject": item.get("subject", ""),
            "topic_id": topic_id,
            "topic_name": item.get("topic_name", topic_id),
            "skill_id": topic_id,
            "error_id": error_id,
            "question_id": recovery["id"],
            "status": "pending",
        }
        session["items"].insert(answered_pos + 1, rec_item)

    # ---- atualiza sessão
    stats = dict(session.get("stats", {}))
    stats[result] = stats.get(result, 0) + 1
    stats["total"] = len(session["items"])
    for it in session["items"]:
        if it["item_id"] == req.item_id:
            it["status"] = "answered"
            it["result"] = result
    await adaptive_store.update_session(user_id, session_id, {
        "stats": stats,
        "items": session["items"],
        "answered_count": sum(1 for it in session["items"] if it["status"] == "answered"),
    })

    return {
        "correct": correct,
        "result": result,
        "explanation": question.get("explanation", ""),
        "mastery_now": new_skill["mastery"],
        "mastery_old": round(old_mastery, 1),
        "mastery_label": mastery_label(new_skill["mastery"]),
        "next_review": new_skill["next_review"],
        "interval_days": new_skill["interval_days"],
        "error_id": error_id,
        "analysis": analysis,
        "recovery_question": recovery_question,
        "session_stats": stats,
        "remaining": sum(1 for it in session["items"] if it["status"] == "pending"),
        "items": session["items"],
    }


# ------------------------------------------------------------ session end
@router.post("/session/{session_id}/end")
async def session_end(session_id: str, req: SessionEndRequest, user: dict = Depends(get_current_user)):
    user_id = user["email"]
    session = await adaptive_store.get_session(user_id, session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Sessão não encontrada")

    now = datetime.now(timezone.utc)
    started = session.get("started_at") or session.get("created_at")
    duration_min = 0
    if started:
        try:
            duration_min = int((now - datetime.fromisoformat(started)).total_seconds() // 60) or 1
        except Exception:
            duration_min = req.stats.get("duration_min", 0) or 1

    stats = dict(session.get("stats", {}))
    stats.update({k: v for k, v in req.stats.items() if k in ("correct", "wrong", "dont_know", "total")})
    total = stats.get("total") or sum(1 for it in session["items"] if it.get("result"))
    correct = stats.get("correct", 0)
    wrong = stats.get("wrong", 0)
    dont_know = stats.get("dont_know", 0)

    answered = [it for it in session["items"] if it.get("result")]
    topic_rows = {}
    for it in answered:
        row = topic_rows.setdefault(it["topic_id"], {
            "topic_id": it["topic_id"], "topic_name": it.get("topic_name", it["topic_id"]),
            "subject": it.get("subject", ""), "correct": 0, "wrong": 0,
        })
        row["correct" if it["result"] == "correct" else "wrong"] += 1

    await adaptive_store.update_session(user_id, session_id, {
        "status": "finished",
        "ended_at": now.isoformat(),
        "duration_min": duration_min,
        "stats": stats,
    })

    return {
        "session_id": session_id,
        "duration_min": duration_min,
        "stats": stats,
        "score": round(correct / total * 100, 1) if total else 0,
        "strong_topics": sorted(
            [r for r in topic_rows.values() if r["correct"] > r["wrong"]],
            key=lambda r: r["correct"], reverse=True,
        )[:3],
        "weak_topics": sorted(
            [r for r in topic_rows.values() if r["wrong"] >= r["correct"]],
            key=lambda r: r["wrong"], reverse=True,
        )[:3],
    }


# ------------------------------------------------------------------- errors
@router.get("/errors")
async def errors_list(subject: str = "", topic_id: str = "", resolved: Optional[bool] = None,
                      user: dict = Depends(get_current_user)):
    user_id = user["email"]
    items = await adaptive_store.list_errors(
        user_id, subject=subject or None, topic_id=topic_id or None, resolved=resolved
    )
    return {"errors": items, "error_types": ERROR_TYPE_LABELS}


@router.post("/errors/{error_id}/classify")
async def errors_classify(error_id: str, req: ErrorClassifyRequest, user: dict = Depends(get_current_user)):
    user_id = user["email"]
    if req.error_type not in ERROR_TYPES:
        raise HTTPException(status_code=400, detail="Tipo de erro inválido")
    updated = await adaptive_store.update_error(user_id, error_id, {
        "error_type": req.error_type,
        "error_type_label": ERROR_TYPE_LABELS[req.error_type],
        "classified_by_student": True,
        "note": req.note,
    })
    if not updated:
        raise HTTPException(status_code=404, detail="Erro não encontrado")
    return {"ok": True, "error": updated}


@router.post("/errors/{error_id}/resolve")
async def errors_resolve(error_id: str, req: ErrorResolveRequest, user: dict = Depends(get_current_user)):
    user_id = user["email"]
    error = await adaptive_store.get_error(user_id, error_id)
    if not error:
        raise HTTPException(status_code=404, detail="Erro não encontrado")
    updated = await adaptive_store.update_error(user_id, error_id, {
        "resolved": True,
        "resolved_at": datetime.now(timezone.utc).isoformat(),
        "correction": req.correction or error.get("correction", ""),
        "repetitions": (error.get("repetitions") or 0) + 1,
    })
    return {"ok": True, "error": updated}


# ------------------------------------------------------------------- domain
@router.get("/domain")
async def domain(user: dict = Depends(get_current_user)):
    await _ensure_seeded()
    user_id = user["email"]
    skills = [_decayed(s) for s in await adaptive_store.list_skills(user_id)]
    today = _today().isoformat()

    by_subject = {}
    for s in skills:
        subj = by_subject.setdefault(s.get("subject", "outros"), {
            "subject": s.get("subject", "outros"),
            "topics": [],
        })
        mastery = s.get("mastery") or 0
        subj["topics"].append({
            "topic_id": s["topic_id"],
            "topic_name": s.get("topic_name", s["topic_id"]),
            "mastery": mastery,
            "label": mastery_label(mastery),
            "state": mastery_state(mastery),
            "reviews_count": s.get("reviews_count", 0),
            "correct_count": s.get("correct_count", 0),
            "wrong_count": s.get("wrong_count", 0),
            "next_review": s.get("next_review"),
            "overdue": bool(s.get("next_review") and s["next_review"] <= today),
            "interval_days": s.get("interval_days", 0),
            "streak": s.get("streak", 0),
            "confidence": int((s.get("confidence_sum") or 0) / max(1, s.get("reviews_count", 0))) if s.get("reviews_count") else 0,
        })

    result = []
    for subj in by_subject.values():
        subj["topics"].sort(key=lambda t: t["mastery"])
        subj["mastery"] = round(sum(t["mastery"] for t in subj["topics"]) / len(subj["topics"]), 1) if subj["topics"] else None
        result.append(subj)
    result.sort(key=lambda s: s["mastery"] if s["mastery"] is not None else -1)
    return {"subjects": result}


@router.get("/topics")
async def topics(user: dict = Depends(get_current_user)):
    await _ensure_seeded()
    pool_meta = _question_pool_meta(POOL)
    topics = []
    for tid, m in pool_meta.items():
        topics.append({"topic_id": tid, "topic_name": m["topic_name"],
                       "subject": m["subject"], "count": m["count"]})
    topics.sort(key=lambda t: (t["subject"], t["topic_name"]))
    return {"topics": topics}


# ------------------------------------------------------------------ schedule
@router.get("/schedule")
async def schedule(user: dict = Depends(get_current_user)):
    """Cronograma de estudos do aluno enriquecido com dados adaptativos.

    Para cada tópico do cronograma: existe questão no banco adaptativo?
    Domínio atual? Próxima revisão? Tópico concluído?
    """
    await _ensure_seeded()
    user_id = user["email"]
    try:
        if adaptive_store.db is None:
            return {"subjects": [], "tasks": [], "available": False}

        subs = await adaptive_store.db.subjects.find(
            {"user_id": "default"}, {"_id": 0, "user_id": 0}
        ).to_list(100)
        tasks = await adaptive_store.db.tasks.find(
            {"user_id": "default", "completed": False}, {"_id": 0, "user_id": 0}
        ).to_list(1000)

        skills = [(_decayed(s)) for s in await adaptive_store.list_skills(user_id)]
        skills_map = {s["topic_id"]: s for s in skills}
        pool_meta = _question_pool_meta(POOL)

        by_topic_name = {}
        for tid, m in pool_meta.items():
            by_topic_name.setdefault((m.get("subject", ""), m.get("topic_name", "").strip().lower()), tid)

        subjects_out = []
        for s in subs:
            sid = s.get("subject_id")
            adaptive_subj = SCHEDULE_SUBJECT_MAP.get(sid, sid)
            topics_out = []
            for t in s.get("topics", []):
                tname = (t.get("title") or "").strip()
                tid = by_topic_name.get((adaptive_subj, tname.lower()))
                skill = skills_map.get(tid) if tid else None
                topics_out.append({
                    "id": t.get("id"),
                    "title": tname,
                    "completed": bool(t.get("completed")),
                    "adaptive_topic_id": tid,
                    "has_questions": tid is not None,
                    "mastery": round(skill.get("mastery", 0), 1) if skill else None,
                    "next_review": skill.get("next_review") if skill else None,
                })
            subjects_out.append({
                "subject_id": sid,
                "name": s.get("name", sid),
                "color": s.get("color"),
                "icon": s.get("icon"),
                "adaptive_subject": adaptive_subj,
                "pending_topics": sum(1 for t in topics_out if not t["completed"]),
                "topics": topics_out,
            })
        subjects_out.sort(key=lambda x: x["pending_topics"], reverse=True)
        return {"subjects": subjects_out, "tasks": tasks, "available": True}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro ao ler cronograma: {e}")
        raise HTTPException(status_code=500, detail="Erro ao ler o cronograma")


# ------------------------------------------------------------------ feynman
class FeynmanRequest(BaseModel):
    topic_id: str = ""
    topic_name: str = ""
    explanation: str = ""


_STOPWORDS = {
    "como", "para", "que", "com", "uma", "uma", "dos", "das", "qual", "sobre",
    "entre", "aula", "exercicio", "questao", "forma", "tem", "ser", "por",
    "sao", "sua", "mais", "muito", "isso", "mesmo", "exemplo",
}


def _feynman_keywords(topic_name: str, subject: str, questions: list) -> list:
    """Conceitos-chave esperados numa explicação: nome do tópico + termos das questões."""
    words = set()
    for src in (topic_name, subject):
        for w in re.findall(r"[A-Za-zÀ-ú0-9]{4,}", src or ""):
            words.add(w.lower())
    for q in questions[:4]:
        for w in re.findall(r"[A-Za-zÀ-ú0-9]{5,}", (q.get("question") or "")[:140]):
            words.add(w.lower())
    return sorted(words - _STOPWORDS)[:8]


def _feynman_eval_heuristic(explanation: str, keywords: list, topic_questions: list) -> dict:
    """Avaliação sem IA: cobre os conceitos-chave? tem exemplo? é substantiva?"""
    text = explanation.lower()
    mentioned = [k for k in keywords if k in text]
    missing = [k for k in keywords if k not in text]
    points = 0
    length = len(explanation.strip())
    if length >= 60:
        points += 1
    if length >= 120:
        points += 1
    if length >= 240:
        points += 1
    points += min(3, len(mentioned))
    has_example = any(x in text for x in ("exemplo", "ex.:", "ex:", "exemplo:")) or any(
        c.isdigit() for c in explanation
    )
    if has_example:
        points += 1
    if "não sei" not in text and "nao sei" not in text:
        points += 1
    max_points = 7
    score = min(100, round(points / max_points * 100))
    if score >= 75:
        verdict = "Explicação sólida"
    elif score >= 50:
        verdict = "Boa explicação, com lacunas"
    else:
        verdict = "Explicação precisa de reforço"
    reference = ""
    if topic_questions:
        for q in topic_questions[:2]:
            ref = q.get("explanation") or ""
            if ref:
                reference += ref.strip() + "\n\n"
        reference = reference.strip()[:600]
    return {
        "mode": "heuristico",
        "score": score,
        "verdict": verdict,
        "strengths": [f"Você mencionou o conceito '{k}'" for k in mentioned[:4]] or ["Você tentou explicar o tópico com suas palavras"],
        "gaps": [f"O conceito '{k}' não apareceu na sua explicação" for k in missing[:3]],
        "reference_explanation": reference,
    }


async def _feynman_eval_ai(explanation: str, topic_name: str, keywords: list) -> Optional[dict]:
    """Avaliação pela técnica Feynman via IA (fallback silencioso para heurística)."""
    try:
        from backend.services.chat_service import chat_service
        from backend.services.providers import ProviderType

        prompt = (
            "Avalie a explicação de um aluno pela técnica Feynman (explicar com as próprias "
            "palavras, simples, com exemplo).\n"
            f"TÓPICO: {topic_name}\n"
            f"EXPLICAÇÃO DO ALUNO: {explanation[:1200]}\n\n"
            "Responda APENAS com JSON válido neste formato (sem markdown):\n"
            '{"score": 0-100, "verdict": "frase curta", "strengths": ["..."], '
            '"gaps": ["..."], "feedback": "1-2 frases didáticas"}'
        )
        resp = await chat_service.chat(
            message=prompt,
            provider_type=ProviderType.GROQ,
            system_prompt="Você é um professor especialista em aprendizagem ativa (método Feynman).",
            temperature=0.3,
            max_tokens=400,
        )
        text = (resp.get("content") or "").strip()
        m = re.search(r"\{.*\}", text, re.DOTALL)
        if not m:
            return None
        data = json.loads(m.group(0))
        return {
            "mode": "ia",
            "score": max(0, min(100, int(data.get("score", 0)))),
            "verdict": data.get("verdict") or "Avaliação concluída",
            "strengths": [str(s) for s in data.get("strengths", [])][:4],
            "gaps": [str(s) for s in data.get("gaps", [])][:4],
            "feedback": data.get("feedback", ""),
        }
    except Exception as exc:  # noqa: BLE001
        logger.info("Avaliação Feynman por IA indisponível: %s", exc)
        return None


@router.post("/feynman")
async def feynman_evaluate(req: FeynmanRequest, user: dict = Depends(get_current_user)):
    """Método Feynman: o aluno explica o tópico com as próprias palavras e recebe
    veredito com lacunas, pontos fortes e explicação de referência."""
    user_id = user["email"]
    await _ensure_seeded()
    explanation = (req.explanation or "").strip()
    if len(explanation) < 15:
        raise HTTPException(status_code=400, detail="Escreva uma explicação com pelo menos 15 caracteres")

    pool_meta = _question_pool_meta(POOL)
    topic_id = req.topic_id
    topic_name = req.topic_name.strip()
    if not topic_id:
        for tid, m in pool_meta.items():
            if m["topic_name"].lower() == topic_name.lower():
                topic_id = tid
                break
    if topic_id not in pool_meta:
        raise HTTPException(status_code=404, detail="Tópico não encontrado no banco de questões")
    meta = pool_meta[topic_id]
    topic_name = topic_name or meta["topic_name"]

    questions = await adaptive_store.find_questions(topic_id=topic_id, limit=6)
    keywords = _feynman_keywords(topic_name, meta.get("subject", ""), questions)

    result = await _feynman_eval_ai(explanation, topic_name, keywords)
    if result is None:
        result = _feynman_eval_heuristic(explanation, keywords, questions)

    await adaptive_store.add_feynman(user_id, {
        "topic_id": topic_id,
        "topic_name": topic_name,
        "subject": meta.get("subject", ""),
        "explanation": explanation[:2000],
        "score": result["score"],
        "verdict": result["verdict"],
        "mode": result["mode"],
    })
    return {
        "topic_id": topic_id,
        "topic_name": topic_name,
        "subject": meta.get("subject", ""),
        "score": result["score"],
        "verdict": result["verdict"],
        "mode": result["mode"],
        "strengths": result["strengths"],
        "gaps": result["gaps"],
        "feedback": result.get("feedback"),
        "reference_explanation": result.get("reference_explanation"),
        "history": await adaptive_store.list_feynman(user_id, limit=8),
    }


# ------------------------------------------------------------------ relatório semanal
def _weekday_label(iso_date: str) -> str:
    try:
        return ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"][date.fromisoformat(iso_date).weekday()]
    except Exception:
        return iso_date


@router.get("/report/weekly")
async def report_weekly(user: dict = Depends(get_current_user)):
    """Relatório semanal com dados reais: minutos/dia, questões, domínio, streak, erros resolvidos."""
    user_id = user["email"]
    today = _today()

    sessions = await adaptive_store.list_sessions(user_id)
    finished = [s for s in sessions if s.get("status") == "finished"]
    finished_by_date = {}
    for s in finished:
        key = str(s.get("ended_at", ""))[:10]
        if not key:
            continue
        finished_by_date.setdefault(key, []).append(s)

    days = []
    for i in range(6, -1, -1):
        d = (today - timedelta(days=i)).isoformat()
        ds = finished_by_date.get(d, [])
        minutes = sum(s.get("duration_min") or 0 for s in ds)
        questions = sum((s.get("stats") or {}).get("total", 0) for s in ds)
        correct = sum((s.get("stats") or {}).get("correct", 0) for s in ds)
        wrong = sum((s.get("stats") or {}).get("wrong", 0) for s in ds)
        days.append({
            "date": d,
            "weekday": _weekday_label(d),
            "minutes": minutes,
            "questions": questions,
            "correct": correct,
            "wrong": wrong,
            "sessions": len(ds),
        })

    streak = 0
    d = today
    while finished_by_date.get(d.isoformat()):
        streak += 1
        d -= timedelta(days=1)

    per_subject = {}
    for s in finished:
        for it in s.get("items", []):
            if not it.get("result"):
                continue
            subj = it.get("subject") or "geral"
            row = per_subject.setdefault(subj, {"correct": 0, "wrong": 0, "minutes": 0})
            row["correct" if it["result"] == "correct" else "wrong"] += 1
    for s in finished:
        subj = (s.get("subjects") or [None])[0]
        if subj:
            per_subject.setdefault(subj, {"correct": 0, "wrong": 0, "minutes": 0})

    skills = [(_decayed(s)) for s in await adaptive_store.list_skills(user_id)]
    overall = round(sum(s.get("mastery", 0) for s in skills) / len(skills), 1) if skills else None
    top_topics = sorted(
        [{"topic_id": s["topic_id"], "topic_name": s.get("topic_name", s["topic_id"]),
          "mastery": round(s.get("mastery", 0), 1)} for s in skills],
        key=lambda x: x["mastery"],
    )[:5]

    errors = await adaptive_store.list_errors(user_id, resolved=True)
    week_start = (today - timedelta(days=7)).isoformat()
    resolved_week = [e for e in errors if str(e.get("resolved_at", ""))[:10] >= week_start]

    feynman_logs = await adaptive_store.list_feynman(user_id, limit=3)

    return {
        "days": days,
        "total_minutes": sum(d["minutes"] for d in days),
        "total_questions": sum(d["questions"] for d in days),
        "total_sessions": len(finished),
        "streak": streak,
        "overall_mastery": overall,
        "per_subject": per_subject,
        "errors_resolved_week": len(resolved_week),
        "top_topics": top_topics,
        "recent_feynman": [
            {"topic_name": f.get("topic_name"), "score": f.get("score"), "verdict": f.get("verdict"),
             "date": f.get("created_at", "")[:10]} for f in feynman_logs
        ],
        "available": True,
    }
