from fastapi import APIRouter, HTTPException, status, Depends, Header
from pydantic import BaseModel, EmailStr, Field, ConfigDict
from typing import Optional
from datetime import datetime, timezone
import uuid
import logging

from utils.supabase import get_supabase, get_supabase_admin

logger = logging.getLogger(__name__)
router = APIRouter()


class UserCreate(BaseModel):
    email: EmailStr
    name: str
    password: str


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    id: str
    email: str
    name: str
    created_at: datetime
    is_active: bool = True
    is_admin: bool = False
    email_verified: bool = False


class RegisterResponse(BaseModel):
    user: UserResponse
    verification_required: bool = False
    message: str = "Cadastro realizado com sucesso"


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


class TokenData(BaseModel):
    email: Optional[str] = None
    user_id: Optional[str] = None


async def get_current_user(authorization: Optional[str] = Header(None)) -> dict:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    token = authorization.split(" ")[1]
    supabase = get_supabase()
    
    try:
        user_response = supabase.auth.get_user(token)
        if not user_response.user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token",
            )
        
        user = user_response.user
        return {
            "id": user.id,
            "email": user.email,
            "name": user.user_metadata.get("name", user.email.split("@")[0]),
            "created_at": user.created_at,
            "email_verified": user.email_confirmed_at is not None,
        }
    except Exception as e:
        logger.error(f"Error getting user: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token",
        )


@router.post("/register", response_model=RegisterResponse, status_code=status.HTTP_201_CREATED)
async def register(user_data: UserCreate):
    supabase = get_supabase()
    
    try:
        # Register with Supabase Auth
        auth_response = supabase.auth.sign_up({
            "email": user_data.email,
            "password": user_data.password,
            "options": {
                "data": {
                    "name": user_data.name,
                }
            }
        })
        
        if auth_response.user is None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Erro ao registrar usuário"
            )
        
        user = auth_response.user
        
        logger.info(f"New user registered: {user.email}")
        
        return RegisterResponse(
            user=UserResponse(
                id=user.id,
                email=user.email,
                name=user_data.name,
                created_at=datetime.fromisoformat(user.created_at.replace("Z", "+00:00")) if isinstance(user.created_at, str) else user.created_at,
                email_verified=user.email_confirmed_at is not None,
            ),
            verification_required=not user.email_confirmed_at,
            message="Cadastro realizado. Confirme seu email se necessário."
        )
        
    except Exception as e:
        logger.error(f"Error registering user: {e}")
        if "already registered" in str(e).lower() or "duplicate" in str(e).lower():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email já cadastrado"
            )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erro ao registrar usuário"
        )


@router.post("/login", response_model=Token)
async def login(credentials: UserLogin):
    supabase = get_supabase()
    
    try:
        auth_response = supabase.auth.sign_in_with_password({
            "email": credentials.email,
            "password": credentials.password
        })
        
        if not auth_response.user or not auth_response.session:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Email ou senha incorretos"
            )
        
        user = auth_response.user
        session = auth_response.session
        
        logger.info(f"User logged in: {credentials.email}")
        
        return Token(
            access_token=session.access_token,
            token_type="bearer",
            user=UserResponse(
                id=user.id,
                email=user.email,
                name=user.user_metadata.get("name", user.email.split("@")[0]),
                created_at=datetime.fromisoformat(user.created_at.replace("Z", "+00:00")) if isinstance(user.created_at, str) else user.created_at,
                email_verified=user.email_confirmed_at is not None,
            )
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error logging in: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email ou senha incorretos"
        )


@router.get("/me", response_model=UserResponse)
async def get_current_user_info(current_user: dict = Depends(get_current_user)):
    return UserResponse(**current_user)


@router.post("/logout")
async def logout(authorization: Optional[str] = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
        )
    
    token = authorization.split(" ")[1]
    supabase = get_supabase()
    
    try:
        supabase.auth.sign_out(token)
        return {"message": "Logged out successfully"}
    except Exception as e:
        logger.error(f"Error logging out: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erro ao fazer logout"
        )


@router.post("/refresh")
async def refresh_token(authorization: Optional[str] = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
        )
    
    token = authorization.split(" ")[1]
    supabase = get_supabase()
    
    try:
        # Supabase doesn't have a direct refresh with access token
        # Client should use refresh_token from initial login
        # This endpoint is kept for compatibility
        auth_response = supabase.auth.get_user(token)
        if not auth_response.user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token",
            )
        
        return {"message": "Token still valid", "user": auth_response.user}
    except Exception as e:
        logger.error(f"Error refreshing token: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token"
        )