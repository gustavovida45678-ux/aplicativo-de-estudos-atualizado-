from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime
import uuid

class Exercise(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    topic_id: str
    question: str
    options: List[str]
    correct_answer: int  # Index of the correct option
    explanation: str
    difficulty: str = "Intermediário"  # Básico, Intermediário, Avançado
    created_at: datetime = Field(default_factory=datetime.utcnow)

class ExerciseAttempt(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    exercise_id: str
    topic_id: str
    selected_answer: int
    is_correct: bool
    time_spent: int  # in seconds
    created_at: datetime = Field(default_factory=datetime.utcnow)

class ExerciseAttemptCreate(BaseModel):
    user_id: str
    exercise_id: str
    topic_id: str
    selected_answer: int
    is_correct: bool
    time_spent: int
