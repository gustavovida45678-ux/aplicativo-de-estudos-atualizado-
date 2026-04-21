from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from typing import Optional
import logging
import os
import base64
from datetime import datetime

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post("/generate")
async def generate_exercises(
    reference_text: str = Form(""),
    number_of_exercises: int = Form(3),
    mode: str = Form("similar"),  # similar or create
    image: Optional[UploadFile] = File(None)
):
    """
    Generate exercises based on a reference exercise (text or image)
    
    Modes:
    - similar: Generate similar exercises to the reference
    - create: Create new exercises based on the reference description
    """
    try:
        logger.info(f"📝 Exercise generation request: mode={mode}, count={number_of_exercises}")
        logger.info(f"📄 Reference text: {reference_text[:100]}...")
        logger.info(f"📷 Image: {image.filename if image else 'None'}")
        
        # Check if we have Emergent key for AI
        emergent_key = os.environ.get('EMERGENT_LLM_KEY')
        if not emergent_key:
            logger.warning("⚠️ No EMERGENT_LLM_KEY found - using mock response")
            return generate_mock_exercises(reference_text, number_of_exercises, mode)
        
        # Process image if provided
        image_data = None
        extracted_text = ""
        
        if image:
            logger.info(f"📷 Processing image: {image.filename}")
            contents = await image.read()
            logger.info(f"📊 Image size: {len(contents)} bytes")
            
            # Try OCR
            try:
                from PIL import Image as PILImage
                import pytesseract
                import io
                
                img = PILImage.open(io.BytesIO(contents))
                img = img.convert('L')
                extracted_text = pytesseract.image_to_string(img, lang='eng+por', config='--psm 6')
                extracted_text = extracted_text.strip()
                logger.info(f"📝 OCR extracted: {extracted_text[:200]}...")
            except Exception as ocr_error:
                logger.warning(f"⚠️ OCR failed: {ocr_error}")
            
            # Convert to base64 for AI
            image_data = base64.b64encode(contents).decode('utf-8')
        
        # Generate exercises using AI
        from emergentintegrations.llm.chat import LlmChat, UserMessage, ImageContent
        
        # Build prompt based on mode
        if mode == "similar":
            system_prompt = """Você é um professor expert em criar exercícios educacionais de altíssima qualidade.
Sua tarefa é gerar exercícios SEMELHANTES ao exemplo fornecido, mas com VALORES, CONTEXTOS ou ABORDAGENS DIFERENTES.

REGRAS OBRIGATÓRIAS:
1. Mantenha o MESMO NÍVEL DE DIFICULDADE do exemplo
2. Mantenha o MESMO FORMATO (múltipla escolha, dissertativo, etc.)
3. VARIE os números, nomes, contextos - mas mantenha o mesmo TIPO DE RACIOCÍNIO
4. Forneça resolução EXTREMAMENTE DETALHADA com TODOS os passos intermediários
5. Mostre TODOS os cálculos - como se estivesse resolvendo na lousa para um aluno
6. Explique o PORQUÊ de cada passo, não apenas O QUÊ fazer
7. Use linguagem clara e didática, como se estivesse ensinando presencialmente
"""
            
            if image_data and extracted_text:
                user_prompt = f"""EXERCÍCIO DE REFERÊNCIA (extraído da imagem):
"{extracted_text}"

{f"CONTEXTO ADICIONAL: {reference_text}" if reference_text else ""}

Gere {number_of_exercises} exercícios SEMELHANTES (mas diferentes) baseados neste exemplo.

IMPORTANTE: Analise o exercício da imagem com cuidado e:
- Mantenha o MESMO TIPO de problema matemático
- Use o MESMO MÉTODO de resolução
- Varie apenas os VALORES NUMÉRICOS e contexto
- Mantenha a MESMA ESTRUTURA de resolução"""
            else:
                user_prompt = f"""EXERCÍCIO DE REFERÊNCIA:
"{reference_text}"

Gere {number_of_exercises} exercícios SEMELHANTES (mas diferentes) baseados neste exemplo."""
        
        else:  # create mode
            system_prompt = """Você é um professor expert em criar exercícios educacionais originais de altíssima qualidade.
Sua tarefa é criar NOVOS EXERCÍCIOS baseados na descrição ou tema fornecido.

REGRAS OBRIGATÓRIAS:
1. Crie exercícios ORIGINAIS e CRIATIVOS mas pedagogicamente sólidos
2. Varie os níveis de dificuldade de forma equilibrada
3. Use contextos práticos, interessantes e realistas
4. Forneça resolução EXTREMAMENTE DETALHADA com TODOS os passos intermediários
5. Mostre TODOS os cálculos - como se estivesse resolvendo na lousa
6. Explique o PORQUÊ de cada passo, não apenas O QUÊ fazer
7. Use linguagem clara e didática
"""
            
            if image_data and extracted_text:
                user_prompt = f"""TEMA/DESCRIÇÃO (da imagem):
"{extracted_text}"

{f"DETALHES ADICIONAIS: {reference_text}" if reference_text else ""}

Crie {number_of_exercises} exercícios NOVOS sobre este tema."""
            else:
                user_prompt = f"""TEMA/DESCRIÇÃO:
"{reference_text}"

Crie {number_of_exercises} exercícios NOVOS sobre este tema."""
        
        # Add format instructions
        user_prompt += f"""

FORMATO DA RESPOSTA (JSON) - SIGA EXATAMENTE:
{{
  "exercises": [
    {{
      "question": "Enunciado completo e claro do exercício",
      "options": ["Primeira opção", "Segunda opção", "Terceira opção", "Quarta opção"],
      "correct_answer": "A, B, C ou D (VARIE! Não use sempre a mesma letra!)",
      "solution": {{
        "steps": [
          {{
            "title": "Passo 1: Análise e Identificação",
            "content": "Explicação DETALHADA do primeiro passo. Descreva o que o aluno deve observar, identificar e entender no problema. Use linguagem clara e didática.",
            "calculation": "Se houver cálculos neste passo, mostre aqui com TODAS as etapas: expressão inicial → substituições → simplificações → resultado"
          }},
          {{
            "title": "Passo 2: Escolha do Método",
            "content": "Explique DETALHADAMENTE qual método usar e POR QUÊ este método é o mais apropriado. Mencione as fórmulas ou propriedades que serão aplicadas.",
            "calculation": "Escreva as fórmulas principais que serão usadas"
          }},
          {{
            "title": "Passo 3: Aplicação Passo a Passo",
            "content": "Explique CADA ETAPA do cálculo. Substitua os valores, mostre as propriedades sendo aplicadas, explique as simplificações. Use frases como 'Substituímos diretamente...', 'Calculamos cada termo usando...'",
            "calculation": "MOSTRE TODOS OS CÁLCULOS INTERMEDIÁRIOS: primeiro passo → segundo passo → terceiro passo → ... → resultado parcial"
          }},
          {{
            "title": "Passo 4: Simplificação e Cálculo Final",
            "content": "Explique como chegar ao resultado final. Mostre todas as simplificações, combinações de termos, etc.",
            "calculation": "Cálculo final completo: expressão simplificada = resultado numérico"
          }},
          {{
            "title": "Passo 5: Verificação e Resposta",
            "content": "Verifique se o resultado faz sentido. Compare com as opções disponíveis e identifique a resposta correta.",
            "calculation": "Resposta final = [valor] (que corresponde à alternativa [letra])"
          }}
        ],
        "prerequisites": [
          {{
            "topic": "Conceito Matemático 1",
            "description": "Explicação detalhada de por que este conceito é necessário para resolver o problema"
          }},
          {{
            "topic": "Conceito Matemático 2",
            "description": "Explicação detalhada de por que este conceito é necessário"
          }},
          {{
            "topic": "Conceito Matemático 3",
            "description": "Explicação detalhada de por que este conceito é necessário"
          }}
        ],
        "final_answer": "Conclusão completa: 'Portanto, [explicação do resultado]. A resposta correta é a alternativa [letra]: [transcrever a opção completa]'"
      }},
      "difficulty": "Fácil/Médio/Difícil",
      "topic": "Tópico específico (ex: Limites, Derivadas, Integrais, Equações, etc)"
    }}
  ]
}}

REGRAS CRÍTICAS PARA RESOLUÇÃO DETALHADA:
1. **MÍNIMO 5 PASSOS**: Análise, Método, Aplicação, Simplificação, Verificação
2. **MÁXIMO DETALHAMENTO**: Explique como se o aluno estivesse aprendendo pela primeira vez
3. **TODOS OS CÁLCULOS**: Mostre cada substituição, cada operação, cada simplificação
4. **LINGUAGEM DIDÁTICA**: Use "vamos", "observe que", "note que", "calculamos", etc
5. **JUSTIFIQUE ESCOLHAS**: Explique por que usar determinado método ou propriedade
6. **3 PRÉ-REQUISITOS**: Conceitos fundamentais necessários com descrições detalhadas
7. **VARIE RESPOSTAS**: Distribua A, B, C, D entre os exercícios

Retorne APENAS o JSON válido, sem markdown, sem texto adicional."""
        
        # Initialize AI chat
        chat_instance = LlmChat(
            api_key=emergent_key,
            session_id=f"exercise-gen-{int(datetime.now().timestamp())}",
            system_message=system_prompt
        )
        
        chat_instance.with_model("openai", "gpt-4o-mini")
        
        # Create message
        if image_data:
            user_msg = UserMessage(
                text=user_prompt,
                file_contents=[ImageContent(image_base64=image_data)]
            )
        else:
            user_msg = UserMessage(text=user_prompt)
        
        # Get response
        logger.info("🤖 Sending request to AI...")
        response = await chat_instance.send_message(user_msg)
        logger.info(f"✅ AI response received: {len(response)} chars")
        
        # Parse JSON response
        import json
        import re
        
        # Extract JSON from response
        json_match = re.search(r'\{[\s\S]*\}', response)
        if json_match:
            json_str = json_match.group(0)
            result = json.loads(json_str)
            
            logger.info(f"✅ Generated {len(result.get('exercises', []))} exercises")
            return result
        else:
            logger.error("❌ No JSON found in response")
            return generate_mock_exercises(reference_text, number_of_exercises, mode)
        
    except Exception as e:
        logger.error(f"❌ Error generating exercises: {e}")
        import traceback
        traceback.print_exc()
        
        # Check for budget error
        error_str = str(e).lower()
        if 'budget' in error_str or 'exceeded' in error_str:
            raise HTTPException(
                status_code=402,
                detail="⚠️ Orçamento da chave API esgotado. Adicione créditos em Profile → Universal Key → Add Balance"
            )
        
        # Return mock as fallback
        return generate_mock_exercises(reference_text, number_of_exercises, mode)


def generate_mock_exercises(reference_text: str, count: int, mode: str):
    """Generate mock exercises when AI is not available"""
    logger.info(f"🎭 Generating {count} mock exercises")
    
    exercises = []
    correct_answers = ['A', 'B', 'C', 'D']
    
    for i in range(count):
        # Vary the correct answer
        correct_idx = i % 4
        correct_letter = correct_answers[correct_idx]
        
        exercises.append({
            "question": f"Exercício {i+1}: {reference_text[:80] if reference_text else 'Exemplo de exercício matemático baseado no tema fornecido'}...",
            "options": [
                f"Primeira alternativa possível",
                f"Segunda alternativa possível",
                f"Terceira alternativa possível",
                f"Quarta alternativa possível"
            ],
            "correct_answer": correct_letter,
            "solution": {
                "steps": [
                    {
                        "title": "Passo 1: Análise e Identificação",
                        "content": "⚠️ **Modo de demonstração**: Para resoluções completas com IA, adicione créditos na chave Emergent LLM em Profile → Universal Key → Add Balance.\n\nNeste primeiro passo, você deve:\n• Ler atentamente o enunciado\n• Identificar todos os dados fornecidos\n• Reconhecer o que está sendo pedido\n• Identificar o tipo de problema (equação, limite, derivada, etc.)",
                        "calculation": None
                    },
                    {
                        "title": "Passo 2: Escolha do Método",
                        "content": "Com base na identificação do problema, determine qual método matemático é mais apropriado:\n• Para limites: substituição direta, fatoração, L'Hôpital\n• Para derivadas: regra da potência, produto, quociente, cadeia\n• Para integrais: substituição, partes, frações parciais\n• Para equações: fatoração, fórmula de Bhaskara, sistemas",
                        "calculation": "Fórmula geral do método escolhido"
                    },
                    {
                        "title": "Passo 3: Aplicação Passo a Passo",
                        "content": "Aplique o método escolhido de forma sistemática:\n1. Substitua os valores conhecidos\n2. Aplique as propriedades matemáticas relevantes\n3. Simplifique cada termo individualmente\n4. Combine os termos seguindo a ordem de operações",
                        "calculation": "Expressão inicial → Substituições → Simplificações intermediárias"
                    },
                    {
                        "title": "Passo 4: Simplificação e Cálculo Final",
                        "content": "Realize as operações finais:\n• Combine termos semelhantes\n• Simplifique frações quando possível\n• Calcule potências e raízes\n• Chegue ao resultado numérico ou algébrico final",
                        "calculation": "Expressão simplificada = Resultado final"
                    },
                    {
                        "title": "Passo 5: Verificação e Resposta",
                        "content": "Verifique se o resultado faz sentido:\n• Compare com as alternativas disponíveis\n• Verifique se as unidades estão corretas (se aplicável)\n• Confirme que o resultado está no domínio esperado\n• Identifique qual alternativa corresponde ao resultado",
                        "calculation": f"Resposta = (Alternativa {correct_letter})"
                    }
                ],
                "prerequisites": [
                    {
                        "topic": "Operações Matemáticas Fundamentais",
                        "description": "É essencial dominar as operações básicas (adição, subtração, multiplicação, divisão) e suas propriedades, pois são a base para resolver qualquer problema matemático mais complexo."
                    },
                    {
                        "topic": "Propriedades Algébricas",
                        "description": "Conhecer as propriedades da álgebra (distributiva, associativa, comutativa) e manipulação de expressões é fundamental para simplificar e resolver problemas de forma eficiente."
                    },
                    {
                        "topic": "Conceitos Específicos do Tópico",
                        "description": "Dependendo do tipo de problema (cálculo, álgebra, geometria), é necessário dominar os conceitos específicos daquela área, como limites, derivadas, teoremas, etc."
                    }
                ],
                "final_answer": f"Portanto, após realizar todos os cálculos e simplificações necessárias, concluímos que a resposta correta é a alternativa {correct_letter}. Configure a chave Emergent LLM para obter resoluções personalizadas e detalhadas com IA."
            },
            "difficulty": ["Fácil", "Médio", "Difícil"][i % 3],
            "topic": "Matemática Geral"
        })
    
    return {
        "exercises": exercises,
        "mode": mode,
        "generated_with_ai": False
    }
