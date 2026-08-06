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
    OLLAMA = "ollama"
    XAI = "xai"
    COHERE = "cohere"
    TOGETHER = "together"
    FIREWORKS = "fireworks"
    HUGGINGFACE = "huggingface"

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
            "claude-sonnet-4-20250514": ModelConfig(
                model_id="anthropic/claude-sonnet-4-20250514",
                display_name="Claude Sonnet 4",
                supports_vision=True,
                context_window=200000
            ),
            "claude-3-5-sonnet-20241022": ModelConfig(
                model_id="anthropic/claude-3-5-sonnet-20241022",
                display_name="Claude 3.5 Sonnet",
                supports_vision=True,
                context_window=200000
            ),
            "claude-3-5-haiku-20241022": ModelConfig(
                model_id="anthropic/claude-3-5-haiku-20241022",
                display_name="Claude 3.5 Haiku (mais barato)",
                supports_vision=True,
                context_window=200000
            ),
            "claude-3-haiku-20240307": ModelConfig(
                model_id="anthropic/claude-3-haiku-20240307",
                display_name="Claude 3 Haiku (rápido/barato)",
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
        free_tier_description="Limites variáveis por hora; Haiku e Sonnet com boa relação custo",
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
            "claude-3-5-sonnet": ModelConfig(
                model_id="openrouter/anthropic/claude-3.5-sonnet",
                display_name="Claude 3.5 Sonnet (via OpenRouter)",
                context_window=200000,
                supports_vision=True
            ),
            "claude-3-5-haiku": ModelConfig(
                model_id="openrouter/anthropic/claude-3.5-haiku",
                display_name="Claude 3.5 Haiku (via OpenRouter)",
                context_window=200000,
                supports_vision=True
            ),
            "claude-3-7-sonnet": ModelConfig(
                model_id="openrouter/anthropic/claude-3.7-sonnet",
                display_name="Claude 3.7 Sonnet (via OpenRouter)",
                context_window=200000,
                supports_vision=True
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
ProviderType.OLLAMA: ProviderConfig(
        type=ProviderType.OLLAMA,
        name="Ollama (Local)",
        category="Local - Sem Chave",
        models={
            "gemma4-12b": ModelConfig(
                model_id="ollama/gemma4:12b",
                display_name="Gemma 4 12B",
                context_window=262144,
                supports_vision=True
            ),
            "qwen-hermes": ModelConfig(
                model_id="ollama/qwen-hermes:latest",
                display_name="Qwen Hermes 3B",
                context_window=32768
            ),
            "qwen2.5-3b": ModelConfig(
                model_id="ollama/qwen2.5:3b",
                display_name="Qwen 2.5 3B",
                context_window=32768
            ),
            "qwen2.5-3b-instruct": ModelConfig(
                model_id="ollama/qwen2.5:3b-instruct",
                display_name="Qwen 2.5 3B Instruct",
                context_window=32768
            ),
        },
        env_var="OLLAMA_API_KEY",
        base_url="http://localhost:11434/v1",
        requires_api_key=False,
        free_tier_description="Totalmente grátis - roda localmente",
        website="https://ollama.com",
        icon="cpu"
    ),
    ProviderType.XAI: ProviderConfig(
        type=ProviderType.XAI,
        name="xAI (Grok)",
        category="Raciocínio",
        models={
            "grok-2": ModelConfig(
                model_id="xai/grok-2",
                display_name="Grok 2",
                context_window=131072
            ),
            "grok-2-mini": ModelConfig(
                model_id="xai/grok-2-mini",
                display_name="Grok 2 Mini",
                context_window=131072
            ),
        },
        env_var="XAI_API_KEY",
        base_url="https://api.x.ai/v1",
        free_tier_description="Gratuito com limites generosos",
        website="https://console.x.ai/",
        icon="brain"
    ),
    ProviderType.COHERE: ProviderConfig(
        type=ProviderType.COHERE,
        name="Cohere",
        category="Raciocínio/Embeddings",
        models={
            "command-r-plus": ModelConfig(
                model_id="cohere/command-r-plus",
                display_name="Command R+",
                context_window=128000
            ),
            "command-r": ModelConfig(
                model_id="cohere/command-r",
                display_name="Command R",
                context_window=128000
            ),
        },
        env_var="COHERE_API_KEY",
        free_tier_description="Free tier com 100M tokens/mês",
        website="https://dashboard.cohere.com/api-keys",
        icon="zap"
    ),
    ProviderType.TOGETHER: ProviderConfig(
        type=ProviderType.TOGETHER,
        name="Together AI",
        category="Open Source Models",
        models={
            "llama-3.3-70b": ModelConfig(
                model_id="together/meta-llama/Llama-3.3-70B-Instruct-Turbo",
                display_name="Llama 3.3 70B Turbo",
                context_window=128000
            ),
            "deepseek-v3": ModelConfig(
                model_id="together/deepseek-ai/DeepSeek-V3",
                display_name="DeepSeek V3",
                context_window=128000
            ),
            "qwen-2.5-72b": ModelConfig(
                model_id="together/Qwen/Qwen2.5-72B-Instruct-Turbo",
                display_name="Qwen 2.5 72B Turbo",
                context_window=128000
            ),
            "mixtral-8x7b": ModelConfig(
                model_id="together/mistralai/Mixtral-8x7B-Instruct-v0.1",
                display_name="Mixtral 8x7B",
                context_window=32768
            ),
        },
        env_var="TOGETHER_API_KEY",
        free_tier_description="$1 crédito grátis (≈ 5M tokens)",
        website="https://api.together.xyz/settings/api-keys",
        icon="users"
    ),
    ProviderType.FIREWORKS: ProviderConfig(
        type=ProviderType.FIREWORKS,
        name="Fireworks AI",
        category="Open Source Models",
        models={
            "llama-3.3-70b": ModelConfig(
                model_id="fireworks/accounts/fireworks/models/llama-v3p3-70b-instruct",
                display_name="Llama 3.3 70B",
                context_window=128000
            ),
            "deepseek-v3": ModelConfig(
                model_id="fireworks/accounts/fireworks/models/deepseek-v3",
                display_name="DeepSeek V3",
                context_window=128000
            ),
            "nemotron-3-ultra": ModelConfig(
                model_id="fireworks/accounts/fireworks/models/nemotron-3-ultra",
                display_name="Nemotron 3 Ultra",
                context_window=4096
            ),
        },
        env_var="FIREWORKS_API_KEY",
        free_tier_description="Créditos grátis iniciais",
        website="https://fireworks.ai/account/api-keys",
        icon="flame"
    ),
    ProviderType.HUGGINGFACE: ProviderConfig(
        type=ProviderType.HUGGINGFACE,
        name="Hugging Face Inference",
        category="Open Source (1000+ modelos)",
        models={
            "llama-3.1-70b": ModelConfig(
                model_id="huggingface/meta-llama/Meta-Llama-3.1-70B-Instruct",
                display_name="Llama 3.1 70B",
                context_window=128000
            ),
            "mistral-7b": ModelConfig(
                model_id="huggingface/mistralai/Mistral-7B-Instruct-v0.3",
                display_name="Mistral 7B Instruct",
                context_window=32768
            ),
            "zephyr-7b": ModelConfig(
                model_id="huggingface/HuggingFaceH4/zephyr-7b-beta",
                display_name="Zephyr 7B",
                context_window=32768
            ),
        },
        env_var="HUGGINGFACE_API_KEY",
        free_tier_description="30k req/mês grátis (rate limited)",
        website="https://huggingface.co/settings/tokens",
        icon="huggingface"
    ),
}

# Default model per provider (first one listed)
DEFAULT_MODELS = {
    ProviderType.GEMINI: "gemini-1.5-flash",
    ProviderType.CLAUDE: "claude-3-5-sonnet-20241022",
    ProviderType.PERPLEXITY: "llama-3.1-sonar-small-128k-online",
    ProviderType.DEEPSEEK: "deepseek-chat",
    ProviderType.GROQ: "llama-3.3-70b-versatile",
    ProviderType.OPENROUTER: "claude-3-5-sonnet",
    ProviderType.FREE_AI: "qwen-2.5-72b",
    ProviderType.OLLAMA: "gemma4-12b",
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