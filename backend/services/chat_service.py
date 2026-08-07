"""
Unified Chat Service using LiteLLM for multiple free AI providers.
"""

import os
import logging
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
    ProviderType,
)

logger = logging.getLogger(__name__)

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
        self.provider_keys: Dict[ProviderType, str] = {}
        self._load_api_keys()
    
    def _load_api_keys(self):
        """Load API keys from environment variables"""
        for provider_info in get_all_providers_info():
            ptype = ProviderType(provider_info["type"])
            api_key = os.environ.get(provider_info["env_var"])
            if api_key:
                self.provider_keys[ptype] = api_key
                logger.info(f"Loaded API key for {provider_info['name']}")
    
    def get_available_providers(self) -> List[Dict[str, Any]]:
        """Get providers that have API keys configured"""
        return get_available_providers()
    
    def get_all_providers(self) -> List[Dict[str, Any]]:
        """Get all providers info"""
        return get_all_providers_info()
    
    def _get_api_key(self, provider_type: ProviderType, custom_key: Optional[str] = None) -> Optional[str]:
        """Get API key for a provider (custom > env)"""
        if custom_key:
            return custom_key
        return self.provider_keys.get(provider_type)
    
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
        api_key = self._get_api_key(provider_type, custom_api_key)
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
        
        api_key = self._get_api_key(provider_type, custom_api_key)
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