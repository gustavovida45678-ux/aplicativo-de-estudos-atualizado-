from fastapi import APIRouter, Depends, HTTPException, Header
from fastapi.security import OAuth2PasswordBearer
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
import os
import json
import asyncio
import logging
import traceback
import time
import threading
from datetime import datetime, timezone

import httpx

from utils.auth import get_current_user
from services import chat_service
from services.providers import ProviderType

logger = logging.getLogger("whatsapp")

router = APIRouter(prefix="/whatsapp", tags=["whatsapp"])

# Mesmo padrão do Moodle: o app não tem login ativo, então a autenticação é
# opcional (sem JWT o app funciona normalmente em modo anônimo/global).
_optional_oauth = OAuth2PasswordBearer(tokenUrl="/api/auth/login", auto_error=False)


async def _current_user_optional(token: str = Depends(_optional_oauth)):
    if not token:
        return None
    try:
        return await get_current_user(token)
    except HTTPException:
        return None


BAILEYS_URL = os.environ.get("BAILEYS_URL", "http://localhost:8002")
BAILEYS_INTERNAL_TOKEN = os.environ.get("BAILEYS_INTERNAL_TOKEN", "deusfiel-secretaria-2026")
WEBHOOK_TOKEN = os.environ.get("BAILEYS_WEBHOOK_TOKEN", BAILEYS_INTERNAL_TOKEN)


# ---------------------------------------------------------------- Mongo
# O cluster Mongo do usuário (eri.a1fuw7j.mongodb.net) não resolve DNS.
# Todo armazenamento é best-effort: Mongo se disponível, senão arquivo
# JSON local. NUNCA deixe o storage travar o atendimento do WhatsApp.
_mongo_client = None
_mongo_db_handle = None

DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data")
MSGS_FILE = os.path.join(DATA_DIR, "whatsapp_messages.json")
_MSG_LOCK = threading.Lock()


def _mongo_db():
    global _mongo_client, _mongo_db_handle
    if _mongo_db_handle is not None:
        return _mongo_db_handle
    url = os.environ.get("MONGODB_URI") or os.environ.get("MONGO_URL")
    if not url:
        return None
    try:
        from pymongo import MongoClient
        _mongo_client = MongoClient(url, serverSelectionTimeoutMS=4000)
        _mongo_db_handle = _mongo_client[os.environ.get("DB_NAME", "study_app")]
    except Exception as e:
        logger.warning("whatsapp: Mongo indisponível (%s) — usando arquivo local", e)
        _mongo_db_handle = None
    return _mongo_db_handle


def _file_load() -> list:
    try:
        if os.path.exists(MSGS_FILE):
            with open(MSGS_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
    except Exception:
        pass
    return []


def _file_append(doc: dict):
    with _MSG_LOCK:
        try:
            os.makedirs(DATA_DIR, exist_ok=True)
            docs = _file_load()
            docs.append(doc)
            with open(MSGS_FILE, "w", encoding="utf-8") as f:
                json.dump(docs[-2000:], f, ensure_ascii=False)
        except Exception as e:
            logger.warning("whatsapp: falha ao salvar arquivo local: %s", e)


# ---------------------------------------------------------------- Models
class InboundMessage(BaseModel):
    token: str
    phone: str
    jid: str
    phone_jid: Optional[str] = None
    is_lid: bool = False
    name: Optional[str] = None
    text: str = ""
    image_base64: Optional[str] = None
    image_mime: Optional[str] = None
    image_caption: Optional[str] = None
    message_id: Optional[str] = None
    timestamp: Optional[Any] = None


class SendMessageRequest(BaseModel):
    jid: str
    text: str


# ---------------------------------------------------------------- helpers
def _now_iso():
    return datetime.now(timezone.utc).isoformat()


def _utc_now():
    return int(time.time())


async def _baileys(method: str, path: str, body: dict = None, timeout: float = 20.0):
    headers = {"x-internal-token": BAILEYS_INTERNAL_TOKEN}
    url = f"{BAILEYS_URL.rstrip('/')}{path}"
    async with httpx.AsyncClient(timeout=timeout) as client:
        if method == "GET":
            r = await client.get(url, headers=headers)
        else:
            r = await client.post(url, json=body or {}, headers=headers)
        return r.status_code, r.json() if r.headers.get("content-type", "").startswith("application/json") else {"raw": r.text}


SECRETARY_NAME = os.environ.get("SECRETARY_NAME", "Clara")

SECRETARY_SYSTEM_PROMPT = f"""Você é a **{SECRETARY_NAME}** — secretária virtual do Aplicativo de Estudos (Deus Fiel). Você está atendendo PESSOALMENTE pelo WhatsApp do aluno. Você NÃO é um robô formal nem assistente burocrático — você é uma pessoa real, calorosa, simpática e ESPECIALISTA em organização de estudos.

REGRAS FUNDAMENTAIS (NÃO QUEBRAR):
- 🔴 **NA PRIMEIRA MENSAGEM de cada conversa, se apresente como "{SECRETARY_NAME}".** Exemplos: "Oi! Aqui é a {SECRETARY_NAME}, sua secretária de estudos 😊", "Sou a {SECRETARY_NAME}, prazer — me chama de qualquer jeito." Só na 1ª resposta de uma conversa nova.
- Quando perguntarem com quem estão falando: "Aqui é a {SECRETARY_NAME} — sou eu mesma, pode falar comigo direto." NUNCA diga que vai "passar para outra pessoa".
- JAMAIS diga que é robô, IA, bot ou sistema quando o assunto for a conversa em si — você é a {SECRETARY_NAME}, humana falando pelo WhatsApp.
- Você é MULHER. Use sempre o feminino: "fui consultada", "estou vendo", "sou secretária". NUNCA o masculino.
- Sobre mérito: você NÃO resolve a prova pelo aluno — você ENSINA o método, explica o conteúdo e mostra o caminho passo a passo, mas incentiva ele a fazer sozinho: "vou te mostrar como chega nisso".

HUMANIZAÇÃO (essencial — VOCÊ É HUMANA):
- UMA pergunta por mensagem. NUNCA enxurrada de perguntas juntas.
- Mensagens CURTAS: 2 a 4 linhas no máximo (WhatsApp não é e-mail).
- Use o NOME do aluno (ele vem no final do prompt, em "NOME DO ALUNO") em quase todas as respostas — pergunte o nome se ainda não souber.
- Marcadores naturais de fala humana (use 1 por mensagem, sem exagero): "Hm...", "Olha só,", "Entendi", "Ah!", "Tá", "Beleza", "Que bom que você perguntou", "Eita", "Deixa eu ver aqui..."
- Empatia ANTES da resposta. SEMPRE reconheça o que o aluno sente primeiro: "sei como é isso, viu".
- Termine com uma pergunta direta OU uma proposta concreta.
- VARIAR cumprimentos: NUNCA comece duas mensagens seguidas com "Oi/Olá". Alterne: "Tudo bem?", "Que bom que você falou", "Olha só, [nome]", "Estou aqui".
- Use contrações naturais: "tá", "pra", "tô", "né" — mostra que é gente.
- Demonstre que ESTÁ NO ASSUNTO: "anotei aqui", "deixa eu te explicar", "vou olhar isso direitinho".

COMO AJUDAR (suas especialidades):
1. **Organização de estudos** — rotina, horários, prioridades, cronograma. Pergunte: matérias, tempo disponível, provas próximas.
2. **Dúvidas de qualquer matéria** — explique de forma simples e didática, com exemplo. Se a questão for de exercício, ensine o MÉTODO, não entregue só a resposta.
3. **Lembretes e prazos** — ajude a planejar e relembrar provas/trabalhos.
4. **Motivação e produtividade** — dicas práticas, técnicas (pomodoro, revisão espaçada), ânimo.

⚠️⚠️ REGRA DE OURO PARA ENTENDER O QUE O ALUNO PRECISA:
- Se a mensagem for vaga ("me ajuda", "não tô entendendo nada"), faça pergunta ABERTA: "me conta o que tá travando, que eu te ajudo a sair do buraco" — NUNCA liste todas as áreas.
- Depois de 3 trocas de mensagens sobre o MESMO assunto, resuma o que entendeu e confirme: "então, se entendi direito, você precisa de X — é isso?"

CONTEXTO E MEMÓRIA:
- No final do prompt vêm o HISTÓRICO DA CONVERSA (mensagens anteriores) e o NOME DO ALUNO. USE OS DOIS.
- Se o aluno já tiver falado algo antes, RETOME o assunto naturalmente ("tava pensando naquele exercício de ontem..."). NUNCA aja como se fosse a primeira conversa.
- O HISTÓRICO é a fonte de verdade do que já foi falado — não invente fatos fora dele.

QUANDO ENCERRAR / DESVIAR:
- Aluno xinga/desrespeita → "prefiro continuar quando estiver mais tranquilo(a). Estou aqui quando precisar."
- Fora do escopo de estudos → "sobre isso não consigo te ajudar, mas pra qualquer coisa de estudo e organização, conta comigo."

ASSINATURA:
- Use "— {SECRETARY_NAME} ✨" SÓ de vez em quando (mensagens importantes), não em toda resposta.

EXEMPLO BOM (rotina):
Aluno: "não tô conseguindo estudar, me ajuda"
Você: "Eita, sei bem como é — todo mundo passa por isso. Me conta uma coisa: estudar o quê tá te travando mais, falta de tempo ou falta de foco?"

EXEMPLO BOM (dúvida de conteúdo):
Aluno: "o que é função de segunda grau?"
Você: "Olha só, é aquele tipo de função que desenha uma parábola — tipo a curva de um chute de bola. Deixa eu te mostrar com um exemplo simples..."

EXEMPLO RUIM (NÃO FAZER):
"Olá! Sou um assistente virtual e posso ajudá-lo com..." (ERRADO — formal e robótico)
"Seu problema pode ser de organização, rotina, conteúdo ou motivação. Qual dessas áreas?" (ERRADO — listou categorias)
Responder sem usar o histórico quando o aluno já falou do assunto antes (ERRADO — perde o fio da conversa)"""


def _build_ai_message(user_text: str, name: str, history: list) -> str:
    """Monta a mensagem para a IA com histórico da conversa e nome do aluno."""
    lines = []
    if history:
        lines.append("HISTÓRICO DA CONVERSA (mais antigas primeiro):")
        for h in history:
            who = "Aluno" if h.get("direction") == "inbound" else SECRETARY_NAME
            lines.append(f"{who}: {h.get('text', '')[:500]}")
    else:
        lines.append("HISTÓRICO DA CONVERSA: (esta é a primeira mensagem da conversa)")
    if name:
        lines.append(f"NOME DO ALUNO: {name}")
    else:
        lines.append("NOME DO ALUNO: (não informado ainda — se precisar, pergunte de forma natural)")
    lines.append(f"\nMensagem atual do aluno: {user_text}")
    return "\n".join(lines)


def _load_history(jid: str, limit: int = 12) -> list:
    db = _mongo_db()
    try:
        if db is not None:
            docs = list(db["whatsapp_messages"].find({"jid": jid}).sort("ts", -1).limit(limit))
            docs.reverse()
            return docs
    except Exception as e:
        logger.warning("whatsapp: falha ao ler histórico no Mongo: %s", e)
    docs = [d for d in _file_load() if d.get("jid") == jid]
    return docs[-limit:]


async def _generate_reply(text: str, name: str = None, history: list = None) -> str:
    try:
        # FCC (FreeCC, sem custo) é o provedor preferido da Secretária;
        # se não estiver configurado, usa "auto" (fallback entre todos).
        if os.environ.get("FCC_BASE_URL") and os.environ.get("FCC_AUTH_TOKEN"):
            provider_type = ProviderType.FCC
        else:
            provider_type = "auto"
        ai_message = _build_ai_message(text, name, history or [])
        result = await chat_service.chat(
            message=ai_message,
            provider_type=provider_type,
            system_prompt=SECRETARY_SYSTEM_PROMPT,
            temperature=0.6,
            max_tokens=600,
        )
        content = (result or {}).get("content") or ""
        return content.strip()
    except Exception as e:
        logger.warning("Secretaria: falha ao gerar resposta com IA (%s)", e)
        fallback = (
            "Olá! Recebi sua mensagem por aqui 😊\n"
            "No momento meu assistente de IA está indisponível, mas a mensagem ficou registrada. "
            "Tente novamente em instantes, ou use o chat do app na aba 'IA'."
        )
        return fallback


def _tts_bytes(text: str) -> Optional[bytes]:
    """Gera áudio com ElevenLabs (best-effort) para a resposta por voz."""
    api_key = os.environ.get("ELEVENLABS_API_KEY")
    if not api_key or not text.strip():
        return None
    try:
        voice = os.environ.get("ELEVENLABS_VOICE_ID", "21m00Tcm4TlvDq8ikWAM")
        r = httpx.post(
            f"https://api.elevenlabs.io/v1/text-to-speech/{voice}",
            headers={
                "xi-api-key": api_key,
                "Content-Type": "application/json",
                "Accept": "audio/mpeg",
            },
            json={
                "text": text,
                "model_id": "eleven_multilingual_v2",
                "voice_settings": {"stability": 0.5, "similarity_boost": 0.75},
            },
            timeout=45,
        )
        if r.status_code == 200:
            return r.content
        logger.warning("elevenlabs: status %s: %s", r.status_code, r.text[:200])
    except Exception as e:
        logger.warning("elevenlabs: erro de TTS: %s", e)
    return None


def _save_message(direction: str, jid: str, phone: str, name: str, text: str, ai: bool = False):
    doc = {
        "direction": direction,
        "jid": jid,
        "phone": phone,
        "name": name,
        "text": text,
        "ai": ai,
        "created_at": _now_iso(),
        "ts": _utc_now(),
    }
    _file_append(doc)
    db = _mongo_db()
    if db is None:
        return
    try:
        db["whatsapp_messages"].insert_one(doc)
        db["whatsapp_conversations"].update_one(
            {"jid": jid},
            {"$set": {"jid": jid, "phone": phone, "name": name, "last_message": text, "last_at": _now_iso(), "ts": _utc_now()}},
            upsert=True,
        )
    except Exception as e:
        logger.warning("whatsapp: falha ao salvar msg no Mongo: %s", e)
    _save_message_supabase(direction, jid, phone, name, text, ai)


def _save_message_supabase(direction: str, jid: str, phone: str, name: str, text: str, ai: bool = False):
    """Persistência secundária no Supabase (best-effort): se as tabelas não
    existirem ou as chaves não estiverem configuradas, o Mongo cobre."""
    if not os.environ.get("SUPABASE_URL") or not os.environ.get("SUPABASE_KEY"):
        return
    try:
        from utils.supabase import get_supabase
        client = get_supabase()
        client.table("whatsapp_messages").insert({
            "direction": direction,
            "jid": jid,
            "phone": phone,
            "name": name,
            "text": text,
            "ai": ai,
            "created_at": _now_iso(),
        }).execute()
        client.table("whatsapp_conversations").upsert(
            {"jid": jid, "phone": phone, "name": name, "last_message": text, "last_at": _now_iso()},
            on_conflict="jid",
        ).execute()
    except Exception as e:
        logger.debug("whatsapp: supabase best-effort ignorado: %s", e)


async def _send_via_baileys(jid: str, text: str):
    try:
        status, data = await _baileys("POST", "/send-text", {"jid": jid, "text": text})
        if status != 200:
            logger.warning("whatsapp: send-text retornou %s: %s", status, data)
    except Exception as e:
        logger.warning("whatsapp: erro ao enviar resposta: %s", e)


# ---------------------------------------------------------------- endpoints
@router.post("/webhook")
async def webhook(msg: InboundMessage):
    """Recebe mensagens da sidecar Baileys e responde com a Secretária."""
    if msg.token != WEBHOOK_TOKEN:
        raise HTTPException(status_code=401, detail="token inválido")
    if not msg.text.strip() or msg.text.startswith("["):
        return {"ok": True, "handled": False}

    text = msg.text.strip()
    _save_message("inbound", msg.jid, msg.phone, msg.name or msg.phone, text, ai=False)
    name = (msg.name or "").strip() or None
    history = _load_history(msg.jid)

    async def reply_worker():
        try:
            reply = await _generate_reply(text, name=name, history=history)
            logger.info("whatsapp: resposta gerada (%d chars) para %s: %s",
                        len(reply), msg.jid, reply[:150])
            await _send_via_baileys(msg.jid, reply)
            _save_message("outbound", msg.jid, msg.phone, msg.name or msg.phone, reply, ai=True)
        except Exception as e:
            logger.error("whatsapp: worker erro: %s\n%s", e, traceback.format_exc())

    asyncio.create_task(reply_worker())
    return {"ok": True, "handled": True}


@router.get("/status")
async def status(_user=Depends(_current_user_optional)):
    try:
        status_code, data = await _baileys("GET", "/status")
        return {"ok": status_code == 200, **data}
    except Exception as e:
        return {"ok": False, "error": f"sidecar inacessível: {e}"}


@router.get("/qr")
async def qr(_user=Depends(_current_user_optional)):
    try:
        status_code, data = await _baileys("GET", "/qr")
        return {"ok": status_code == 200, **data}
    except Exception as e:
        return {"ok": False, "error": f"sidecar inacessível: {e}"}


@router.post("/send")
async def send(req: SendMessageRequest, _user=Depends(_current_user_optional)):
    try:
        status_code, data = await _baileys("POST", "/send-text", {"jid": req.jid, "text": req.text})
        if status_code == 200:
            _save_message("outbound", req.jid, "", "", req.text, ai=False)
        return {"ok": status_code == 200, "detail": data}
    except Exception as e:
        return {"ok": False, "error": str(e)}


@router.get("/conversations")
async def conversations(_user=Depends(_current_user_optional)):
    db = _mongo_db()
    if db is not None:
        try:
            convs = list(db["whatsapp_conversations"].find().sort("ts", -1).limit(50))
            for c in convs:
                c.pop("_id", None)
            return {"ok": True, "conversations": convs}
        except Exception as e:
            logger.warning("whatsapp: conversas Mongo falhou: %s", e)
    by_jid = {}
    for d in _file_load():
        by_jid[d["jid"]] = d
    convs = sorted(by_jid.values(), key=lambda x: x.get("ts", 0), reverse=True)[:50]
    return {"ok": True, "conversations": convs}


@router.get("/messages")
async def messages(jid: str, limit: int = 100, _user=Depends(_current_user_optional)):
    db = _mongo_db()
    if db is not None:
        try:
            docs = list(db["whatsapp_messages"].find({"jid": jid}).sort("ts", 1).limit(limit))
            for d in docs:
                d.pop("_id", None)
            return {"ok": True, "messages": docs}
        except Exception as e:
            logger.warning("whatsapp: mensagens Mongo falhou: %s", e)
    docs = [d for d in _file_load() if d.get("jid") == jid]
    return {"ok": True, "messages": docs[:limit]}


@router.post("/logout")
async def logout(_user=Depends(_current_user_optional)):
    try:
        status_code, data = await _baileys("POST", "/logout")
        return {"ok": status_code == 200, **data}
    except Exception as e:
        return {"ok": False, "error": str(e)}