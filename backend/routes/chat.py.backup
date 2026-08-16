from fastapi import APIRouter, HTTPException, Header, UploadFile, File, Form
from pydantic import BaseModel
from typing import Optional
from dotenv import load_dotenv
import os
import logging
from datetime import datetime
import base64
from emergentintegrations.llm.chat import LlmChat, UserMessage, ImageContent
from routes.prompts import MATH_SYSTEM_PROMPT

# Load environment variables
load_dotenv()

logger = logging.getLogger(__name__)
router = APIRouter()

class ChatMessage(BaseModel):
    message: str

class ChatResponse(BaseModel):
    user_message: dict
    assistant_message: dict

def get_api_key(x_custom_api_key: Optional[str] = None):
    """Get API key - use custom key from header if available, then try Emergent key"""
    if x_custom_api_key:
        logger.info("Using custom API key from header")
        return x_custom_api_key
    
    # Try to get Emergent key from environment
    emergent_key = os.environ.get('EMERGENT_LLM_KEY')
    if emergent_key:
        logger.info("Using EMERGENT_LLM_KEY from environment")
        return emergent_key
    
    logger.warning("No API key found")
    return None

@router.post("/chat", response_model=ChatResponse)
async def chat(message: ChatMessage, x_custom_api_key: Optional[str] = Header(None)):
    """
    Chat endpoint using emergentintegrations library
    Supports both Emergent Universal Key and custom OpenAI keys
    """
    try:
        # Get API key
        api_key = get_api_key(x_custom_api_key)
        logger.info(f"API key status: {'Available' if api_key else 'Not configured'}")
        
        if not api_key:
            raise HTTPException(
                status_code=400, 
                detail="⚠️ Para usar o chat, você precisa configurar sua chave API.\n\n👉 Clique no botão roxo 'Configurar API Keys' no canto superior direito e adicione sua chave na aba Emergent (recomendado) ou OpenAI."
            )
        
        # Initialize LlmChat with emergentintegrations
        chat_instance = LlmChat(
            api_key=api_key,
            session_id=f"chat-{int(datetime.now().timestamp())}",
            system_message=MATH_SYSTEM_PROMPT
        )
        
        # Use gpt-4o-mini as default (it's faster and cheaper)
        chat_instance.with_model("openai", "gpt-4o-mini")
        
        # Create user message
        user_msg = UserMessage(text=message.message)
        
        # Send message and get response
        response_text = await chat_instance.send_message(user_msg)
        
        # Create response messages
        user_message_obj = {
            "id": str(int(datetime.now().timestamp() * 1000)),
            "role": "user",
            "content": message.message,
            "timestamp": datetime.now().isoformat()
        }
        
        assistant_message_obj = {
            "id": str(int(datetime.now().timestamp() * 1000) + 1),
            "role": "assistant",
            "content": response_text,
            "timestamp": datetime.now().isoformat()
        }
        
        return ChatResponse(
            user_message=user_message_obj,
            assistant_message=assistant_message_obj
        )
        
    except HTTPException:
        # Re-raise HTTPException without modification
        raise
    except Exception as e:
        logger.error(f"Error in chat endpoint: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=500, 
            detail=f"Erro ao processar mensagem: {str(e)}"
        )

@router.post("/chat/images")
async def chat_with_image(
    message: str = Form(...),
    image: UploadFile = File(...),
    x_custom_api_key: Optional[str] = Header(None)
):
    """
    Chat endpoint with image support using GPT-4o Vision
    Falls back to OCR + mock response when API key is not available
    """
    try:
        logger.info("📷 Chat with image request received")
        
        # Get API key
        api_key = get_api_key(x_custom_api_key)
        
        if not api_key:
            # Fallback: Use OCR to extract text from image
            logger.warning("⚠️ No API key found - using OCR fallback")
            
            try:
                from PIL import Image as PILImage
                import pytesseract
                import io
                
                # Read and process image
                image_contents = await image.read()
                img = PILImage.open(io.BytesIO(image_contents))
                
                # Extract text with OCR
                extracted_text = pytesseract.image_to_string(img, lang='eng+por')
                extracted_text = extracted_text.strip()
                
                if extracted_text:
                    response_content = f"📷 **Texto extraído da imagem:**\n\n{extracted_text}\n\n---\n\n⚠️ **Modo de demonstração**: Para análises mais completas da imagem, configure sua chave API nas configurações."
                else:
                    response_content = f"📷 Imagem recebida: {message}\n\n⚠️ **Modo de demonstração**: Não foi possível extrair texto da imagem. Configure sua chave API para análises completas."
                
                # Create response messages
                user_message_obj = {
                    "id": str(int(datetime.now().timestamp() * 1000)),
                    "role": "user",
                    "content": message,
                    "has_image": True,
                    "timestamp": datetime.now().isoformat()
                }
                
                assistant_message_obj = {
                    "id": str(int(datetime.now().timestamp() * 1000) + 1),
                    "role": "assistant",
                    "content": response_content,
                    "timestamp": datetime.now().isoformat()
                }
                
                return {
                    "user_message": user_message_obj,
                    "assistant_message": assistant_message_obj
                }
                
            except Exception as ocr_error:
                logger.error(f"OCR fallback failed: {ocr_error}")
                
                # Ultimate fallback
                user_message_obj = {
                    "id": str(int(datetime.now().timestamp() * 1000)),
                    "role": "user",
                    "content": message,
                    "has_image": True,
                    "timestamp": datetime.now().isoformat()
                }
                
                assistant_message_obj = {
                    "id": str(int(datetime.now().timestamp() * 1000) + 1),
                    "role": "assistant",
                    "content": f"📷 Imagem recebida: {message}\n\n⚠️ **Modo de demonstração**: Configure sua chave API nas configurações para análise completa de imagens com IA.",
                    "timestamp": datetime.now().isoformat()
                }
                
                return {
                    "user_message": user_message_obj,
                    "assistant_message": assistant_message_obj
                }
        
        # Process image
        image_contents = await image.read()
        image_base64 = base64.b64encode(image_contents).decode('utf-8')
        logger.info(f"📊 Image size: {len(image_contents)} bytes")
        
        # Initialize chat with GPT-4o (supports vision)
        chat_instance = LlmChat(
            api_key=api_key,
            session_id=f"chat-img-{int(datetime.now().timestamp())}",
            system_message="Você é um assistente que analisa imagens de exercícios matemáticos. Ao identificar um exercício na imagem, resolva seguindo EXATAMENTE o padrão abaixo:\n\n" + MATH_SYSTEM_PROMPT
        )
        
        # Use GPT-4o for vision
        chat_instance.with_model("openai", "gpt-4o")
        
        # Create message with image
        user_msg = UserMessage(
            text=message,
            file_contents=[ImageContent(image_base64=image_base64)]
        )
        
        # Send and get response
        response_text = await chat_instance.send_message(user_msg)
        
        # Create response
        user_message_obj = {
            "id": str(int(datetime.now().timestamp() * 1000)),
            "role": "user",
            "content": message,
            "has_image": True,
            "timestamp": datetime.now().isoformat()
        }
        
        assistant_message_obj = {
            "id": str(int(datetime.now().timestamp() * 1000) + 1),
            "role": "assistant",
            "content": response_text,
            "timestamp": datetime.now().isoformat()
        }
        
        logger.info("✅ Chat with image processed successfully")
        
        return {
            "user_message": user_message_obj,
            "assistant_message": assistant_message_obj
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error in chat with image: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=500,
            detail=f"Erro ao processar imagem: {str(e)}"
        )


@router.post("/generate-image")
async def generate_image(data: dict):
    """
    Generate image using GPT Image 1 (DALL-E) via Emergent LLM Key
    Falls back to mock placeholder if key is not available
    """
    try:
        logger.info("🎨 Image generation request received")
        
        prompt = data.get("prompt", "")
        if not prompt:
            raise HTTPException(status_code=400, detail="Prompt é obrigatório")
        
        # Get Emergent LLM key (works with GPT Image 1)
        api_key = os.getenv("EMERGENT_LLM_KEY")
        
        if not api_key:
            # Use mock/placeholder image when key is not available
            logger.warning("⚠️ EMERGENT_LLM_KEY not found, using placeholder image")
            
            # Create simple placeholder response
            placeholder_message = f"🎨 Prompt recebido: {prompt}\n\n⚠️ **Modo de demonstração**: A chave Emergent LLM não está configurada. Configure a chave para gerar imagens reais com IA."
            
            # Create user and assistant messages in the format expected by frontend
            user_message_obj = {
                "id": str(int(datetime.now().timestamp() * 1000)),
                "role": "user",
                "content": f"🎨 Gerar imagem: {prompt}",
                "timestamp": datetime.now().isoformat()
            }
            
            assistant_message_obj = {
                "id": str(int(datetime.now().timestamp() * 1000) + 1),
                "role": "assistant",
                "content": placeholder_message,
                "timestamp": datetime.now().isoformat()
            }
            
            return {
                "user_message": user_message_obj,
                "assistant_message": assistant_message_obj
            }
        
        logger.info(f"📝 Prompt: {prompt[:100]}...")
        
        # Use emergentintegrations for image generation
        from emergentintegrations.llm.openai.image_generation import OpenAIImageGeneration
        
        image_gen = OpenAIImageGeneration(api_key=api_key)
        
        # Generate image using GPT Image 1 (DALL-E)
        logger.info("🖼️ Generating image with GPT Image 1...")
        
        # Use correct parameters for emergentintegrations (async method)
        images_bytes_list = await image_gen.generate_images(
            prompt=prompt,
            model="gpt-image-1",  # Emergent model name
            number_of_images=1,
            quality="low"  # Options: low, medium, high
        )
        
        if not images_bytes_list or len(images_bytes_list) == 0:
            raise HTTPException(
                status_code=500,
                detail="Falha ao gerar imagem"
            )
        
        # Get first image bytes and convert to base64
        image_bytes = images_bytes_list[0]
        image_base64 = base64.b64encode(image_bytes).decode('utf-8')
        image_url = f"data:image/png;base64,{image_base64}"
        
        logger.info("✅ Image generated successfully")
        
        # Create messages in correct format for frontend
        user_message_obj = {
            "id": str(int(datetime.now().timestamp() * 1000)),
            "role": "user",
            "content": f"🎨 Gerar imagem: {prompt}",
            "timestamp": datetime.now().isoformat()
        }
        
        assistant_message_obj = {
            "id": str(int(datetime.now().timestamp() * 1000) + 1),
            "role": "assistant",
            "content": f"✅ Imagem gerada com sucesso!\n\n![Imagem gerada]({image_url})",
            "timestamp": datetime.now().isoformat()
        }
        
        return {
            "user_message": user_message_obj,
            "assistant_message": assistant_message_obj
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error generating image: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=500,
            detail=f"Erro ao gerar imagem: {str(e)}"
        )


@router.get("/messages")
async def get_messages():
    """
    Get chat message history
    For now, returns empty array since we don't persist messages
    """
    return []


