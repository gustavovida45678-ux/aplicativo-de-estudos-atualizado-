from fastapi import APIRouter, HTTPException, Depends, File, UploadFile, Form
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import logging
from datetime import datetime, timedelta
import json
import io
from utils.auth import get_current_user

logger = logging.getLogger(__name__)

router = APIRouter()

# Mock data for exercises/topics
TOPICS_DATA = {
    "calculo2": {
        "name": "Cálculo 2",
        "topics": [
            {"id": "calc2_1", "name": "Funções de Várias Variáveis", "exercises_count": 16},
            {"id": "calc2_2", "name": "Derivadas Parciais", "exercises_count": 22},
            {"id": "calc2_3", "name": "Integrais Múltiplas", "exercises_count": 20},
        ]
    },
    "calculo3": {
        "name": "Cálculo 3",
        "topics": [
            {"id": "calc3_1", "name": "Campos Vetoriais", "exercises_count": 14},
            {"id": "calc3_2", "name": "Integrais de Linha", "exercises_count": 18},
            {"id": "calc3_3", "name": "Teoremas de Green e Stokes", "exercises_count": 16},
        ]
    },
    "calculonumerico": {
        "name": "Cálculo Numérico",
        "topics": [
            {"id": "calcnum_1", "name": "Zeros de Funções", "exercises_count": 12},
            {"id": "calcnum_2", "name": "Sistemas Lineares", "exercises_count": 15},
            {"id": "calcnum_3", "name": "Interpolação", "exercises_count": 10},
        ]
    },
    "estruturadedados": {
        "name": "Estrutura de Dados",
        "topics": [
            {"id": "ed_1", "name": "Programação Estruturada e Modular", "exercises_count": 6},
            {"id": "ed_2", "name": "Análise de Algoritmos", "exercises_count": 6},
            {"id": "ed_3", "name": "Vetores e Strings", "exercises_count": 7},
            {"id": "ed_4", "name": "Matrizes Multidimensionais", "exercises_count": 6},
            {"id": "ed_5", "name": "Estruturas Estáticas e Dinâmicas", "exercises_count": 6},
            {"id": "ed_6", "name": "Pilhas e Filas", "exercises_count": 7},
            {"id": "ed_7", "name": "Listas Encadeadas", "exercises_count": 6},
            {"id": "ed_8", "name": "Árvores", "exercises_count": 6},
            {"id": "ed_simulado", "name": "Simulado - Estrutura de Dados (formato de prova)", "exercises_count": 10},
        ]
    },
    "sistemasdigitais": {
        "name": "Sistemas Digitais",
        "topics": [
            {"id": "sd_1", "name": "Sistemas de Numeração", "exercises_count": 8},
            {"id": "sd_2", "name": "Portas e Funções Lógicas", "exercises_count": 7},
            {"id": "sd_3", "name": "Álgebra de Boole e Simplificação", "exercises_count": 7},
            {"id": "sd_4", "name": "Circuitos Combinacionais", "exercises_count": 7},
            {"id": "sd_5", "name": "Flip-Flops e Contadores", "exercises_count": 7},
            {"id": "sd_6", "name": "Conversores, Multiplex e Memórias", "exercises_count": 7},
            {"id": "sd_simulado", "name": "Simulado - Sistemas Digitais (formato de prova)", "exercises_count": 10},
        ]
    }
}

# Models
class StatsResponse(BaseModel):
    totalExercises: int
    completedExercises: int
    studyTime: int

class SummaryRequest(BaseModel):
    session_id: str
    exercises_completed: int
    exercises_correct: int
    accuracy: int

class MentalMapRequest(BaseModel):
    summary: Dict[str, Any]
    topic: str

class ReviewScheduleRequest(BaseModel):
    session_id: str
    intervals_days: List[int]
    topic_id: str

class ReviewSchedule(BaseModel):
    scheduled_date: str
    days_from_now: int

# Endpoints

@router.get("/stats")
async def get_study_stats(user: dict = Depends(get_current_user)):
    """
    Estatísticas reais do estudo: exercícios respondidos, tópicos tocados e tempo
    total acumulado (sessões adaptativas concluídas). Fallback para mock vazio.
    """
    try:
        from services.adaptive_store import adaptive_store

        user_id = user["email"]
        total = 0
        completed = 0
        study_time = 0

        sessions = await adaptive_store.list_sessions(user_id)
        for s in sessions:
            stats = s.get("stats") or {}
            total += stats.get("total", 0)
            completed += stats.get("correct", 0)
            study_time += s.get("duration_min") or 0

        skills = await adaptive_store.list_skills(user_id)
        total += sum((sk.get("attempts") or 0) for sk in skills)

        return StatsResponse(
            totalExercises=total,
            completedExercises=completed,
            studyTime=study_time,
        )
    except Exception as e:
        logger.error(f"Error getting stats: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/topics")
async def get_study_topics():
    """
    Get available study topics for exercises
    """
    try:
        return {"topics": TOPICS_DATA}
    except Exception as e:
        logger.error(f"Error getting topics: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/session/start")
async def start_session(topic_id: str, user: dict = Depends(get_current_user)):
    """Inicia uma sessão de estudo"""
    try:
        from services.adaptive_store import adaptive_store
        
        session_data = {
            "user_id": user["email"],
            "topic_id": topic_id,
            "start_time": datetime.now().isoformat(),
            "exercises": [],
            "duration_min": 0
        }
        
        session_id = await adaptive_store.create_session(user["email"], session_data)
        return {"session_id": session_id, "message": "Sessão iniciada"}
    except Exception as e:
        logger.error(f"Error starting session: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/session/end")
async def end_session(
    session_id: str,
    duration: int,
    exercises_completed: int,
    exercises_correct: int,
    user: dict = Depends(get_current_user)
):
    """Finaliza uma sessão de estudo"""
    try:
        from services.adaptive_store import adaptive_store
        
        session_data = {
            "end_time": datetime.now().isoformat(),
            "duration_min": duration,
            "exercises_completed": exercises_completed,
            "exercises_correct": exercises_correct,
            "accuracy": round((exercises_correct / exercises_completed * 100) if exercises_completed > 0 else 0)
        }
        
        await adaptive_store.update_session(user["email"], session_id, session_data)
        return {"message": "Sessão finalizada com sucesso"}
    except Exception as e:
        logger.error(f"Error ending session: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/generate-summary")
async def generate_summary(request: SummaryRequest, user: dict = Depends(get_current_user)):
    """
    Gera um resumo da sessão de estudo com análise de performance
    """
    try:
        from services.chat_service import chat_service
        from services.providers import ProviderType
        
        prompt = f"""Análise de Sessão de Estudos:
- Exercícios Completados: {request.exercises_completed}
- Exercícios Corretos: {request.exercises_correct}
- Acurácia: {request.accuracy}%
- Sessão ID: {request.session_id}

Por favor, gere um resumo da sessão incluindo:
1. Análise de Performance
2. Principais Tópicos Cobertos
3. Principais Aprendizados
4. Recomendações para Melhoria

Responda em JSON com os campos: total_exercises, accuracy, study_duration, main_topics (lista), key_learnings (lista), recommendations (lista)
"""
        
        response = await chat_service.chat(
            message=prompt,
            provider_type=ProviderType.GROQ,
            temperature=0.7,
            max_tokens=1024
        )
        
        # Parse JSON response
        import json
        import re
        
        response_text = response.get("content", "")
        json_match = re.search(r'\{.*\}', response_text, re.DOTALL)
        
        if json_match:
            summary_data = json.loads(json_match.group())
        else:
            summary_data = {
                "total_exercises": request.exercises_completed,
                "accuracy": request.accuracy,
                "study_duration": "Sessão completada",
                "main_topics": ["Exercícios práticos", "Resolução de problemas"],
                "key_learnings": ["Prática consistente melhora desempenho", "Revisar conceitos fundamentais"],
                "recommendations": ["Continuar praticando", "Focar em tópicos com menor acurácia"]
            }
        
        return summary_data
    except Exception as e:
        logger.error(f"Error generating summary: {e}")
        return {
            "total_exercises": request.exercises_completed,
            "accuracy": request.accuracy,
            "study_duration": "Sessão completada",
            "main_topics": ["Conteúdo estudado"],
            "key_learnings": ["Prática concluída"],
            "recommendations": ["Revisar em breve"]
        }

@router.post("/generate-mental-map")
async def generate_mental_map(request: MentalMapRequest, user: dict = Depends(get_current_user)):
    """
    Gera um mapa mental com base no resumo da sessão
    """
    try:
        from services.chat_service import chat_service
        from services.providers import ProviderType
        
        topics_str = ", ".join(request.summary.get("main_topics", []))
        
        prompt = f"""Crie um mapa mental estruturado (em JSON) para o tópico: {request.topic}
Tópicos principais cobertos: {topics_str}

Estruture como um objeto JSON com:
- "central_topic": nome do tema central
- "main_branches": lista de 3-5 ramos principais
- "sub_branches": dicionário com sub-ramos para cada ramo principal
- "connections": lista de conexões entre conceitos
- "description": breve descrição

Responda APENAS com JSON válido.
"""
        
        response = await chat_service.chat(
            message=prompt,
            provider_type=ProviderType.GROQ,
            temperature=0.7,
            max_tokens=1024
        )
        
        import json
        import re
        
        response_text = response.get("content", "")
        json_match = re.search(r'\{.*\}', response_text, re.DOTALL)
        
        if json_match:
            mental_map = json.loads(json_match.group())
        else:
            mental_map = {
                "central_topic": request.topic,
                "main_branches": ["Conceitos", "Aplicações", "Prática"],
                "sub_branches": {
                    "Conceitos": ["Definição", "Propriedades"],
                    "Aplicações": ["Exemplos", "Casos reais"],
                    "Prática": ["Exercícios", "Resolução"]
                },
                "connections": ["Conectar teoria com prática"],
                "description": "Mapa mental gerado automaticamente"
            }
        
        return {
            "structure": mental_map,
            "description": mental_map.get("description", "Mapa mental do tópico estudado"),
            "image_url": None  # Será gerado posteriormente se necessário
        }
    except Exception as e:
        logger.error(f"Error generating mental map: {e}")
        return {
            "structure": {
                "central_topic": request.topic,
                "main_branches": ["Teoria", "Prática", "Aplicação"],
                "sub_branches": {},
                "connections": []
            },
            "description": "Mapa mental padrão",
            "image_url": None
        }

@router.post("/schedule-reviews")
async def schedule_reviews(request: ReviewScheduleRequest, user: dict = Depends(get_current_user)):
    """
    Agenda revisões com intervalos de repetição espaçada (Spaced Repetition)
    Intervalos: 1, 2, 3, 6, 9 dias
    """
    try:
        from services.adaptive_store import adaptive_store
        
        schedules = []
        base_date = datetime.now()
        
        for days_interval in sorted(request.intervals_days):
            review_date = base_date + timedelta(days=days_interval)
            schedule = {
                "session_id": request.session_id,
                "topic_id": request.topic_id,
                "scheduled_date": review_date.strftime("%d/%m/%Y"),
                "days_from_now": days_interval,
                "created_at": datetime.now().isoformat(),
                "status": "pending"
            }
            schedules.append(schedule)
            
            # Salvar no banco de dados
            try:
                await adaptive_store.db.review_schedules.insert_one(schedule)
            except Exception as save_err:
                logger.warning(f"Could not save schedule to DB: {save_err}")
        
        return {
            "message": f"{len(schedules)} revisões agendadas",
            "schedules": schedules
        }
    except Exception as e:
        logger.error(f"Error scheduling reviews: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/reviews/pending")
async def get_pending_reviews(user: dict = Depends(get_current_user)):
    """
    Retorna revisões pendentes para o usuário
    """
    try:
        from services.adaptive_store import adaptive_store
        
        today = datetime.now().strftime("%d/%m/%Y")
        
        try:
            pending = await adaptive_store.db.review_schedules.find({
                "status": "pending"
            }).to_list(100)
        except:
            pending = []
        
        return {
            "pending_reviews": pending,
            "total_pending": len(pending)
        }
    except Exception as e:
        logger.error(f"Error getting pending reviews: {e}")
        return {
            "pending_reviews": [],
            "total_pending": 0
        }

@router.post("/mark-review-done")
async def mark_review_done(review_id: str, user: dict = Depends(get_current_user)):
    """
    Marca uma revisão como concluída
    """
    try:
        from services.adaptive_store import adaptive_store
        
        try:
            await adaptive_store.db.review_schedules.update_one(
                {"_id": review_id},
                {"$set": {"status": "completed", "completed_at": datetime.now().isoformat()}}
            )
        except:
            pass
        
        return {"message": "Revisão marcada como concluída"}
    except Exception as e:
        logger.error(f"Error marking review done: {e}")
        raise HTTPException(status_code=500, detail=str(e))
