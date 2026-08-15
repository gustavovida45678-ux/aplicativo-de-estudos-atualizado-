from dataclasses import dataclass
from typing import List, Optional, Any
import asyncio
import logging

logger = logging.getLogger(__name__)

@dataclass
class UserMessage:
    text: str
    file_contents: Optional[List[Any]] = None

@dataclass
class ImageContent:
    image_base64: str

class LlmChat:
    """
    Minimal shim for emergentintegrations.llm.chat.LlmChat used by the app.
    This implementation is intentionally simple: it returns deterministic mock
    responses when no API key is configured so the app can start. In production,
    replace with the official SDK.
    """
    def __init__(self, api_key: Optional[str] = None, session_id: Optional[str] = None, system_message: Optional[str] = None):
        self.api_key = api_key
        self.session_id = session_id
        self.system_message = system_message
        self._provider = None
        self._model = None

    def with_model(self, provider: str, model: str):
        # Keep track of the requested provider/model (no-op for shim)
        self._provider = provider
        self._model = model
        return self

    async def send_message(self, user_msg: UserMessage) -> str:
        # Simulate network/processing delay minimally
        await asyncio.sleep(0.05)
        # If no API key, return a safe demo string so endpoints that expect a reply work
        if not self.api_key:
            if user_msg.file_contents:
                return "⚠️ Modo demonstração: imagem recebida. Configure EMERGENT_LLM_KEY para respostas reais."
            return "⚠️ Modo demonstração: chave EMERGENT_LLM_KEY não configurada. Configure-a para habilitar IA."
        # If API key present but real SDK unavailable, return a placeholder
        return f"[shim reply] provider={self._provider} model={self._model} session={self.session_id}"
