from pydantic import BaseModel, Field
from typing import Optional, Dict, Any
from datetime import datetime
import uuid

class CommandExecution(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str = "default_user"
    command: str
    command_type: str  # 'preset', 'ai', 'config'
    parameters: Optional[Dict[str, Any]] = None
    result: Optional[str] = None
    success: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)

class CommandRequest(BaseModel):
    command: str
    context: Optional[Dict[str, Any]] = None

class CommandResponse(BaseModel):
    success: bool
    result: str
    action_type: str  # 'frontend', 'backend', 'config', 'both'
    changes: Optional[Dict[str, Any]] = None
    preview: Optional[str] = None
