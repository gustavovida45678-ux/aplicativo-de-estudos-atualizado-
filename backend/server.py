import os
import sys
import logging
import uuid
from pathlib import Path
from datetime import datetime, timezone

ROOT_DIR = Path(__file__).parent

# Ensure the backend directory is importable when the app is started as
# `uvicorn backend.server:app` from the repository root (Render/Procfile).
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))
# Repo root is added so the local `emergentintegrations` shim (kept at the
# repository root) is importable even when Render runs from backend/.
if str(ROOT_DIR.parent) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR.parent))

from fastapi import FastAPI, APIRouter
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field, ConfigDict
from typing import List
from routes.schedule import router as schedule_router
from routes.chat import router as chat_router
from routes.study import router as study_router
from routes.exercises import router as exercises_router
from routes.commands import router as commands_router
from routes.math import router as math_router
from routes.auth import router as auth_router
from routes.exercise_generator import router as exercise_generator_router
from routes.feedback import router as feedback_router
from routes.moodle import router as moodle_router
from routes.judge import router as judge_router

load_dotenv(ROOT_DIR / '.env')

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# MongoDB connection (suporta MONGO_URL e MONGODB_URI - Render Atlas)
mongo_url = os.environ.get('MONGO_URL') or os.environ.get('MONGODB_URI')
db_name = os.environ.get('DB_NAME', 'study_app')
logger.info(
    "Startup env check -> MONGO_URL set: %s | MONGODB_URI set: %s | DB_NAME: %s",
    bool(os.environ.get('MONGO_URL')),
    bool(os.environ.get('MONGODB_URI')),
    db_name,
)
client = AsyncIOMotorClient(mongo_url) if mongo_url else None
db = client[db_name] if client else None

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")


# Define Models
class StatusCheck(BaseModel):
    model_config = ConfigDict(extra="ignore")  # Ignore MongoDB's _id field
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_name: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class StatusCheckCreate(BaseModel):
    client_name: str

# Add your routes to the router instead of directly to app
@api_router.get("/")
async def root():
    return {"message": "Hello World"}

@api_router.get("/health")
async def health():
    import asyncio as _asyncio
    if client is None:
        return {"status": "degraded", "mongo": "MONGO_URL/MONGODB_URI not set"}
    try:
        await _asyncio.wait_for(client.admin.command("ping"), timeout=3)
        return {"status": "ok", "mongo": "ok"}
    except Exception as e:
        return {"status": "degraded", "mongo": f"error: {e}"}

@api_router.post("/status", response_model=StatusCheck)
async def create_status_check(input: StatusCheckCreate):
    status_dict = input.model_dump()
    status_obj = StatusCheck(**status_dict)
    
    # Convert to dict and serialize datetime to ISO string for MongoDB
    doc = status_obj.model_dump()
    doc['timestamp'] = doc['timestamp'].isoformat()
    
    _ = await db.status_checks.insert_one(doc)
    return status_obj

@api_router.get("/status", response_model=List[StatusCheck])
async def get_status_checks():
    # Exclude MongoDB's _id field from the query results
    status_checks = await db.status_checks.find({}, {"_id": 0}).to_list(1000)
    
    # Convert ISO string timestamps back to datetime objects
    for check in status_checks:
        if isinstance(check['timestamp'], str):
            check['timestamp'] = datetime.fromisoformat(check['timestamp'])
    
    return status_checks

# Include routers
api_router.include_router(auth_router, prefix="/auth", tags=["auth"])
api_router.include_router(chat_router, tags=["chat"])
api_router.include_router(study_router, prefix="/study", tags=["study"])
api_router.include_router(exercises_router, prefix="/study", tags=["exercises"])
api_router.include_router(exercise_generator_router, prefix="/exercises", tags=["exercise-generator"])
api_router.include_router(commands_router, prefix="/commands", tags=["commands"])
api_router.include_router(math_router, prefix="/math", tags=["math"])
api_router.include_router(feedback_router, prefix="/feedback", tags=["feedback"])
api_router.include_router(moodle_router, tags=["moodle"])
api_router.include_router(judge_router, tags=["judge"])
app.include_router(api_router)

# Include schedule router with /api/schedule prefix
schedule_api_router = APIRouter(prefix="/api/schedule")
schedule_api_router.include_router(schedule_router)
app.include_router(schedule_api_router)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://aplicativo-de-estudos-atualizado.onrender.com"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

@app.on_event("shutdown")
async def shutdown_db_client():
    if client is not None:
        client.close()
