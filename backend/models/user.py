from pydantic import BaseModel, EmailStr, Field, ConfigDict
from typing import Optional
from datetime import datetime, timezone
import uuid


class User(BaseModel):
    """User model for authentication"""
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: EmailStr
    name: str
    hashed_password: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    is_active: bool = True
    is_admin: bool = False
    email_verified: bool = False
    verification_token: Optional[str] = None


class UserCreate(BaseModel):
    """Schema for user registration"""
    email: EmailStr
    name: str
    password: str


class UserLogin(BaseModel):
    """Schema for user login"""
    email: EmailStr
    password: str


class GuestAccess(BaseModel):
    """Schema for guest access (name + email, no password)"""
    email: EmailStr
    name: str


class UserResponse(BaseModel):
    """Schema for user response (without password)"""
    id: str
    email: str
    name: str
    created_at: datetime
    is_active: bool
    is_admin: bool
    email_verified: bool = False


class RegisterResponse(BaseModel):
    """Schema for register response with verification info (mock mode)"""
    user: UserResponse
    verification_required: bool = True
    verification_link: Optional[str] = None
    message: str = "Confirme seu email para ativar a conta"


class VerifyEmailRequest(BaseModel):
    """Schema for email verification"""
    token: str


class ResendVerificationRequest(BaseModel):
    """Schema for resending verification email"""
    email: EmailStr


class Token(BaseModel):
    """Schema for JWT token response"""
    access_token: str
    token_type: str


class TokenData(BaseModel):
    """Schema for decoded JWT token data"""
    email: Optional[str] = None
