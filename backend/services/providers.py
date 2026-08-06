"""
Free AI Providers Configuration for LiteLLM
Maps each provider to their LiteLLM model identifiers and required environment variables.
"""

import os
from typing import Dict, List, Optional, Any
from dataclasses import dataclass
from enum import Enum

class ProviderType(str, Enum):
    GEMINI = "gemini"
    CLAUDE = "claude"
    PERPLEXITY = "perplexity"
    DEEPSEEK = "deepseek"
    COPILOT = "copilot"
    HUGGINGCHAT = "huggingchat"
    META_AI = "meta_ai"
    FREE_AI = "free_ai"
    GROQ = "groq"
    OPENROUTER = "openrouter"

@dataclass
class ModelConfig:
    """Configuration for a specific model"""
    model_id: str
    display_name: str
    supports_vision: bool = False
    supports_streaming: bool = True
    max_tokens: int = 4096
    context_window: int = 8192

@dataclass
class ProviderConfig:
    """Configuration for an AI provider"""
    type: ProviderType
    name: str
    category: str
    models: Dict[str, ModelConfig]
    env_var: str
    base_url: Optional[str] = None
    requires_api_key: bool = True
    free_tier_description: str = ""
    website: str = ""
    icon: str = "brain"

# Provider configurations with LiteLLM model identifiers
PROVIDERS: Dict[ProviderType, ProviderConfig] = {
    ProviderType.GEMINI: ProviderConfig(
        type=ProviderType.GEMINI,
        name="Google Gemini",
        category="Multimodal",
        models={
            "gemini-1.5-flash": ModelConfig(
                model_id="gemini/gemini-1.5-flash",
                display_name="Gemini 1.5 Flash",
                supports_vision=True,
                context_window=1000000
            ),
            "gemini-1.5-pro": ModelConfig(
                model_id="gemini/gemini-1.5-pro",
                display_name="Gemini 1.5 Pro",
                supports_vision=True,
                context_window=2000000
            ),
            "gemini-1.5-flash-8b": ModelConfig(
                model_id="gemini/gemini-1.5-flash-8b",
                display_name="Gemini 1.5 Flash-8B",
                supports_vision=True,
                context_window=1000000
            ),
        },
        env_var="GEMINI_API_KEY",
        free_tier_description="Generoso - uso diário limitado (Flash grátis, Pro limitado)",
        website="https://aistudio.google.com/apikey",
        icon="sparkles"
    ),
    ProviderType.CLAUDE: ProviderConfig(
        type=ProviderType.CLAUDE,
        name="Claude (Anthropic)",
        category="Raciocínio",
        models={
            "claude-3-5-sonnet-20241022": ModelConfig(
                model_id="anthropic/claude-3-5-sonnet-20241022",
                display_name="Claude 3.5 Sonnet",
                supports_vision=True,
                context_window=200000
            ),
            "claude-3-5-haiku-20241022": ModelConfig(
                model_id="anthropic/claude-3-5-haiku-20241022",
                display_name="Claude 3.5 Haiku",
                supports_vision=True,
                context_window=200000
            ),
            "claude-3-opus-20240229": ModelConfig(
                model_id="anthropic/claude-3-opus-20240229",
                display_name="Claude 3 Opus",
                supports_vision=True,
                context_window=200000
            ),
        },
        env_var="ANTHROPIC_API_KEY",
        free_tier_description="Limites variáveis por hora",
        website="https://console.anthropic.com/",
        icon="brain-circuit"
    ),
    ProviderType.PERPLEXITY: ProviderConfig(
        type=ProviderType.PERPLEXITY,
        name="Perplexity AI",
        category="Pesquisa",
        models={
            "llama-3.1-sonar-small-128k-online": ModelConfig(
                model_id="perplexity/llama-3.1-sonar-small-128k-online",
                display_name="Sonar Small (Online)",
                context_window=128000
            ),
            "llama-3.1-sonar-large-128k-online": ModelConfig(
                model_id="perplexity/llama-3.1-sonar-large-128k-online",
                display_name="Sonar Large (Online)",
                context_window=128000
            ),
            "llama-3.1-sonar-huge-128k-online": ModelConfig(
                model_id="perplexity/llama-3.1-sonar-huge-128k-online",
                display_name="Sonar Huge (Online)",
                context_window=128000
            ),
        },
        env_var="PERPLEXITY_API_KEY",
        free_tier_description="Buscas básicas ilimitadas, Pro Search 3-5/dia",
        website="https://www.perplexity.ai/settings/api",
        icon="search"
    ),
    ProviderType.DEEPSEEK: ProviderConfig(
        type=ProviderType.DEEPSEEK,
        name="DeepSeek",
        category="Código/Raciocínio",
        models={
            "deepseek-chat": ModelConfig(
                model_id="deepseek/deepseek-chat",
                display_name="DeepSeek V3 (Chat)",
                context_window=64000
            ),
            "deepseek-reasoner": ModelConfig(
                model_id="deepseek/deepseek-reasoner",
                display_name="DeepSeek R1 (Reasoning)",
                context_window=64000
            ),
        },
        env_var="DEEPSEEK_API_KEY",
        base_url="https://api.deepseek.com/v1",
        free_tier_description="Quase ilimitado (500 msgs/hora anti-bot)",
        website="https://platform.deepseek.com/",
        icon="code"
    ),
    ProviderType.GROQ: ProviderConfig(
        type=ProviderType.GROQ,
        name="Groq",
        category="Velocidade",
        models={
            "llama-3.3-70b-versatile": ModelConfig(
                model_id="groq/llama-3.3-70b-versatile",
                display_name="Llama 3.3 70B Versatile",
                context_window=128000
            ),
            "llama-3.1-70b-versatile": ModelConfig(
                model_id="groq/llama-3.1-70b-versatile",
                display_name="Llama 3.1 70B Versatile",
                context_window=128000
            ),
            "mixtral-8x7b-32768": ModelConfig(
                model_id="groq/mixtral-8x7b-32768",
                display_name="Mixtral 8x7B",
                context_window=32768
            ),
            "gemma2-9b-it": ModelConfig(
                model_id="groq/gemma2-9b-it",
                display_name="Gemma 2 9B",
                context_window=8192
            ),
        },
        env_var="GROQ_API_KEY",
        free_tier_description="14.400 req/dia grátis",
        website="https://console.groq.com/keys",
        icon="zap"
    ),
    ProviderType.OPENROUTER: ProviderConfig(
        type=ProviderType.OPENROUTER,
        name="OpenRouter",
        category="Agregador",
        models={
            "nemotron-3-ultra": ModelConfig(
                model_id="openrouter/nvidia/nemotron-3-ultra",
                display_name="Nemotron 3 Ultra (Free)",
                context_window=4096
            ),
            "qwen-2.5-72b-instruct": ModelConfig(
                model_id="openrouter/qwen/qwen-2.5-72b-instruct",
                display_name="Qwen 2.5 72B (Free)",
                context_window=32768
            ),
            "mistral-nemo": ModelConfig(
                model_id="openrouter/mistralai/mistral-nemo",
                display_name="Mistral Nemo (Free)",
                context_window=128000
            ),
            "deepseek-v3": ModelConfig(
                model_id="openrouter/deepseek/deepseek-chat",
                display_name="DeepSeek V3 via OpenRouter",
                context_window=64000
            ),
        },
        env_var="OPENROUTER_API_KEY",
        free_tier_description="Créditos diários grátis",
        website="https://openrouter.ai/keys",
        icon="git-merge"
    ),
    ProviderType.FREE_AI: ProviderConfig(
        type=ProviderType.FREE_AI,
        name="Free.ai",
        category="Plataforma Completa",
        models={
            "qwen-2.5-72b": ModelConfig(
                model_id="free-ai/qwen-2.5-72b",
                display_name="Qwen 2.5 72B",
                context_window=32768
            ),
        },
        env_var="FREE_AI_API_KEY",
        base_url="https://api.free.ai/v1",
        free_tier_description="30.000 tokens/dia",
        website="https://free.ai",
        icon="gift"
    ),
}

# Default model per provider (first one listed)
DEFAULT_MODELS = {
    ProviderType.GEMINI: "gemini-1.5-flash",
    ProviderType.CLAUDE: "claude-3-5-sonnet-20241022",
    ProviderType.PERPLEXITY: "llama-3.1-sonar-small-128k-online",
    ProviderType.DEEPSEEK: "deepseek-chat",
    ProviderType.GROQ: "llama-3.3-70b-versatile",
    ProviderType.OPENROUTER: "nemotron-3-ultra",
    ProviderType.FREE_AI: "qwen-2.5-72b",
}

def get_provider_config(provider_type: ProviderType) -> Optional[ProviderConfig]:
    """Get provider configuration by type"""
    return PROVIDERS.get(provider_type)

def get_available_providers() -> List[Dict[str, Any]]:
    """Get list of providers that have API keys configured"""
    available = []
    for provider_type, config in PROVIDERS.items():
        api_key = os.environ.get(config.env_var)
        if api_key or not config.requires_api_key:
            models = []
            for model_key, model_config in config.models.items():
                models.append({
                    "id": model_key,
                    "name": model_config.display_name,
                    "model_id": model_config.model_id,
                    "supports_vision": model_config.supports_vision,
                    "context_window": model_config.context_window,
                })
            available.append({
                "type": provider_type.value,
                "name": config.name,
                "category": config.category,
                "models": models,
                "default_model": DEFAULT_MODELS.get(provider_type, list(config.models.keys())[0]),
                "free_tier": config.free_tier_description,
                "website": config.website,
                "icon": config.icon,
                "has_key": bool(api_key),
            })
    return available

def get_all_providers_info() -> List[Dict[str, Any]]:
    """Get info for all providers (including those without keys)"""
    all_providers = []
    for provider_type, config in PROVIDERS.items():
        api_key = os.environ.get(config.env_var)
        models = []
        for model_key, model_config in config.models.items():
            models.append({
                "id": model_key,
                "name": model_config.display_name,
                "model_id": model_config.model_id,
                "supports_vision": model_config.supports_vision,
                "context_window": model_config.context_window,
            })
        all_providers.append({
            "type": provider_type.value,
            "name": config.name,
            "category": config.category,
            "models": models,
            "default_model": DEFAULT_MODELS.get(provider_type, list(config.models.keys())[0]),
            "free_tier": config.free_tier_description,
            "website": config.website,
            "icon": config.icon,
            "has_key": bool(api_key),
            "env_var": config.env_var,
        })
    return all_providers

def get_model_full_id(provider_type: ProviderType, model_key: str) -> Optional[str]:
    """Get the full LiteLLM model ID for a provider/model combination"""
    config = get_provider_config(provider_type)
    if not config:
        return None
    model_config = config.models.get(model_key)
    if not model_config:
        return None
    return model_config.model_id

def get_default_model(provider_type: ProviderType) -> str:
    """Get default model key for a provider"""
    return DEFAULT_MODELS.get(provider_type, list(PROVIDERS[provider_type].models.keys())[0])