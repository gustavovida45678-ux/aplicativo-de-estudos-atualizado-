"""
Free AI Providers Configuration for LiteLLM
Maps each provider to their LiteLLM model identifiers and required environment variables.
"""

import os
import re
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
    OPENAI = "openai"
    EMERGENT = "emergent"
    FCC = "fcc"

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


# FCC_MODEL pode conter vários modelos separados por vírgula ou "|"
# (o primeiro é o principal, os demais entram como fallback no rate limit).
def _fcc_models() -> Dict[str, ModelConfig]:
    raw = os.environ.get(
        "FCC_MODEL",
        "claude-3-freecc-no-thinking/nvidia_nim/nvidia/nemotron-3-super-120b-a12b",
    )
    names = [m.strip() for m in re.split(r"[,|]", raw) if m.strip()]
    if not names:
        names = ["claude-3-freecc-no-thinking"]
    models = {}
    for i, name in enumerate(names):
        key = "fcc" if i == 0 else f"fcc-{i + 1}"
        models[key] = ModelConfig(
            model_id=f"openai/{name}",
            display_name=f"FCC FreeCC {i + 1}",
            context_window=128000,
        )
    return models


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
            "llama-3.1-8b-instant": ModelConfig(
                model_id="groq/llama-3.1-8b-instant",
                display_name="Llama 3.1 8B Instant",
                context_window=128000
            ),
            "openai/gpt-oss-20b": ModelConfig(
                model_id="groq/openai/gpt-oss-20b",
                display_name="GPT-OSS 20B",
                context_window=131072
            ),
            "qwen/qwen3.6-27b": ModelConfig(
                model_id="groq/qwen/qwen3.6-27b",
                display_name="Qwen 3.6 27B",
                context_window=131072
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
            "claude-sonnet-4.5": ModelConfig(
                model_id="anthropic/claude-sonnet-4.5",
                display_name="Claude Sonnet 4.5 (via OpenRouter)",
                context_window=1000000,
                supports_vision=True
            ),
            "claude-haiku-4.5": ModelConfig(
                model_id="anthropic/claude-haiku-4.5",
                display_name="Claude Haiku 4.5 (via OpenRouter)",
                context_window=200000,
                supports_vision=True
            ),
            "claude-3-haiku": ModelConfig(
                model_id="anthropic/claude-3-haiku",
                display_name="Claude 3 Haiku (via OpenRouter)",
                context_window=200000,
                supports_vision=True
            ),
            "deepseek-v3": ModelConfig(
                model_id="deepseek/deepseek-v3.2",
                display_name="DeepSeek V3.2 via OpenRouter",
                context_window=163840
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
        base_url=os.environ.get("OLLAMA_URL", "http://localhost:11434/v1").replace("/api/generate", "").rstrip("/"),
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
    ProviderType.OPENAI: ProviderConfig(
        type=ProviderType.OPENAI,
        name="OpenAI",
        category="Raciocínio",
        models={
            "gpt-4o-mini": ModelConfig(
                model_id="openai/gpt-4o-mini",
                display_name="GPT-4o Mini (rápido/barato)",
                supports_vision=True,
                context_window=128000
            ),
            "gpt-4o": ModelConfig(
                model_id="openai/gpt-4o",
                display_name="GPT-4o",
                supports_vision=True,
                context_window=128000
            ),
            "gpt-4.1-mini": ModelConfig(
                model_id="openai/gpt-4.1-mini",
                display_name="GPT-4.1 Mini",
                supports_vision=True,
                context_window=1000000
            ),
        },
        env_var="OPENAI_API_KEY",
        free_tier_description="Pago - use com moderação (GPT-4o Mini é barato)",
        website="https://platform.openai.com/api-keys",
        icon="sparkles"
    ),
    ProviderType.EMERGENT: ProviderConfig(
        type=ProviderType.EMERGENT,
        name="Emergent Universal",
        category="Agregador Universal",
        models={
            "gpt-4o-mini": ModelConfig(
                model_id="openai/gpt-4o-mini",
                display_name="GPT-4o Mini (via Emergent)",
                supports_vision=True,
                context_window=128000
            ),
            "gpt-4o": ModelConfig(
                model_id="openai/gpt-4o",
                display_name="GPT-4o (via Emergent)",
                supports_vision=True,
                context_window=128000
            ),
            "claude-3-5-sonnet": ModelConfig(
                model_id="openai/claude-3-5-sonnet",
                display_name="Claude 3.5 Sonnet (via Emergent)",
                supports_vision=True,
                context_window=200000
            ),
        },
        env_var="EMERGENT_API_KEY",
        base_url=os.environ.get("EMERGENT_BASE_URL", "https://integrations.emergentagent.com/llm"),
        free_tier_description="Universal - uma chave para OpenAI, Anthropic e Google",
        website="https://emergent.sh",
        icon="key"
    ),
    ProviderType.FCC: ProviderConfig(
        type=ProviderType.FCC,
        name="FCC Free CC",
        category="Grátis",
        models=_fcc_models(),
        env_var="FCC_AUTH_TOKEN",
        base_url=os.environ.get("FCC_BASE_URL", "").rstrip("/"),
        requires_api_key=False,
        free_tier_description="Grátis - modelos FreeCC via tunnel",
        website="",
        icon="zap"
    ),
}

# Default model per provider (first one listed)
DEFAULT_MODELS = {
    ProviderType.CLAUDE: "claude-3-5-sonnet-20241022",
    ProviderType.PERPLEXITY: "llama-3.1-sonar-small-128k-online",
    ProviderType.DEEPSEEK: "deepseek-chat",
    ProviderType.GROQ: "llama-3.3-70b-versatile",
    ProviderType.OPENROUTER: "deepseek-v3",
    ProviderType.FREE_AI: "qwen-2.5-72b",
    ProviderType.OLLAMA: "gemma4-12b",
    ProviderType.OPENAI: "gpt-4o-mini",
    ProviderType.EMERGENT: "gpt-4o-mini",
    ProviderType.FCC: "fcc",
}

# Preferred order for auto-detection and fallback
AUTO_PRIORITY = [
    ProviderType.OPENROUTER,
    ProviderType.CLAUDE,
    ProviderType.GEMINI,
    ProviderType.GROQ,
    ProviderType.DEEPSEEK,
    ProviderType.FREE_AI,
    ProviderType.PERPLEXITY,
    ProviderType.XAI,
    ProviderType.COHERE,
    ProviderType.TOGETHER,
    ProviderType.FIREWORKS,
    ProviderType.HUGGINGFACE,
    ProviderType.OPENAI,
    ProviderType.EMERGENT,
    ProviderType.FCC,
]

def get_provider_config(provider_type: ProviderType) -> Optional[ProviderConfig]:
    """Get provider configuration by type"""
    return PROVIDERS.get(provider_type)


def get_env_key_list(env_var: str) -> List[str]:
    """
    Retorna TODAS as chaves configuradas para um provider, incluindo variantes
    numeradas: ENV_VAR, ENV_VAR_2, ENV_VAR_3... (rotacao de chaves gratuitas).
    Ex: GROQ_API_KEY, GROQ_API_KEY_2, GROQ_API_KEY_3.
    """
    keys: List[str] = []
    primary = os.environ.get(env_var)
    if primary:
        keys.append(primary)
    i = 2
    while True:
        variant = os.environ.get(f"{env_var}_{i}")
        if not variant:
            break
        keys.append(variant)
        i += 1
    return keys


def get_provider_key_count(env_var: str) -> int:
    """Numero de chaves configuradas (para rotacao)."""
    return len(get_env_key_list(env_var))

def get_available_providers() -> List[Dict[str, Any]]:
    """Get list of providers that have API keys configured"""
    available = []
    for provider_type, config in PROVIDERS.items():
        api_keys = get_env_key_list(config.env_var)
        if api_keys or not config.requires_api_key:
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
                "has_key": bool(api_keys),
                "key_count": len(api_keys),
            })
    return available

def get_all_providers_info() -> List[Dict[str, Any]]:
    """Get info for all providers (including those without keys)"""
    all_providers = []
    for provider_type, config in PROVIDERS.items():
        api_keys = get_env_key_list(config.env_var)
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
            "has_key": bool(api_keys),
            "key_count": len(api_keys),
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