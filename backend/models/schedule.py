from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime

class Topic(BaseModel):
    id: int
    title: str
    completed: bool = False

class Subject(BaseModel):
    subject_id: str
    name: str
    color: str
    icon: str
    topics: List[Topic]

class SubjectInDB(Subject):
    user_id: str = "default"

class Task(BaseModel):
    subject: str
    task: str
    dueDate: Optional[str] = None
    priority: str = "medium"

class TaskInDB(Task):
    id: int
    user_id: str = "default"
    completed: bool = False

class TaskResponse(BaseModel):
    id: int
    subject: str
    task: str
    dueDate: Optional[str] = None
    priority: str
    completed: bool
