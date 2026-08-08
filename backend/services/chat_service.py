"""
Unified Chat Service using LiteLLM for multiple free AI providers.
"""

import os
import logging
import itertools
from typing import Optional, List, Dict, Any, AsyncGenerator
from datetime import datetime
import json

import litellm
from litellm import acompletion

from backend.services.providers import (
    get_provider_config,
    get_model_full_id,
    get_default_model,
    get_available_providers,
    get_all_providers_info,
    get_env_key_list,
    AUTO_PRIORITY,
    ProviderType,
)

logger = logging.getLogger(__name__)

# Contador round-robin para distribuir as requisicoes entre multiplas chaves
# (ex: GROQ_API_KEY, GROQ_API_KEY_2, GROQ_API_KEY_3).
_key_rotation_counter = itertools.count()

# Configure LiteLLM
litellm.set_verbose = False
litellm.drop_params = True  # Drop unsupported params automatically

# System prompt for math/exercises
MATH_SYSTEM_PROMPT = """Você é um assistente especializado em matemática e programação para estudantes universitários.
Ao resolver exercícios, siga EXATAMENTE este padrão:

1. **ENTENDIMENTO**: Explique o que o problema pede
2. **CONCEITOS**: Liste os conceitos matemáticos/computacionais necessários
3. **PASSO A PASSO**: Resolva detalhadamente cada etapa
4. **VERIFICAÇÃO**: Confira o resultado
5. **RESPOSTA FINAL**: Apresente a resposta claramente

Seja didático, use linguagem clara e mostre todo o raciocínio."""

class ChatService:
    """Unified chat service supporting multiple AI providers via LiteLLM"""
    
    def __init__(self):
        self.provider_keys: Dict[ProviderType, List[str]] = {}
        self._load_api_keys()
    
    def _load_api_keys(self):
        """Load API keys from environment variables (inclui variantes numeradas para rotacao)"""
        for provider_info in get_all_providers_info():
            ptype = ProviderType(provider_info["type"])
            keys = get_env_key_list(provider_info["env_var"])
            if keys:
                self.provider_keys[ptype] = keys
                logger.info(f"Loaded {len(keys)} key(s) for {provider_info['name']}")
    
    def get_available_providers(self) -> List[Dict[str, Any]]:
        """Get providers that have API keys configured"""
        return get_available_providers()
    
    def get_all_providers(self) -> List[Dict[str, Any]]:
        """Get all providers info"""
        return get_all_providers_info()
    
    def _get_api_keys(self, provider_type: ProviderType, custom_key: Optional[str] = None) -> List[str]:
        """Get ALL API keys for a provider (custom > env). Suporta rotacao."""
        if custom_key:
            return [custom_key]
        return self.provider_keys.get(provider_type, [])

    @staticmethod
    def _is_rate_limited(error: Exception) -> bool:
        """Detecta rate limit (429) para trocar de chave em vez de provedor."""
        msg = str(error).lower()
        return "429" in str(error) or "rate limit" in msg or "rate_limit" in msg or "too many requests" in msg

    def _ordered_providers(self, primary: ProviderType, custom_key: Optional[str] = None) -> List[ProviderType]:
        """Providers disponiveis (com chave), primary primeiro, depois por prioridade."""
        available = [
            p for p in AUTO_PRIORITY
            if get_provider_config(p) and (self.provider_keys.get(p) or (p == primary and custom_key))
        ]
        if primary not in available and get_provider_config(primary) and (self.provider_keys.get(primary) or custom_key):
            available.insert(0, primary)
        return available

    def _rotated_keys(self, provider_type: ProviderType, custom_key: Optional[str] = None) -> List[str]:
        """Lista de chaves do provider em ordem round-robin (distribui a carga)."""
        keys = self._get_api_keys(provider_type, custom_key)
        if not keys:
            return []
        offset = next(_key_rotation_counter) % len(keys)
        return keys[offset:] + keys[:offset]

    async def chat(
        self,
        message: str,
        provider_type: ProviderType,
        model_key: Optional[str] = None,
        custom_api_key: Optional[str] = None,
        system_prompt: Optional[str] = None,
        temperature: float = 0.7,
        max_tokens: int = 4096,
        stream: bool = False,
    ) -> Dict[str, Any]:
        """
        Send a chat message to the specified provider/model.

        Se o provedor principal falhar, tenta automaticamente os demais
        provedores configurados (fallback) para nunca deixar o chat sem resposta.
        """
        if custom_api_key:
            self.provider_keys[provider_type] = [custom_api_key]

        candidates = self._ordered_providers(provider_type, custom_api_key)
        if not candidates:
            configured = [f"{p['name']} ({p.get('env_var', '')})" for p in self.get_available_providers() if p.get("has_key")]
            hint = f" Chaves disponíveis: {', '.join(configured)}." if configured else ""
            raise ValueError(
                "Nenhuma chave API de IA configurada. "
                "Adicione uma chave no Render (ex: GROQ_API_KEY, GEMINI_API_KEY, "
                "ANTHROPIC_API_KEY, OPENROUTER_API_KEY, OPENAI_API_KEY, EMERGENT_LLM_KEY) "
                f"ou envie uma chave personalizada no campo custom_api_key.{hint}"
            )

        last_error: Optional[Exception] = None
        for ptype in candidates:
            # Rotacao de chaves: se uma chave estiver em rate limit, tenta a proxima
            keys = self._rotated_keys(ptype, custom_api_key if ptype == provider_type else None)
            if not keys:
                continue
            for key_index, api_key in enumerate(keys):
                try:
                    return await self._chat_once(
                        message=message,
                        provider_type=ptype,
                        model_key=model_key if ptype == provider_type else None,
                        api_key=api_key,
                        system_prompt=system_prompt,
                        temperature=temperature,
                        max_tokens=max_tokens,
                        stream=stream,
                    )
                except Exception as e:
                    last_error = e
                    if self._is_rate_limited(e) and key_index < len(keys) - 1:
                        logger.warning(f"Provider {ptype.value} (chave {key_index + 1}/{len(keys)}) em rate limit; trocando de chave...")
                        continue
                    logger.warning(f"Provider {ptype.value} falhou ({e}); tentando proximo provedor...")
                    break

        logger.error(f"Todos os provedores falharam. Ultimo erro: {last_error}")
        raise last_error or ValueError("Nenhum provedor de IA respondeu")

    async def _chat_once(
        self,
        message: str,
        provider_type: ProviderType,
        model_key: Optional[str] = None,
        api_key: Optional[str] = None,
        system_prompt: Optional[str] = None,
        temperature: float = 0.7,
        max_tokens: int = 4096,
        stream: bool = False,
    ) -> Dict[str, Any]:
        """
        Send a chat message to the specified provider/model.

        Returns dict with response content and metadata.
        """
        # Get provider config
        provider_config = get_provider_config(provider_type)
        if not provider_config:
            raise ValueError(f"Provider {provider_type} not configured")
        
        # Get model
        if not model_key:
            model_key = get_default_model(provider_type)
        model_id = get_model_full_id(provider_type, model_key)
        if not model_id:
            raise ValueError(f"Model {model_key} not found for provider {provider_type}")
        
        # Get API key
        if not api_key:
            api_keys = self._get_api_keys(provider_type)
            api_key = api_keys[0] if api_keys else None
        if not api_key and provider_config.requires_api_key:
            available = self.get_available_providers()
            key_names = [f"{p['name']} ({p.get('env_var', '')})" for p in available if p.get('has_key')]
            hint = ""
            if key_names:
                hint = f" Chaves disponíveis: {', '.join(key_names)}."
            raise ValueError(
                f"Chave API necessária para {provider_config.name}. "
                f"Configure {provider_config.env_var} no Render ou envie uma chave personalizada.{hint}"
            )
        
        # Prepare messages
        messages = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        messages.append({"role": "user", "content": message})
        
        # Prepare LiteLLM params
        params = {
            "model": model_id,
            "messages": messages,
            "temperature": temperature,
            "max_tokens": max_tokens,
            "stream": stream,
        }
        
        # Add API key if provided
        if api_key:
            params["api_key"] = api_key
        
        # Add base URL for OpenRouter
        if provider_type == ProviderType.OPENROUTER:
            params["api_base"] = "https://openrouter.ai/api/v1"
        elif provider_config.base_url:
            params["api_base"] = provider_config.base_url
        
        try:
            logger.info(f"Sending chat to {provider_config.name} / {model_id}")
            
            if stream:
                # Return async generator for streaming
                return await self._stream_response(params, provider_config.name, model_id)
            else:
                response = await acompletion(**params)
                return self._format_response(response, provider_config.name, model_id)
                
        except Exception as e:
            logger.error(f"Error in chat with {provider_config.name}: {e}")
            raise
    
    async def _stream_response(
        self,
        params: Dict[str, Any],
        provider_name: str,
        model_id: str,
    ) -> AsyncGenerator[Dict[str, Any], None]:
        """Stream response from provider"""
        params["stream"] = True
        stream = await acompletion(**params)
        
        async for chunk in stream:
            if chunk.choices and chunk.choices[0].delta.content:
                yield {
                    "type": "chunk",
                    "content": chunk.choices[0].delta.content,
                    "provider": provider_name,
                    "model": model_id,
                }
        
        yield {
            "type": "done",
            "provider": provider_name,
            "model": model_id,
        }
    
    def _format_response(
        self,
        response: Any,
        provider_name: str,
        model_id: str,
    ) -> Dict[str, Any]:
        """Format LiteLLM response to standard format"""
        content = ""
        if response.choices and response.choices[0].message.content:
            content = response.choices[0].message.content
        
        return {
            "type": "complete",
            "content": content,
            "provider": provider_name,
            "model": model_id,
            "usage": {
                "prompt_tokens": response.usage.prompt_tokens if response.usage else 0,
                "completion_tokens": response.usage.completion_tokens if response.usage else 0,
                "total_tokens": response.usage.total_tokens if response.usage else 0,
            } if response.usage else None,
            "finish_reason": response.choices[0].finish_reason if response.choices else None,
        }
    
    async def chat_with_image(
        self,
        message: str,
        image_base64: str,
        provider_type: ProviderType,
        model_key: Optional[str] = None,
        custom_api_key: Optional[str] = None,
        system_prompt: Optional[str] = None,
        temperature: float = 0.7,
        max_tokens: int = 4096,
    ) -> Dict[str, Any]:
        """Chat with image support (vision models only), com fallback entre provedores e rotacao de chaves."""
        if custom_api_key:
            self.provider_keys[provider_type] = [custom_api_key]

        candidates = [p for p in self._ordered_providers(provider_type, custom_api_key)
                      if self._provider_supports_vision(p)]

        last_error: Optional[Exception] = None
        for ptype in candidates:
            keys = self._rotated_keys(ptype, custom_api_key if ptype == provider_type else None)
            if not keys:
                continue
            for key_index, api_key in enumerate(keys):
                try:
                    return await self._chat_once_with_image(
                        message=message,
                        image_base64=image_base64,
                        provider_type=ptype,
                        model_key=model_key if ptype == provider_type else None,
                        api_key=api_key,
                        system_prompt=system_prompt,
                        temperature=temperature,
                        max_tokens=max_tokens,
                    )
                except Exception as e:
                    last_error = e
                    if self._is_rate_limited(e) and key_index < len(keys) - 1:
                        logger.warning(f"Vision provider {ptype.value} (chave {key_index + 1}/{len(keys)}) em rate limit; trocando de chave...")
                        continue
                    logger.warning(f"Vision provider {ptype.value} falhou ({e}); tentando proximo...")
                    break

        raise last_error or ValueError("Nenhum provedor com suporte a imagem respondeu")

    def _provider_supports_vision(self, provider_type: ProviderType) -> bool:
        config = get_provider_config(provider_type)
        if not config:
            return False
        model_key = get_default_model(provider_type)
        model_config = config.models.get(model_key)
        return bool(model_config and model_config.supports_vision)

    async def _chat_once_with_image(
        self,
        message: str,
        image_base64: str,
        provider_type: ProviderType,
        model_key: Optional[str] = None,
        api_key: Optional[str] = None,
        system_prompt: Optional[str] = None,
        temperature: float = 0.7,
        max_tokens: int = 4096,
    ) -> Dict[str, Any]:
        """Chat with image support (vision models only)"""
        provider_config = get_provider_config(provider_type)
        if not provider_config:
            raise ValueError(f"Provider {provider_type} not configured")
        
        if not model_key:
            model_key = get_default_model(provider_type)
        model_id = get_model_full_id(provider_type, model_key)
        if not model_id:
            raise ValueError(f"Model {model_key} not found for provider {provider_type}")
        
        # Check if model supports vision
        model_config = provider_config.models.get(model_key)
        if not model_config or not model_config.supports_vision:
            raise ValueError(f"Model {model_config.display_name if model_config else model_key} does not support vision")
        
        if not api_key:
            api_keys = self._get_api_keys(provider_type)
            api_key = api_keys[0] if api_keys else None
        if not api_key and provider_config.requires_api_key:
            raise ValueError(f"API key required for {provider_config.name}")
        
        messages = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        
        messages.append({
            "role": "user",
            "content": [
                {"type": "text", "text": message},
                {"type": "image_url", "image_url": {"url": f"data:image/png;base64,{image_base64}"}}
            ]
        })
        
        params = {
            "model": model_id,
            "messages": messages,
            "temperature": temperature,
            "max_tokens": max_tokens,
        }
        
        if api_key:
            params["api_key"] = api_key
        if provider_type == ProviderType.OPENROUTER:
            params["api_base"] = "https://openrouter.ai/api/v1"
        elif provider_config.base_url:
            params["api_base"] = provider_config.base_url
        
        try:
            response = await acompletion(**params)
            return self._format_response(response, provider_config.name, model_id)
        except Exception as e:
            logger.error(f"Error in vision chat with {provider_config.name}: {e}")
            raise


# Singleton instance
chat_service = ChatService()