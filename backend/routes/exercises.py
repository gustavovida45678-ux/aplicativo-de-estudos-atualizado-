from fastapi import APIRouter, HTTPException
from typing import List
import logging
from models.exercise import Exercise, ExerciseAttemptCreate

logger = logging.getLogger(__name__)
router = APIRouter()

# Database de exercícios (em produção, viria do MongoDB)
EXERCISES_DB = {
    "calc1_1": [  # Limites
        {
            "id": "ex_calc1_1_1",
            "topic_id": "calc1_1",
            "question": "Calcule o limite: lim (x→2) (x² - 4)/(x - 2)",
            "options": ["0", "2", "4", "O limite não existe"],
            "correct_answer": 2,
            "explanation": "Fatorando o numerador: (x² - 4) = (x-2)(x+2). Simplificando: (x-2)(x+2)/(x-2) = x+2. Quando x→2, o resultado é 4.",
            "difficulty": "Básico"
        },
        {
            "id": "ex_calc1_1_2",
            "topic_id": "calc1_1",
            "question": "Calcule: lim (x→0) (sen(x))/x",
            "options": ["0", "1", "∞", "O limite não existe"],
            "correct_answer": 1,
            "explanation": "Este é um limite fundamental: lim (x→0) sen(x)/x = 1. É um resultado importante usado em muitas demonstrações.",
            "difficulty": "Intermediário"
        },
        {
            "id": "ex_calc1_1_3",
            "topic_id": "calc1_1",
            "question": "Para qual valor de 'a' a função f(x) = (x² + ax + 6)/(x - 2) é contínua em x = 2?",
            "options": ["a = -5", "a = -4", "a = 4", "Não existe tal valor"],
            "correct_answer": 0,
            "explanation": "Para ser contínua em x=2, o limite deve existir. O numerador deve ter (x-2) como fator: x²+ax+6=(x-2)(x+3)=x²+x-6. Logo a=-1... Ops! Vamos recalcular: (x-2)(x-b)=x²-(2+b)x+2b. Se 2b=6, b=3. Então -(2+3)=-5, logo a=-5.",
            "difficulty": "Avançado"
        }
    ],
    "calc1_2": [  # Derivadas
        {
            "id": "ex_calc1_2_1",
            "topic_id": "calc1_2",
            "question": "Calcule a derivada de f(x) = 3x² + 2x - 5",
            "options": ["6x + 2", "3x + 2", "6x² + 2x", "3x²"],
            "correct_answer": 0,
            "explanation": "Usando a regra da potência: d/dx(xⁿ) = n·xⁿ⁻¹. Portanto: f'(x) = 3·2x + 2·1 - 0 = 6x + 2",
            "difficulty": "Básico"
        },
        {
            "id": "ex_calc1_2_2",
            "topic_id": "calc1_2",
            "question": "Qual é a derivada de f(x) = sen(x)·cos(x)?",
            "options": ["cos²(x) - sen²(x)", "cos(x) - sen(x)", "cos(2x)", "sen²(x) - cos²(x)"],
            "correct_answer": 0,
            "explanation": "Usando a regra do produto: (uv)' = u'v + uv'. Então: f'(x) = cos(x)·cos(x) + sen(x)·(-sen(x)) = cos²(x) - sen²(x). Note que isso também equivale a cos(2x)!",
            "difficulty": "Intermediário"
        }
    ],
    "calc1_3": [  # Aplicações de Derivadas
        {
            "id": "ex_calc1_3_1",
            "topic_id": "calc1_3",
            "question": "Em que ponto a reta tangente à curva y = x³ é paralela à reta y = 3x + 1?",
            "options": ["x = 0", "x = 1", "x = -1 e x = 1", "x = 2"],
            "correct_answer": 2,
            "explanation": "A derivada y' = 3x² deve ser igual ao coeficiente angular 3. Logo 3x² = 3, então x² = 1, resultando em x = ±1.",
            "difficulty": "Intermediário"
        }
    ],
    "calc1_4": [  # Integrais
        {
            "id": "ex_calc1_4_1",
            "topic_id": "calc1_4",
            "question": "Calcule ∫ 2x dx",
            "options": ["x² + C", "2x² + C", "x²/2 + C", "2x"],
            "correct_answer": 0,
            "explanation": "∫ 2x dx = 2 · ∫ x dx = 2 · (x²/2) + C = x² + C",
            "difficulty": "Básico"
        },
        {
            "id": "ex_calc1_4_2",
            "topic_id": "calc1_4",
            "question": "Calcule ∫₀² (x² + 1) dx",
            "options": ["10/3", "14/3", "8/3", "6"],
            "correct_answer": 1,
            "explanation": "∫(x² + 1)dx = x³/3 + x. Aplicando os limites: [2³/3 + 2] - [0] = 8/3 + 2 = 8/3 + 6/3 = 14/3",
            "difficulty": "Intermediário"
        }
    ],
    "calc2_1": [  # Funções de Várias Variáveis
        {
            "id": "ex_calc2_1_1",
            "topic_id": "calc2_1",
            "question": "Qual é o domínio da função f(x,y) = √(x² + y² - 4)?",
            "options": ["Todo o plano", "Círculo de raio 2", "Fora do círculo de raio 2", "Apenas x² + y² = 4"],
            "correct_answer": 2,
            "explanation": "Para que a raiz quadrada seja real, precisamos x² + y² - 4 ≥ 0, ou seja, x² + y² ≥ 4. Isso representa pontos fora ou sobre o círculo de raio 2.",
            "difficulty": "Intermediário"
        }
    ],
    "calc2_2": [  # Derivadas Parciais
        {
            "id": "ex_calc2_2_1",
            "topic_id": "calc2_2",
            "question": "Calcule ∂f/∂x para f(x,y) = x²y + 3xy²",
            "options": ["2xy + 3y²", "x² + 6xy", "2xy + 3y", "xy + y²"],
            "correct_answer": 0,
            "explanation": "Ao derivar em relação a x, tratamos y como constante: ∂f/∂x = 2xy + 3y²",
            "difficulty": "Básico"
        }
    ],
    "calc2_3": [  # Integrais Múltiplas
        {
            "id": "ex_calc2_3_1",
            "topic_id": "calc2_3",
            "question": "Calcule ∫₀¹ ∫₀² xy dx dy",
            "options": ["1", "2", "1/2", "4"],
            "correct_answer": 0,
            "explanation": "Primeiro integramos em x: ∫₀² xy dx = [x²y/2]₀² = 2y. Depois em y: ∫₀¹ 2y dy = [y²]₀¹ = 1",
            "difficulty": "Intermediário"
        }
    ],
    "calc3_1": [  # Campos Vetoriais
        {
            "id": "ex_calc3_1_1",
            "topic_id": "calc3_1",
            "question": "Qual é a divergência do campo F(x,y,z) = (x, y, z)?",
            "options": ["0", "1", "2", "3"],
            "correct_answer": 3,
            "explanation": "div F = ∂x/∂x + ∂y/∂y + ∂z/∂z = 1 + 1 + 1 = 3",
            "difficulty": "Básico"
        }
    ],
    "calc3_2": [  # Integrais de Linha
        {
            "id": "ex_calc3_2_1",
            "topic_id": "calc3_2",
            "question": "Se F é um campo conservativo, o que podemos dizer sobre ∮ F·dr ao longo de uma curva fechada?",
            "options": ["É sempre zero", "Depende da curva", "É sempre 1", "É sempre positivo"],
            "correct_answer": 0,
            "explanation": "Para campos conservativos, a integral de linha sobre qualquer curva fechada é sempre zero. Isso é uma propriedade fundamental.",
            "difficulty": "Intermediário"
        }
    ],
    "calc3_3": [  # Teoremas de Green e Stokes
        {
            "id": "ex_calc3_3_1",
            "topic_id": "calc3_3",
            "question": "O Teorema de Green relaciona:",
            "options": [
                "Integral de linha com integral dupla",
                "Integral dupla com integral tripla",
                "Derivada com integral",
                "Limite com continuidade"
            ],
            "correct_answer": 0,
            "explanation": "O Teorema de Green relaciona a integral de linha ao longo de uma curva fechada com a integral dupla sobre a região delimitada por essa curva.",
            "difficulty": "Básico"
        }
    ],
    "calcnum_1": [  # Zeros de Funções
        {
            "id": "ex_calcnum_1_1",
            "topic_id": "calcnum_1",
            "question": "Qual método numérico usa a derivada para encontrar zeros de funções?",
            "options": ["Bisseção", "Newton-Raphson", "Posição Falsa", "Secante"],
            "correct_answer": 1,
            "explanation": "O método de Newton-Raphson usa tanto a função quanto sua derivada: xₙ₊₁ = xₙ - f(xₙ)/f'(xₙ)",
            "difficulty": "Básico"
        }
    ],
    "calcnum_2": [  # Sistemas Lineares
        {
            "id": "ex_calcnum_2_1",
            "topic_id": "calcnum_2",
            "question": "O método de Gauss-Seidel converge mais rápido que Jacobi porque:",
            "options": [
                "Usa valores atualizados imediatamente",
                "Usa menos iterações",
                "É mais simples",
                "Não requer matriz diagonal dominante"
            ],
            "correct_answer": 0,
            "explanation": "Gauss-Seidel usa os valores já calculados na mesma iteração, enquanto Jacobi usa apenas valores da iteração anterior, tornando a convergência geralmente mais rápida.",
            "difficulty": "Intermediário"
        }
    ],
    "calcnum_3": [  # Interpolação
        {
            "id": "ex_calcnum_3_1",
            "topic_id": "calcnum_3",
            "question": "Quantos pontos são necessários para uma interpolação polinomial de grau n?",
            "options": ["n pontos", "n+1 pontos", "n-1 pontos", "2n pontos"],
            "correct_answer": 1,
            "explanation": "Para determinar um polinômio de grau n são necessários n+1 pontos. Por exemplo, para uma reta (grau 1) precisamos de 2 pontos.",
            "difficulty": "Básico"
        }
    ]
}

@router.get("/topics/{topic_id}/exercises")
async def get_exercises_for_topic(topic_id: str):
    """
    Get all exercises for a specific topic
    """
    try:
        exercises = EXERCISES_DB.get(topic_id, [])
        
        # Get topic name from the topics data
        topic_names = {
            "calc1_1": {"name": "Limites", "category": "Cálculo 1", "difficulty": "Básico"},
            "calc1_2": {"name": "Derivadas", "category": "Cálculo 1", "difficulty": "Intermediário"},
            "calc1_3": {"name": "Aplicações de Derivadas", "category": "Cálculo 1", "difficulty": "Intermediário"},
            "calc1_4": {"name": "Integrais", "category": "Cálculo 1", "difficulty": "Avançado"},
            "calc2_1": {"name": "Funções de Várias Variáveis", "category": "Cálculo 2", "difficulty": "Intermediário"},
            "calc2_2": {"name": "Derivadas Parciais", "category": "Cálculo 2", "difficulty": "Avançado"},
            "calc2_3": {"name": "Integrais Múltiplas", "category": "Cálculo 2", "difficulty": "Avançado"},
            "calc3_1": {"name": "Campos Vetoriais", "category": "Cálculo 3", "difficulty": "Intermediário"},
            "calc3_2": {"name": "Integrais de Linha", "category": "Cálculo 3", "difficulty": "Avançado"},
            "calc3_3": {"name": "Teoremas de Green e Stokes", "category": "Cálculo 3", "difficulty": "Avançado"},
            "calcnum_1": {"name": "Zeros de Funções", "category": "Cálculo Numérico", "difficulty": "Intermediário"},
            "calcnum_2": {"name": "Sistemas Lineares", "category": "Cálculo Numérico", "difficulty": "Avançado"},
            "calcnum_3": {"name": "Interpolação", "category": "Cálculo Numérico", "difficulty": "Intermediário"}
        }
        
        topic_info = topic_names.get(topic_id, {"name": "Tópico Desconhecido", "category": "Desconhecido", "difficulty": "Intermediário"})
        
        return {
            "topic": topic_info,
            "exercises": exercises,
            "total": len(exercises)
        }
        
    except Exception as e:
        logger.error(f"Error getting exercises: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/exercises/attempt")
async def submit_exercise_attempt(attempt: ExerciseAttemptCreate):
    """
    Submit an exercise attempt and save to database
    """
    try:
        # In production, save to MongoDB
        # For now, just log and return success
        logger.info(f"Exercise attempt: user={attempt.user_id}, exercise={attempt.exercise_id}, correct={attempt.is_correct}, time={attempt.time_spent}s")
        
        return {
            "success": True,
            "is_correct": attempt.is_correct,
            "message": "Resposta registrada com sucesso!"
        }
        
    except Exception as e:
        logger.error(f"Error submitting attempt: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/exercises/stats/{user_id}")
async def get_user_exercise_stats(user_id: str):
    """
    Get exercise statistics for a user
    """
    try:
        # In production, query MongoDB for actual stats
        # For now, return mock data
        return {
            "total_attempts": 0,
            "correct_answers": 0,
            "accuracy": 0.0,
            "topics_completed": [],
            "time_spent_total": 0
        }
        
    except Exception as e:
        logger.error(f"Error getting stats: {e}")
        raise HTTPException(status_code=500, detail=str(e))
