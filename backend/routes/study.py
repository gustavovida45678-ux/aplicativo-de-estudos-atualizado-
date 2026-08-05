from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
import logging

logger = logging.getLogger(__name__)

router = APIRouter()

# Mock data for exercises/topics
TOPICS_DATA = {
    "calculo1": {
        "name": "Cálculo 1",
        "topics": [
            {"id": "calc1_1", "name": "Limites", "exercises_count": 15},
            {"id": "calc1_2", "name": "Derivadas", "exercises_count": 20},
            {"id": "calc1_3", "name": "Aplicações de Derivadas", "exercises_count": 18},
            {"id": "calc1_4", "name": "Integrais", "exercises_count": 25},
        ]
    },
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
            {"id": "ed_1", "name": "Programação Estruturada e Modular", "exercises_count": 10},
            {"id": "ed_2", "name": "Análise de Algoritmos", "exercises_count": 8},
            {"id": "ed_3", "name": "Vetores e Strings", "exercises_count": 12},
            {"id": "ed_4", "name": "Matrizes Multidimensionais", "exercises_count": 8},
            {"id": "ed_5", "name": "Estruturas Estáticas e Dinâmicas", "exercises_count": 8},
            {"id": "ed_6", "name": "Pilhas e Filas", "exercises_count": 12},
            {"id": "ed_7", "name": "Listas Encadeadas", "exercises_count": 12},
            {"id": "ed_8", "name": "Árvores", "exercises_count": 10},
        ]
    },
    "sistemasdigitais": {
        "name": "Sistemas Digitais",
        "topics": [
            {"id": "sd_1", "name": "Sistemas de Numeração", "exercises_count": 12},
            {"id": "sd_2", "name": "Portas e Funções Lógicas", "exercises_count": 10},
            {"id": "sd_3", "name": "Álgebra de Boole e Simplificação", "exercises_count": 12},
            {"id": "sd_4", "name": "Circuitos Combinacionais", "exercises_count": 10},
            {"id": "sd_5", "name": "Flip-Flops e Contadores", "exercises_count": 12},
            {"id": "sd_6", "name": "Conversores, Multiplex e Memórias", "exercises_count": 10},
        ]
    }
}

class StatsResponse(BaseModel):
    totalExercises: int
    completedExercises: int
    studyTime: int

@router.get("/stats")
async def get_study_stats():
    """
    Get study statistics
    Returns mock data for now
    """
    try:
        return StatsResponse(
            totalExercises=150,
            completedExercises=0,
            studyTime=0
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
        return TOPICS_DATA
    except Exception as e:
        logger.error(f"Error getting topics: {e}")
        raise HTTPException(status_code=500, detail=str(e))
