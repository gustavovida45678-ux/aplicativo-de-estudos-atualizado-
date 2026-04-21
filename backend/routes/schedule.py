from fastapi import APIRouter, HTTPException
from motor.motor_asyncio import AsyncIOMotorClient
from models.schedule import Subject, SubjectInDB, Task, TaskInDB, TaskResponse
from typing import List
import os
import logging

logger = logging.getLogger(__name__)

router = APIRouter()

# MongoDB connection
mongo_url = os.environ.get('MONGO_URL')
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ.get('DB_NAME', 'study_schedule_db')]

# Initial subjects data
INITIAL_SUBJECTS = [
    {
        "subject_id": "calc1",
        "name": "Cálculo 1",
        "color": "#3b82f6",
        "icon": "∫",
        "topics": [
            {"id": 1, "title": "Limites e Continuidade", "completed": False},
            {"id": 2, "title": "Derivadas - Definição e Regras Básicas", "completed": False},
            {"id": 3, "title": "Regra da Cadeia e Derivadas Implícitas", "completed": False},
            {"id": 4, "title": "Aplicações de Derivadas - Máximos e Mínimos", "completed": False},
            {"id": 5, "title": "Teorema do Valor Médio", "completed": False},
            {"id": 6, "title": "Integrais Indefinidas", "completed": False},
            {"id": 7, "title": "Integrais Definidas e Teorema Fundamental", "completed": False},
            {"id": 8, "title": "Técnicas de Integração - Substituição", "completed": False},
            {"id": 9, "title": "Técnicas de Integração - Por Partes", "completed": False},
            {"id": 10, "title": "Aplicações de Integrais - Áreas", "completed": False},
        ],
    },
    {
        "subject_id": "calc2",
        "name": "Cálculo 2",
        "color": "#8b5cf6",
        "icon": "∬",
        "topics": [
            {"id": 11, "title": "Funções de Várias Variáveis", "completed": False},
            {"id": 12, "title": "Derivadas Parciais", "completed": False},
            {"id": 13, "title": "Regra da Cadeia para Várias Variáveis", "completed": False},
            {"id": 14, "title": "Gradiente e Derivadas Direcionais", "completed": False},
            {"id": 15, "title": "Máximos e Mínimos de Funções de Várias Variáveis", "completed": False},
            {"id": 16, "title": "Multiplicadores de Lagrange", "completed": False},
            {"id": 17, "title": "Integrais Duplas", "completed": False},
            {"id": 18, "title": "Mudança de Variáveis em Integrais Duplas", "completed": False},
            {"id": 19, "title": "Integrais Triplas", "completed": False},
            {"id": 20, "title": "Coordenadas Cilíndricas e Esféricas", "completed": False},
        ],
    },
    {
        "subject_id": "calc3",
        "name": "Cálculo 3",
        "color": "#ec4899",
        "icon": "∮",
        "topics": [
            {"id": 21, "title": "Campos Vetoriais", "completed": False},
            {"id": 22, "title": "Integrais de Linha", "completed": False},
            {"id": 23, "title": "Teorema de Green", "completed": False},
            {"id": 24, "title": "Superfícies Paramétricas", "completed": False},
            {"id": 25, "title": "Integrais de Superfície", "completed": False},
            {"id": 26, "title": "Teorema de Stokes", "completed": False},
            {"id": 27, "title": "Teorema da Divergência", "completed": False},
            {"id": 28, "title": "Rotacional e Divergência", "completed": False},
            {"id": 29, "title": "Equações Diferenciais Ordinárias", "completed": False},
            {"id": 30, "title": "Séries de Fourier", "completed": False},
        ],
    },
    {
        "subject_id": "calcnum",
        "name": "Cálculo Numérico",
        "color": "#10b981",
        "icon": "≈",
        "topics": [
            {"id": 31, "title": "Erros e Aritmética de Ponto Flutuante", "completed": False},
            {"id": 32, "title": "Zeros de Funções - Método da Bisseção", "completed": False},
            {"id": 33, "title": "Método de Newton-Raphson", "completed": False},
            {"id": 34, "title": "Método da Secante", "completed": False},
            {"id": 35, "title": "Sistemas Lineares - Eliminação de Gauss", "completed": False},
            {"id": 36, "title": "Decomposição LU", "completed": False},
            {"id": 37, "title": "Métodos Iterativos - Gauss-Seidel", "completed": False},
            {"id": 38, "title": "Interpolação Polinomial", "completed": False},
            {"id": 39, "title": "Integração Numérica - Regra do Trapézio", "completed": False},
            {"id": 40, "title": "Integração Numérica - Regra de Simpson", "completed": False},
        ],
    },
]

INITIAL_TASKS = [
    {
        "id": 1,
        "subject": "calc1",
        "task": "Resolver lista de limites",
        "dueDate": "2026-03-25",
        "completed": False,
        "priority": "high",
    },
    {
        "id": 2,
        "subject": "calc2",
        "task": "Estudar derivadas parciais",
        "dueDate": "2026-03-26",
        "completed": False,
        "priority": "medium",
    },
    {
        "id": 3,
        "subject": "calc3",
        "task": "Revisar Teorema de Green",
        "dueDate": "2026-03-27",
        "completed": False,
        "priority": "high",
    },
    {
        "id": 4,
        "subject": "calcnum",
        "task": "Implementar método de Newton",
        "dueDate": "2026-03-28",
        "completed": False,
        "priority": "medium",
    },
]

async def initialize_data():
    """Initialize database with default data if empty"""
    try:
        # Check if subjects exist
        subjects_count = await db.subjects.count_documents({"user_id": "default"})
        if subjects_count == 0:
            logger.info("Initializing subjects data...")
            for subject_data in INITIAL_SUBJECTS:
                subject_data["user_id"] = "default"
                await db.subjects.insert_one(subject_data)
            logger.info(f"Initialized {len(INITIAL_SUBJECTS)} subjects")
        
        # Check if tasks exist
        tasks_count = await db.tasks.count_documents({"user_id": "default"})
        if tasks_count == 0:
            logger.info("Initializing tasks data...")
            for task_data in INITIAL_TASKS:
                task_data["user_id"] = "default"
                await db.tasks.insert_one(task_data)
            logger.info(f"Initialized {len(INITIAL_TASKS)} tasks")
    except Exception as e:
        logger.error(f"Error initializing data: {e}")

@router.on_event("startup")
async def startup_event():
    await initialize_data()

# Subjects endpoints
@router.get("/subjects", response_model=List[Subject])
async def get_subjects():
    """Get all subjects with topics"""
    try:
        subjects = await db.subjects.find({"user_id": "default"}, {"_id": 0, "user_id": 0}).to_list(100)
        return subjects
    except Exception as e:
        logger.error(f"Error getting subjects: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/subjects/{subject_id}/topics/{topic_id}/toggle")
async def toggle_topic(subject_id: str, topic_id: int):
    """Toggle topic completion status"""
    try:
        # Find the subject
        subject = await db.subjects.find_one({"user_id": "default", "subject_id": subject_id})
        if not subject:
            raise HTTPException(status_code=404, detail="Subject not found")
        
        # Find and toggle the topic
        topics = subject.get("topics", [])
        topic_found = False
        for topic in topics:
            if topic["id"] == topic_id:
                topic["completed"] = not topic["completed"]
                topic_found = True
                break
        
        if not topic_found:
            raise HTTPException(status_code=404, detail="Topic not found")
        
        # Update the subject
        await db.subjects.update_one(
            {"user_id": "default", "subject_id": subject_id},
            {"$set": {"topics": topics}}
        )
        
        # Return updated subject
        updated_subject = await db.subjects.find_one(
            {"user_id": "default", "subject_id": subject_id},
            {"_id": 0, "user_id": 0}
        )
        return updated_subject
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error toggling topic: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Tasks endpoints
@router.get("/tasks", response_model=List[TaskResponse])
async def get_tasks():
    """Get all tasks"""
    try:
        tasks = await db.tasks.find({"user_id": "default"}, {"_id": 0, "user_id": 0}).to_list(1000)
        return tasks
    except Exception as e:
        logger.error(f"Error getting tasks: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/tasks", response_model=TaskResponse)
async def create_task(task: Task):
    """Create a new task"""
    try:
        # Get the highest task ID
        all_tasks = await db.tasks.find({"user_id": "default"}).to_list(1000)
        max_id = max([t.get("id", 0) for t in all_tasks]) if all_tasks else 0
        
        # Create new task
        task_data = task.dict()
        task_data["id"] = max_id + 1
        task_data["user_id"] = "default"
        task_data["completed"] = False
        
        await db.tasks.insert_one(task_data)
        
        # Return created task without MongoDB _id
        del task_data["user_id"]
        return task_data
    except Exception as e:
        logger.error(f"Error creating task: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/tasks/{task_id}/toggle")
async def toggle_task(task_id: int):
    """Toggle task completion status"""
    try:
        task = await db.tasks.find_one({"user_id": "default", "id": task_id})
        if not task:
            raise HTTPException(status_code=404, detail="Task not found")
        
        new_status = not task.get("completed", False)
        await db.tasks.update_one(
            {"user_id": "default", "id": task_id},
            {"$set": {"completed": new_status}}
        )
        
        updated_task = await db.tasks.find_one(
            {"user_id": "default", "id": task_id},
            {"_id": 0, "user_id": 0}
        )
        return updated_task
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error toggling task: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/tasks/{task_id}")
async def delete_task(task_id: int):
    """Delete a task"""
    try:
        result = await db.tasks.delete_one({"user_id": "default", "id": task_id})
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Task not found")
        return {"message": "Task deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting task: {e}")
        raise HTTPException(status_code=500, detail=str(e))
