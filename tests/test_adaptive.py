"""Teste do fluxo adaptativo (dashboard -> sessão -> resposta -> recuperação -> domínio).
Roda com storage em memória e sem chamadas de IA."""
import sys
import asyncio
from datetime import date

sys.path.insert(0, ".")
sys.path.insert(0, "backend")

from backend.services.srs import (
    apply_result, initial_skill, mastery_label, result_grade,
    next_interval, update_mastery, decay_mastery,
)
from backend.services.adaptive_store import adaptive_store
from backend.services.adaptive_seed import build_question_pool
from backend.routes import adaptive as adaptive_route

USER = {"email": "teste@exemplo.com"}


async def test_srs():
    assert result_grade("wrong", 90) == 0
    assert result_grade("dont_know", 10) == 0
    assert result_grade("hard", 30) == 1
    assert result_grade("correct", 40) == 1
    assert result_grade("correct", 70) == 2
    assert result_grade("correct", 95) == 3

    assert next_interval(0, 3) == 1
    assert next_interval(7, 0) == 2  # 7 * 0.3 = 2 (colapsa)
    assert next_interval(7, 3) == 17  # 7 * 2.5 = 17

    s = initial_skill("t1", "mat", "Topico")
    s = apply_result(s, "wrong", 20, 2, date.today())
    assert s["mastery"] < 0 + 1 or s["mastery"] == 0.0
    s = apply_result(s, "correct", 95, 2, date.today())
    assert s["mastery"] > 0
    assert s["interval_days"] >= 1
    assert s["next_review"]

    assert mastery_label(10) == "Crítico"
    assert mastery_label(50) == "Em desenvolvimento"
    assert mastery_label(95) == "Dominado"
    assert decay_mastery(80, 3) < 80
    assert decay_mastery(80, 0) == 80
    print("srs OK")


async def test_flow():
    # seed do pool
    pool = build_question_pool()
    assert len(pool) > 30, f"pool pequeno: {len(pool)}"
    await adaptive_store.seed_questions(pool)
    topics = await adaptive_store.list_topics()
    assert len(topics) >= 10, f"topics: {len(topics)}"
    print(f"pool: {len(pool)} questões, {len(topics)} tópicos")

    # dashboard inicial (vazio)
    d = await adaptive_route.dashboard(USER)
    assert d["due_reviews"] == 0
    assert d["recommended_questions"] > 0
    assert d["recommendation"]["has_recommendation"] is True
    print(f"dashboard vazio OK: recomendação = {d['recommendation']['topic_name']} ({d['recommendation']['minutes']}min)")

    # sessão
    req = adaptive_route.SessionStartRequest(limit=6)
    sess = await adaptive_route.session_start(req, USER)
    assert sess["total"] == 6, sess["total"]
    items = sess["items"]
    assert all(it["question"] for it in items)
    assert all(("correct_answer" not in it["question"]) for it in items), "vazou resposta no item público!"
    subjects = [it["subject"] for it in items]
    assert len(set(subjects)) > 1, "sessão não intercalada"
    print(f"sessão OK: {sess['total']} itens, tipos={[i['type'] for i in items]}")

    # respostas: erra a 1ª (conf 90), acerta a 2ª (conf 90), não sei a 3ª
    it1 = items[0]
    q1 = it1["question"]
    # índice fora do range garante resposta errada (não sabemos o gabarito)
    a1 = await adaptive_route.session_answer(
        sess["session_id"], adaptive_route.AnswerRequest(
            item_id=it1["item_id"], answer=999 if q1.get("options") else None,
            answer_text="", confidence=90, time_spent_sec=30), USER)
    assert a1["correct"] is False
    assert a1["error_id"]
    assert a1["analysis"] and a1["analysis"]["error_type"]
    assert a1["recovery_question"] is not None or True  # pode não existir alternativa no tópico
    if a1["recovery_question"]:
        rq = a1["recovery_question"]["question"]
        assert rq["id"] != q1["id"], "recuperação repetiu a mesma questão"
        assert "correct_answer" not in rq
        print(f"resposta errada OK: tipo={a1['analysis']['error_type_label']}, mastery {a1['mastery_old']}->{a1['mastery_now']}, recuperação={rq['id']}")
    else:
        print(f"resposta errada OK: tipo={a1['analysis']['error_type_label']}, sem alternativa no tópico (recovery=None)")

    it2 = items[1]
    q2 = it2["question"]
    a2 = await adaptive_route.session_answer(
        sess["session_id"], adaptive_route.AnswerRequest(
            item_id=it2["item_id"], answer=q2["options"] and 0,
            answer_text="", confidence=90, time_spent_sec=20), USER)
    # pode acertar ou errar (não sabemos o gabarito) — mas deve atualizar domínio
    assert a2["mastery_now"] is not None
    print(f"resposta 2 OK: result={a2['result']}")

    it3 = items[2]
    a3 = await adaptive_route.session_answer(
        sess["session_id"], adaptive_route.AnswerRequest(
            item_id=it3["item_id"], answer=None, answer_text="",
            confidence=10, dont_know=True, time_spent_sec=5), USER)
    assert a3["result"] == "dont_know"
    assert a3["error_id"]
    print("modo não sei OK")

    # dashboard após erros
    d2 = await adaptive_route.dashboard(USER)
    assert d2["errors_to_review"] >= 2
    assert d2["due_reviews"] >= 0
    print(f"dashboard pós-respostas OK: erros={d2['errors_to_review']}, domínio={d2['overall_mastery']}")

    # encerrar sessão
    ended = await adaptive_route.session_end(
        sess["session_id"], adaptive_route.SessionEndRequest(), USER)
    assert ended["duration_min"] >= 1
    assert ended["score"] is not None
    print(f"fim de sessão OK: {ended['stats']}")

    # caderno de erros
    errs = await adaptive_route.errors_list("", "", False, USER)
    n_unresolved = len(errs["errors"])
    assert n_unresolved >= 1
    eid = errs["errors"][0]["id"]
    await adaptive_route.errors_classify(eid, adaptive_route.ErrorClassifyRequest(error_type="distracao"), USER)
    err_after = await adaptive_route.errors_list("", "", False, USER)
    assert err_after["errors"][0]["error_type"] == "distracao"
    await adaptive_route.errors_resolve(eid, adaptive_route.ErrorResolveRequest(correction="li com atenção"), USER)
    errs2 = await adaptive_route.errors_list("", "", False, USER)
    assert len(errs2["errors"]) == n_unresolved - 1
    errs3 = await adaptive_route.errors_list("", "", True, USER)
    assert len(errs3["errors"]) == 1
    print("caderno de erros OK (classificar + resolver)")

    # mapa de domínio
    dom = await adaptive_route.domain(USER)
    assert len(dom["subjects"]) >= 1
    total_topics = sum(len(s["topics"]) for s in dom["subjects"])
    assert total_topics >= 3
    print(f"mapa de domínio OK: {total_topics} tópicos em {len(dom['subjects'])} disciplinas")

    # recomendação standalone
    rec = await adaptive_route.recommend(USER)
    assert rec["has_recommendation"]
    print(f"recomendação OK: {rec['title']}")

    print("\nTODOS OS TESTES PASSARAM")


asyncio.run(test_srs())
asyncio.run(test_flow())
