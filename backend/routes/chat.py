"""
Chat Routes - Unified API for multiple AI providers via LiteLLM.
"""

from fastapi import APIRouter, HTTPException, Header, UploadFile, File, Form, Query
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
import os
import logging
import base64
from datetime import datetime

from backend.services.chat_service import chat_service
from backend.services.providers import ProviderType, get_all_providers_info

logger = logging.getLogger(__name__)

router = APIRouter()

# Request/Response Models
class ChatMessage(BaseModel):
    message: str
    provider: str = Field(default="ollama", description="Provider type (ollama, groq, gemini, claude, etc.)")
    model: Optional[str] = Field(default=None, description="Specific model key")
    custom_api_key: Optional[str] = Field(default=None, description="Custom API key override")
    system_prompt: Optional[str] = Field(default=None, description="Custom system prompt")
    temperature: float = Field(default=0.7, ge=0.0, le=2.0)
    max_tokens: int = Field(default=4096, ge=1, le=8192)

class ChatResponse(BaseModel):
    user_message: dict
    assistant_message: dict

class ProviderInfo(BaseModel):
    type: str
    name: str
    category: str
    models: List[dict]
    default_model: str
    free_tier: str
    website: str
    icon: str
    has_key: bool
    env_var: Optional[str] = None

class ProvidersResponse(BaseModel):
    providers: List[ProviderInfo]
    configured_count: int
    total_count: int

@router.get("/providers", response_model=ProvidersResponse)
async def get_providers():
    """
    Get all available AI providers and their models.
    Shows which providers have API keys configured.
    """
    all_providers = get_all_providers_info()
    configured = [p for p in all_providers if p["has_key"]]
    
    return ProvidersResponse(
        providers=[ProviderInfo(**p) for p in all_providers],
        configured_count=len(configured),
        total_count=len(all_providers)
    )

@router.get("/providers/available")
async def get_available_providers():
    """Get only providers that have API keys configured"""
    available = chat_service.get_available_providers()
    return {"providers": available}

@router.post("/chat", response_model=ChatResponse)
async def chat(
    message: ChatMessage,
    x_custom_api_key: Optional[str] = Header(None, alias="X-Custom-API-Key"),
):
    """
    Unified chat endpoint supporting multiple providers.
    
    Provider examples: groq, gemini, claude, perplexity, deepseek, openrouter, free_ai
    """
    try:
        # Parse provider
        try:
            provider_type = ProviderType(message.provider.lower())
        except ValueError:
            raise HTTPException(
                status_code=400,
                detail=f"Provider '{message.provider}' not supported. Use: {[p.value for p in ProviderType]}"
            )
        
        # Determine API key priority: custom header > request body > env
        api_key = x_custom_api_key or message.custom_api_key
        
        # Call chat service
        result = await chat_service.chat(
            message=message.message,
            provider_type=provider_type,
            model_key=message.model,
            custom_api_key=api_key,
            system_prompt=message.system_prompt,
            temperature=message.temperature,
            max_tokens=message.max_tokens,
        )
        
        # Create response messages
        user_message_obj = {
            "id": str(int(datetime.now().timestamp() * 1000)),
            "role": "user",
            "content": message.message,
            "provider": message.provider,
            "model": message.model or "default",
            "timestamp": datetime.now().isoformat()
        }
        
        assistant_message_obj = {
            "id": str(int(datetime.now().timestamp() * 1000) + 1),
            "role": "assistant",
            "content": result.get("content", ""),
            "provider": result.get("provider"),
            "model": result.get("model"),
            "usage": result.get("usage"),
            "timestamp": datetime.now().isoformat()
        }
        
        return ChatResponse(
            user_message=user_message_obj,
            assistant_message=assistant_message_obj
        )
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error in chat endpoint: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=500,
            detail=f"Erro ao processar mensagem: {str(e)}"
        )

@router.post("/chat/stream")
async def chat_stream(
    message: ChatMessage,
    x_custom_api_key: Optional[str] = Header(None, alias="X-Custom-API-Key"),
):
    """
    Streaming chat endpoint (Server-Sent Events).
    Returns text/event-stream for real-time response.
    """
    from fastapi.responses import StreamingResponse
    import json
    
    try:
        provider_type = ProviderType(message.provider.lower())
        api_key = x_custom_api_key or message.custom_api_key
        
        async def generate():
            try:
                stream = await chat_service.chat(
                    message=message.message,
                    provider_type=provider_type,
                    model_key=message.model,
                    custom_api_key=api_key,
                    system_prompt=message.system_prompt,
                    temperature=message.temperature,
                    max_tokens=message.max_tokens,
                    stream=True,
                )
                
                async for chunk in stream:
                    yield f"data: {json.dumps(chunk)}\n\n"
            except Exception as e:
                logger.error(f"Stream error: {e}")
                yield f"data: {json.dumps({'type': 'error', 'error': str(e)})}\n\n"
        
        return StreamingResponse(
            generate(),
            media_type="text/event-stream",
            headers={
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
                "X-Accel-Buffering": "no",
            }
        )
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error in stream endpoint: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/chat/images", response_model=ChatResponse)
async def chat_with_image(
    message: str = Form(...),
    image: UploadFile = File(...),
    provider: str = Form(default="gemini"),
    model: Optional[str] = Form(default=None),
    custom_api_key: Optional[str] = Form(default=None),
    system_prompt: Optional[str] = Form(default=None),
    x_custom_api_key: Optional[str] = Header(None, alias="X-Custom-API-Key"),
):
    """
    Chat with image support (vision models).
    Supported providers: gemini, claude, groq (if model supports vision)
    """
    try:
        provider_type = ProviderType(provider.lower())
        api_key = x_custom_api_key or custom_api_key
        
        # Read and encode image
        image_contents = await image.read()
        image_base64 = base64.b64encode(image_contents).decode('utf-8')
        logger.info(f"📷 Image received: {len(image_contents)} bytes, provider: {provider}")
        
        # Default system prompt for math images
        if not system_prompt:
            system_prompt = "Você é um assistente que analisa imagens de exercícios matemáticos. Resolva seguindo o padrão didático padrão."
        
        result = await chat_service.chat_with_image(
            message=message,
            image_base64=image_base64,
            provider_type=provider_type,
            model_key=model,
            custom_api_key=api_key,
            system_prompt=system_prompt,
        )
        
        user_message_obj = {
            "id": str(int(datetime.now().timestamp() * 1000)),
            "role": "user",
            "content": message,
            "has_image": True,
            "provider": provider,
            "model": model or "default",
            "timestamp": datetime.now().isoformat()
        }
        
        assistant_message_obj = {
            "id": str(int(datetime.now().timestamp() * 1000) + 1),
            "role": "assistant",
            "content": result.get("content", ""),
            "provider": result.get("provider"),
            "model": result.get("model"),
            "usage": result.get("usage"),
            "timestamp": datetime.now().isoformat()
        }
        
        return ChatResponse(
            user_message=user_message_obj,
            assistant_message=assistant_message_obj
        )
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error in chat with image: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Erro ao processar imagem: {str(e)}")

@router.post("/generate-image")
async def generate_image(data: dict):
    """
    Generate image using supported providers.
    Note: Only Gemini and OpenRouter (DALL-E) support image generation currently.
    """
    try:
        prompt = data.get("prompt", "")
        if not prompt:
            raise HTTPException(status_code=400, detail="Prompt é obrigatório")
        
        provider = data.get("provider", "gemini")
        model = data.get("model")
        custom_api_key = data.get("custom_api_key")
        
        # For now, return info about image generation capabilities
        return {
            "message": "Geração de imagens disponível via Gemini (Imagen) e OpenRouter (DALL-E). Configure a chave API correspondente.",
            "providers_supporting_images": ["gemini", "openrouter"],
            "prompt": prompt
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error generating image: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/messages")
async def get_messages():
    """Get chat message history (placeholder - not persisted yet)"""
    return []


@router.get("/health")
async def health_check():
    """Health check endpoint"""
    providers = chat_service.get_available_providers()
    return {
        "status": "healthy",
        "providers_configured": len(providers),
        "providers": [p["name"] for p in providers]
    }