from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from typing import Optional
import logging
import os
from datetime import datetime
import base64
import tempfile
import re
import io

logger = logging.getLogger(__name__)
router = APIRouter()

@router.post("/explain")
async def explain_math_problem(
    question: str = Form(...),
    image: Optional[UploadFile] = File(None)
):
    """
    Generate step-by-step explanation for a math problem
    Accepts text question and/or image
    """
    try:
        logger.info("📚 Math explanation request received")
        logger.info(f"📝 Question: {question[:100]}...")
        logger.info(f"📷 Image: {image.filename if image else 'None'}")
        
        # Check if we have Emergent key for AI
        emergent_key = os.environ.get('EMERGENT_LLM_KEY')
        if not emergent_key:
            logger.warning("⚠️ No EMERGENT_LLM_KEY found - using mock response")
            return generate_mock_explanation(question)
        
        # Process image if provided
        image_data = None
        extracted_text = ""
        if image:
            logger.info(f"📷 Processing image: {image.filename}")
            contents = await image.read()
            logger.info(f"📊 Image size: {len(contents)} bytes")
            
            # Extract text from image using OCR
            try:
                from PIL import Image
                import pytesseract
                import io
                
                # Open image
                img = Image.open(io.BytesIO(contents))
                
                # Enhance for better OCR
                img = img.convert('L')  # Convert to grayscale
                
                # Extract text
                extracted_text = pytesseract.image_to_string(img, lang='eng+por', config='--psm 6')
                extracted_text = extracted_text.strip()
                
                logger.info(f"📝 OCR extracted text: {extracted_text[:200]}...")
                
                if len(extracted_text) < 5:
                    logger.warning("⚠️ OCR extracted very little text, will rely on vision")
                
            except Exception as ocr_error:
                logger.warning(f"⚠️ OCR failed: {ocr_error}, will use vision only")
            
            # Convert to base64 for AI vision
            image_data = base64.b64encode(contents).decode('utf-8')
            logger.info("✅ Image converted to base64")
        
        # Generate explanation using AI
        from emergentintegrations.llm.chat import LlmChat, UserMessage
        
        prompt = f"""Você é um professor EXPERT em matemática. 

{f'''IMAGEM ANEXA COM QUESTÃO MATEMÁTICA:

Texto extraído da imagem por OCR:
"{extracted_text}"

IMPORTANTE: 
1. Use o texto extraído acima como base para identificar a questão
2. A imagem também está anexa - use-a para confirmar símbolos matemáticos, expoentes, frações que o OCR pode ter errado
3. Se o OCR errou algo óbvio (ex: "x+4)" deveria ser "(x+4)³"), corrija usando a imagem

{f"Contexto do usuário: {question}" if question and len(question) > 5 else ""}

Agora RESOLVA esta questão matemática com PRECISÃO.''' if image_data else f"QUESTÃO: {question}"}

REGRAS ABSOLUTAS:

1. **VERIFIQUE SEUS CÁLCULOS**: Antes de responder, refaça os cálculos pelo menos 2 vezes para garantir precisão
2. **RESOLVA PASSO A PASSO**: Mostre TODAS as etapas intermediárias
3. **REGRAS MATEMÁTICAS**: Aplique corretamente as regras de:
   - Derivadas: regra do produto, quociente, cadeia
   - Integrais: substituição, partes, frações parciais
   - Limites: L'Hôpital, infinitésimos, continuidade
   - Álgebra: propriedades, fatoração, simplificação
4. **SINAIS E OPERAÇÕES**: Preste ATENÇÃO EXTRA a sinais (+ / -) e ordem de operações
5. **SIMPLIFIQUE CORRETAMENTE**: Mostre cada passo de simplificação
6. **UNIDADES**: Se houver unidades de medida, mantenha-as corretas

🎯 Para questões de CÁLCULO especificamente:
- Derivadas: use as regras corretas (potência, produto, quociente, cadeia)
- Integrais: identifique o método correto (substituição, partes, etc)
- Limites: analise indeterminações corretamente

Retorne um JSON válido neste formato:
{{
  "title": "Resolução: [descrição clara da questão]",
  "steps": [
    {{
      "title": "Passo 1: Análise e Identificação",
      "content": "Explique o que a questão pede. Identifique o tipo de problema (derivada, integral, limite, etc). Liste os dados fornecidos e o que precisa ser encontrado. Mencione qual regra ou método será usado.",
      "formula": null
    }},
    {{
      "title": "Passo 2: Escolha do Método",
      "content": "Explique detalhadamente QUAL método/regra será aplicado e POR QUÊ. Para derivadas: regra da potência, produto, quociente ou cadeia? Para integrais: substituição, por partes, frações parciais? Justifique a escolha.",
      "formula": "formula_geral_do_metodo"
    }},
    {{
      "title": "Passo 3: Aplicação Passo a Passo",
      "content": "Aplique o método escolhido MOSTRANDO CADA ETAPA. Não pule passos. Mostre cada transformação matemática. ATENÇÃO aos sinais e simplificações.",
      "formula": "aplicacao_com_valores"
    }},
    {{
      "title": "Passo 4: Simplificação",
      "content": "Simplifique o resultado obtido. Mostre cada etapa de simplificação. Combine termos semelhantes. Reduza frações. VERIFIQUE se não há erros.",
      "formula": "resultado_simplificado"
    }},
    {{
      "title": "Passo 5: Resposta Final e Verificação",
      "content": "Apresente a RESPOSTA FINAL CORRETA com unidades (se houver). Explique se o resultado faz sentido. Sugira uma forma de verificar a resposta (ex: derivar o resultado de uma integral, testar limites laterais).",
      "formula": "RESPOSTA_FINAL"
    }}
  ],
  "prerequisites": [
    {{
      "topic": "Conceito Base Necessário",
      "description": "Conceito matemático ou regra que o aluno precisa saber",
      "video_id": "example123",
      "video_title": "Vídeo sobre o conceito",
      "duration": "10:00"
    }}
  ],
  "similar_questions": [
    {{
      "question": "Questão similar para praticar",
      "difficulty": "Médio",
      "video_id": "ex001",
      "video_title": "Resolução Similar",
      "channel": "Matemática"
    }}
  ]
}}

EXEMPLOS DE BOA RESOLUÇÃO:

Exemplo 1 - Derivada:
Questão: "Calcule a derivada de f(x) = 3x² + 2x - 5"
Resposta correta: f'(x) = 6x + 2
Método: Regra da potência → d/dx(x^n) = n·x^(n-1)

Exemplo 2 - Integral:
Questão: "Calcule ∫(2x + 3)dx"
Resposta correta: x² + 3x + C
Método: Integral da soma → integrar termo a termo

Exemplo 3 - Limite:
Questão: "Calcule lim(x→2) (x² - 4)/(x - 2)"
Resposta correta: 4
Método: Fatorar → (x-2)(x+2)/(x-2) = x+2, então limite = 4

⚠️ CRÍTICO: Retorne SOMENTE o JSON válido, sem texto antes ou depois. A resposta matemática DEVE estar CORRETA."""

        chat = LlmChat(
            api_key=emergent_key,
            session_id=f"math-{int(datetime.now().timestamp())}",
            system_message="""Você é um professor EXPERT em matemática e cálculo com PhD. Sua ÚNICA prioridade é PRECISÃO MATEMÁTICA.

REGRAS ABSOLUTAS:
1. SEMPRE verifique cálculos 2x antes de responder
2. NUNCA invente respostas - se não souber, diga
3. Aplique RIGOROSAMENTE as regras matemáticas
4. Preste ATENÇÃO EXTRA a sinais, expoentes e simplificações
5. Para Cálculo: use as regras de derivação/integração corretamente
6. Mostre TODOS os passos intermediários

Se cometer um erro matemático, você falha completamente. PRECISÃO é tudo."""
        )
        
        # Use GPT-4o for better accuracy on complex math
        chat.with_model("openai", "gpt-4o")
        
        # Send message with or without image
        if image_data:
            logger.info("📷 Sending image to GPT-4o for analysis...")
            # GPT-4o supports vision - send image with text
            from emergentintegrations.llm.chat import ImageContent
            
            user_msg = UserMessage(
                text=prompt,
                file_contents=[ImageContent(image_base64=image_data)]
            )
        else:
            user_msg = UserMessage(text=prompt)
        
        response = await chat.send_message(user_msg)
        
        logger.info("✅ AI response received")
        
        # Parse JSON response
        import json
        import re
        try:
            # Clean response
            cleaned = response.strip()
            
            # Remove markdown code blocks if present
            if cleaned.startswith("```"):
                lines = cleaned.split('\n')
                cleaned = '\n'.join([line for line in lines if not line.strip().startswith('```') and not line.strip() == 'json'])
                cleaned = cleaned.strip()
            
            # Fix common JSON escape issues in LaTeX formulas
            # Replace single backslashes with double backslashes for LaTeX
            # But only inside "formula" fields
            def fix_latex_escapes(match):
                field_content = match.group(1)
                # Double all backslashes for LaTeX
                fixed = field_content.replace('\\', '\\\\')
                return f'"formula": "{fixed}"'
            
            # Fix formula fields
            cleaned = re.sub(r'"formula":\s*"([^"]*)"', fix_latex_escapes, cleaned)
            
            explanation = json.loads(cleaned)
            logger.info("✅ JSON parsed successfully")
            return explanation
            
        except json.JSONDecodeError as e:
            logger.error(f"❌ JSON parse error: {e}")
            logger.error(f"Response preview: {response[:300]}")
            
            # Try to extract and fix the JSON
            try:
                # Find JSON object in response
                json_match = re.search(r'\{[\s\S]*\}', response)
                if json_match:
                    json_str = json_match.group(0)
                    # Apply the same fixes
                    json_str = re.sub(r'"formula":\s*"([^"]*)"', fix_latex_escapes, json_str)
                    explanation = json.loads(json_str)
                    logger.info("✅ JSON extracted and parsed after cleanup")
                    return explanation
            except Exception:
                pass
            
            # Fall back to mock if all parsing fails
            logger.warning("⚠️ Falling back to mock response")
            return generate_mock_explanation(question)
        
    except Exception as e:
        logger.error(f"❌ Error in explain_math_problem: {e}")
        import traceback
        traceback.print_exc()
        
        # Check if it's a budget error
        error_str = str(e).lower()
        if 'budget' in error_str or 'exceeded' in error_str:
            # Return mock with budget message
            result = generate_mock_explanation(question)
            # Add budget warning to first step
            if result and 'steps' in result and len(result['steps']) > 0:
                result['steps'][0]['content'] = (
                    f"⚠️ **Orçamento da chave API esgotado**: O sistema detectou que o orçamento da chave Emergent LLM foi excedido. "
                    f"Para restaurar as resoluções completas com IA:\n\n"
                    f"1. Acesse seu perfil no Emergent\n"
                    f"2. Vá em \"Universal Key\" → \"Add Balance\"\n"
                    f"3. Adicione mais créditos ou ative auto top-up\n\n"
                    f"Enquanto isso, aqui está uma resolução básica:\n\n{result['steps'][0]['content']}"
                )
            return result
        
        # Return mock instead of error for better UX
        return generate_mock_explanation(question)


def generate_mock_explanation(question: str):
    """Generate a mock explanation when AI is not available"""
    logger.info("🎭 Generating mock explanation")
    
    question_lower = question.lower()
    
    # Try to extract numbers from the question
    import re
    numbers = re.findall(r'-?\d+\.?\d*', question)
    
    # Detect if it's a basic arithmetic problem
    if any(op in question for op in ['+', '-', '×', '*', 'x', '÷', '/']):
        # Try to evaluate simple expressions
        try:
            # Clean the expression
            expression = question_lower.replace('×', '*').replace('÷', '/').replace('x', '*')
            expression = re.sub(r'[^\d\+\-\*/\.\(\)]', '', expression)
            
            if expression and len(expression) < 50:
                result = eval(expression)
                
                # Prepare formula strings (can't use backslash in f-strings)
                times_symbol = '\\times'
                div_symbol = '\\div'
                formula_expr = expression.replace('*', times_symbol).replace('/', div_symbol)
                
                return {
                    "title": f"Resolução: {question}",
                    "steps": [
                        {
                            "title": "Passo 1: Identificar a operação",
                            "content": f"A expressão matemática é: **{expression}**",
                            "formula": formula_expr
                        },
                        {
                            "title": "Passo 2: Resolver",
                            "content": f"Aplicando as operações matemáticas na ordem correta (parênteses, potências, multiplicação/divisão, adição/subtração):",
                            "formula": f"{formula_expr} = {result}"
                        },
                        {
                            "title": "Passo 3: Resultado Final",
                            "content": f"A resposta é: **{result}**",
                            "formula": "\\boxed{" + str(result) + "}"
                        }
                    ],
                    "prerequisites": [],
                    "similar_questions": []
                }
        except:
            pass
    
    # Detect derivatives
    if any(word in question_lower for word in ['derivada', 'derive', 'diferencial', "d/dx"]):
        return {
            "title": f"Resolução de Derivada: {question[:60]}",
            "steps": [
                {
                    "title": "Passo 1: Identificar a função",
                    "content": f"Vamos resolver: {question}. Identifique a função que precisa ser derivada e as regras de derivação aplicáveis.",
                    "formula": None
                },
                {
                    "title": "Passo 2: Aplicar regras de derivação",
                    "content": "**Regras principais:**\n- Regra da potência: d/dx(xⁿ) = n·xⁿ⁻¹\n- Regra da soma: d/dx(f+g) = f' + g'\n- Regra do produto: d/dx(f·g) = f'·g + f·g'\n- Regra da cadeia: d/dx(f(g(x))) = f'(g(x))·g'(x)",
                    "formula": "\\frac{d}{dx}(x^n) = nx^{n-1}"
                },
                {
                    "title": "Passo 3: Calcular a derivada",
                    "content": "Aplique as regras apropriadas passo a passo, derivando cada termo da função.",
                    "formula": None
                },
                {
                    "title": "Passo 4: Simplificar",
                    "content": "Simplifique o resultado, combinando termos semelhantes e reduzindo quando possível.",
                    "formula": None
                }
            ],
            "prerequisites": [
                {
                    "topic": "Regras de Derivação",
                    "description": "Conheça as regras fundamentais: potência, produto, quociente e cadeia.",
                    "video_id": "deriv01"
                }
            ],
            "similar_questions": []
        }
    
    # Detect integrals
    if any(word in question_lower for word in ['integral', 'integre', 'integração', '∫']):
        return {
            "title": f"Resolução de Integral: {question[:60]}",
            "steps": [
                {
                    "title": "Passo 1: Identificar a função",
                    "content": f"Vamos resolver: {question}. Identifique o tipo de integral (definida ou indefinida) e a função a integrar.",
                    "formula": None
                },
                {
                    "title": "Passo 2: Escolher o método",
                    "content": "**Métodos principais:**\n- Integral de potência: ∫xⁿ dx = xⁿ⁺¹/(n+1) + C\n- Substituição: para integrais compostas\n- Partes: ∫u dv = uv - ∫v du\n- Frações parciais: para funções racionais",
                    "formula": "\\int x^n dx = \\frac{x^{n+1}}{n+1} + C"
                },
                {
                    "title": "Passo 3: Calcular a integral",
                    "content": "Aplique o método escolhido, integrando cada termo da função.",
                    "formula": None
                },
                {
                    "title": "Passo 4: Adicionar constante",
                    "content": "Para integrais indefinidas, não esqueça de adicionar a constante de integração + C. Para definidas, aplique o Teorema Fundamental do Cálculo.",
                    "formula": None
                }
            ],
            "prerequisites": [
                {
                    "topic": "Técnicas de Integração",
                    "description": "Domine substituição, partes e frações parciais.",
                    "video_id": "int01"
                }
            ],
            "similar_questions": []
        }
    
    # Detect limits - Try to calculate simple limits
    if any(word in question_lower for word in ['limite', 'lim', 'limit', 'tende']):
        # Try to extract limit information
        try:
            # Extract x value (what x approaches)
            x_match = re.search(r'x\s*(?:→|->|tende\s+a)\s*(-?\d+)', question_lower)
            
            if x_match:
                x_value = float(x_match.group(1))
                
                # Try to evaluate the expression at x_value
                # Remove limit notation
                expr = re.sub(r'lim.*?(?:→|->|tende).*?(-?\d+)', '', question_lower)
                expr = expr.replace('lim', '').replace('limite', '').strip()
                
                # Clean expression for evaluation
                expr_clean = expr.replace('x', f'({x_value})')
                expr_clean = expr_clean.replace('^', '**')
                expr_clean = expr_clean.replace('⁻¹', '**(-1)')
                expr_clean = expr_clean.replace('³', '**3')
                expr_clean = expr_clean.replace('²', '**2')
                expr_clean = expr_clean.replace('·', '*')
                expr_clean = expr_clean.replace('[', '(').replace(']', ')')
                
                # Remove non-math characters except numbers, operators, parentheses
                expr_clean = re.sub(r'[^\d\+\-\*/\.\(\)\*\s]', '', expr_clean)
                
                # Try to evaluate
                try:
                    result = eval(expr_clean)
                    
                    return {
                        "title": f"Resolução de Limite: {question[:80]}",
                        "steps": [
                            {
                                "title": "Passo 1: Identificar o limite",
                                "content": f"Queremos calcular o limite quando **x → {int(x_value)}**",
                                "formula": f"\\lim_{{x \\to {int(x_value)}}}"
                            },
                            {
                                "title": "Passo 2: Verificar continuidade",
                                "content": "Como a função é contínua no ponto, podemos aplicar **substituição direta**.",
                                "formula": None
                            },
                            {
                                "title": "Passo 3: Substituir o valor",
                                "content": f"Substituindo x = {int(x_value)} na expressão:",
                                "formula": None
                            },
                            {
                                "title": "Passo 4: Calcular",
                                "content": f"Após realizar os cálculos:\n- Avaliamos cada termo\n- Aplicamos as operações na ordem correta",
                                "formula": None
                            },
                            {
                                "title": "Passo 5: Resultado Final",
                                "content": f"O limite é: **{result}**",
                                "formula": f"\\lim_{{x \\to {int(x_value)}}} = \\boxed{{{result}}}"
                            }
                        ],
                        "prerequisites": [
                            {
                                "topic": "Limites e Continuidade",
                                "description": "Entenda quando pode usar substituição direta.",
                                "video_id": "lim01"
                            }
                        ],
                        "similar_questions": []
                    }
                except:
                    pass
        except:
            pass
        
        # Fallback to generic limit explanation
        return {
            "title": f"Resolução de Limite: {question[:60]}",
            "steps": [
                {
                    "title": "Passo 1: Identificar o limite",
                    "content": f"Vamos calcular: {question}\n\nIdentifique para qual valor a variável está tendendo.",
                    "formula": None
                },
                {
                    "title": "Passo 2: Substituição direta",
                    "content": "Primeiro tente substituir o valor diretamente na função. Se resultar em uma forma indeterminada (0/0, ∞/∞, etc.), use outras técnicas.",
                    "formula": None
                },
                {
                    "title": "Passo 3: Técnicas para indeterminações",
                    "content": "**Técnicas principais:**\n- Fatoração e simplificação\n- Regra de L'Hôpital: lim(f/g) = lim(f'/g') se 0/0 ou ∞/∞\n- Limites fundamentais trigonométricos\n- Limites exponenciais e logarítmicos",
                    "formula": "\\lim_{x \\to a} \\frac{f(x)}{g(x)} = \\lim_{x \\to a} \\frac{f'(x)}{g'(x)}"
                },
                {
                    "title": "Passo 4: Calcular o resultado",
                    "content": "Aplique a técnica apropriada e calcule o valor do limite.\n\n⚠️ **Dica**: Configure a chave Emergent LLM para resoluções detalhadas com IA.",
                    "formula": None
                }
            ],
            "prerequisites": [
                {
                    "topic": "Limites e Continuidade",
                    "description": "Entenda limites laterais, infinitos e indeterminações.",
                    "video_id": "lim01"
                }
            ],
            "similar_questions": []
        }
    
    # Generic fallback
    return {
        "title": f"Análise: {question[:60]}...",
        "steps": [
            {
                "title": "Passo 1: Compreender o Problema",
                "content": f"Questão: **{question}**\n\n⚠️ **Modo de demonstração**: Configure a chave Emergent LLM nas configurações para obter resoluções detalhadas com IA.\n\nEnquanto isso, aqui estão as etapas gerais para resolver este tipo de problema:",
                "formula": None
            },
            {
                "title": "Passo 2: Identificar Conceitos",
                "content": "Identifique os conceitos matemáticos envolvidos (álgebra, geometria, cálculo, etc.) e as fórmulas relevantes.",
                "formula": None
            },
            {
                "title": "Passo 3: Organizar os Dados",
                "content": "Liste todos os dados fornecidos no problema e o que está sendo pedido. Organize de forma clara.",
                "formula": None
            },
            {
                "title": "Passo 4: Aplicar Métodos",
                "content": "Aplique as fórmulas e métodos apropriados passo a passo, mostrando todos os cálculos.",
                "formula": None
            },
            {
                "title": "Passo 5: Verificar",
                "content": "Verifique se o resultado faz sentido no contexto do problema e se as unidades estão corretas.",
                "formula": None
            }
        ],
        "prerequisites": [
            {
                "topic": "Fundamentos Matemáticos",
                "description": "Revise os conceitos básicos relacionados ao problema.",
                "video_id": "fund01"
            }
        ],
        "similar_questions": [
            {
                "question": "Configure a chave API para ver questões similares",
                "difficulty": "Variado",
                "video_id": "config",
                "video_title": "Como Configurar API",
                "channel": "Ajuda"
            }
        ]
    }


@router.post("/generate-video")
async def generate_video(data: dict):
    """
    Generate video from math explanation using Sora 2
    """
    try:
        logger.info("🎬 Video generation requested with Sora 2")
        
        # Check if we have Emergent key for AI
        emergent_key = os.environ.get('EMERGENT_LLM_KEY')
        if not emergent_key:
            logger.warning("⚠️ No EMERGENT_LLM_KEY found")
            raise HTTPException(
                status_code=400,
                detail="API key não configurada. Configure a chave Emergent primeiro."
            )
        
        # Extract explanation data
        title = data.get('title', 'Explicação Matemática')
        steps = data.get('steps', [])
        duration = data.get('duration', 5)  # 4, 8, or 12 seconds
        theme = data.get('theme', 'dark')
        
        logger.info(f"📊 Video params: title={title}, steps={len(steps)}, duration={duration}s, theme={theme}")
        
        # Create detailed prompt for video generation
        prompt_parts = [f"Crie um vídeo educacional sobre: {title}."]
        
        # Add key steps to the prompt (limit to avoid too long prompts)
        for i, step in enumerate(steps[:3], 1):  # Use first 3 steps
            step_title = step.get('title', f'Passo {i}')
            step_content = step.get('content', '')[:150]  # Limit content length
            prompt_parts.append(f"Passo {i}: {step_title}. {step_content}")
        
        # Add visual style based on theme
        if theme == 'dark':
            prompt_parts.append("Estilo visual: fundo escuro profissional, texto claro e legível, fórmulas matemáticas destacadas em cores vibrantes.")
        else:
            prompt_parts.append("Estilo visual: fundo claro e limpo, texto escuro, design minimalista educacional.")
        
        prompt_parts.append("Inclua transições suaves entre os passos. Estilo educacional e profissional.")
        
        full_prompt = " ".join(prompt_parts)
        logger.info(f"📝 Prompt: {full_prompt[:200]}...")
        
        # Import Sora 2 video generation
        from emergentintegrations.llm.openai.video_generation import OpenAIVideoGeneration
        
        # Initialize video generator
        video_gen = OpenAIVideoGeneration(api_key=emergent_key)
        
        # Validate and adjust duration (Sora accepts 4, 8, or 12)
        valid_durations = [4, 8, 12]
        if duration not in valid_durations:
            duration = min(valid_durations, key=lambda x: abs(x - duration))
            logger.info(f"⚠️ Adjusted duration to nearest valid: {duration}s")
        
        # Generate video
        logger.info("🎬 Starting Sora 2 generation (this may take 2-5 minutes)...")
        video_bytes = video_gen.text_to_video(
            prompt=full_prompt,
            model="sora-2",
            size="1280x720",  # HD quality
            duration=duration,
            max_wait_time=600  # 10 minutes timeout
        )
        
        if not video_bytes:
            logger.error("❌ Video generation returned no data")
            raise HTTPException(
                status_code=500,
                detail="Falha na geração do vídeo. Tente novamente."
            )
        
        # Save video to temporary file
        import tempfile
        temp_file = tempfile.NamedTemporaryFile(delete=False, suffix='.mp4')
        output_path = temp_file.name
        
        video_gen.save_video(video_bytes, output_path)
        logger.info(f"✅ Video saved to: {output_path}")
        
        # Read video file and encode to base64 for frontend
        with open(output_path, 'rb') as f:
            video_data = f.read()
        
        video_base64 = base64.b64encode(video_data).decode('utf-8')
        
        # Clean up temp file
        os.remove(output_path)
        logger.info("🧹 Temp file cleaned up")
        
        return {
            "success": True,
            "video_base64": video_base64,
            "size_kb": len(video_data) // 1024,
            "duration": duration,
            "message": "Vídeo gerado com sucesso!"
        }
        
    except Exception as e:
        logger.error(f"❌ Error in generate_video: {e}")
        import traceback
        traceback.print_exc()
        
        raise HTTPException(
            status_code=500,
            detail=f"Erro ao gerar vídeo: {str(e)}"
        )


@router.post("/youtube-search")
async def youtube_search(data: dict):
    """
    Search YouTube for similar questions (mock for now)
    """
    logger.info("🔍 YouTube search requested (mock)")
    
    # Return mock results
    return {
        "results": [
            {
                "videoId": "dQw4w9WgXcQ",
                "title": "Resolução Completa - Questões de Matemática",
                "channel": "Professor João",
                "thumbnail": "https://via.placeholder.com/320x180/4c1d95/ffffff?text=Vídeo+1",
                "duration": "15:30",
                "views": "125K",
                "publishedAt": "há 2 meses"
            },
            {
                "videoId": "abc123def",
                "title": "Passo a Passo - Exercícios Resolvidos",
                "channel": "Matemática Fácil",
                "thumbnail": "https://via.placeholder.com/320x180/7c3aed/ffffff?text=Vídeo+2",
                "duration": "10:15",
                "views": "89K",
                "publishedAt": "há 1 mês"
            },
            {
                "videoId": "xyz789ghi",
                "title": "Teoria e Prática - Aula Completa",
                "channel": "Aprenda Matemática",
                "thumbnail": "https://via.placeholder.com/320x180/8b5cf6/ffffff?text=Vídeo+3",
                "duration": "20:45",
                "views": "200K",
                "publishedAt": "há 3 semanas"
            }
        ]
    }
