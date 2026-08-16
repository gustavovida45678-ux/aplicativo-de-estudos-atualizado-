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
_mongo_client = None
_mongo_db_handle = None


def _mongo_db():
    global _mongo_client, _mongo_db_handle
    if _mongo_db_handle is not None:
        return _mongo_db_handle
    url = os.environ.get("MONGODB_URI")
    if not url:
        return None
    from pymongo import MongoClient
    _mongo_client = MongoClient(url, serverSelectionTimeoutMS=4000)
    _mongo_db_handle = _mongo_client[os.environ.get("DB_NAME", "study_app")]
    return _mongo_db_handle


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


SECRETARY_SYSTEM_PROMPT = """Você é a Secretária Virtual do Aplicativo de Estudos (Deus Fiel).
Você ajuda o aluno com:
- Organização dos estudos, horários e rotina
- Dúvidas de qualquer matéria (explicações simples e didáticas)
- Lembretes de prazos e provas
- Dicas de produtividade e motivação

Regras:
- Responda sempre em português (pt-BR), de forma curta e direta (máx. 8 linhas),
  como uma mensagem de WhatsApp.
- Se a pergunta for de conteúdo acadêmico, explique passo a passo de forma didática.
- Se o aluno pedir algo fora do seu alcance (ex: resolver uma questão por ele),
  explique o método e dê a resposta final, incentivando o estudo.
- Nunca invente dados sobre a vida pessoal do aluno.
- Seja simpática e use emojis com moderação. Assine como "Secretária Virtual ✨".
"""


async def _generate_reply(text: str) -> str:
    try:
        # FCC (FreeCC, sem custo) é o provedor preferido da Secretária;
        # se não estiver configurado, usa "auto" (fallback entre todos).
        if os.environ.get("FCC_BASE_URL") and os.environ.get("FCC_AUTH_TOKEN"):
            provider_type = ProviderType.FCC
        else:
            provider_type = "auto"
        result = await chat_service.chat(
            message=text,
            provider_type=provider_type,
            system_prompt=SECRETARY_SYSTEM_PROMPT,
            temperature=0.5,
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
    db = _mongo_db()
    if not db:
        return
    try:
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

    async def reply_worker():
        try:
            reply = await _generate_reply(text)
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
    if not db:
        return {"ok": True, "conversations": []}
    try:
        convs = list(db["whatsapp_conversations"].find().sort("ts", -1).limit(50))
        for c in convs:
            c.pop("_id", None)
        return {"ok": True, "conversations": convs}
    except Exception as e:
        return {"ok": False, "error": str(e)}


@router.get("/messages")
async def messages(jid: str, limit: int = 100, _user=Depends(_current_user_optional)):
    db = _mongo_db()
    if not db:
        return {"ok": True, "messages": []}
    try:
        docs = list(db["whatsapp_messages"].find({"jid": jid}).sort("ts", 1).limit(limit))
        for d in docs:
            d.pop("_id", None)
        return {"ok": True, "messages": docs}
    except Exception as e:
        return {"ok": False, "error": str(e)}


@router.post("/logout")
async def logout(_user=Depends(_current_user_optional)):
    try:
        status_code, data = await _baileys("POST", "/logout")
        return {"ok": status_code == 200, **data}
    except Exception as e:
        return {"ok": False, "error": str(e)}