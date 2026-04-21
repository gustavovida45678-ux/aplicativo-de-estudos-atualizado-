from fastapi import APIRouter, HTTPException, status, Depends
from motor.motor_asyncio import AsyncIOMotorClient
import os
from models.user import User, UserCreate, UserLogin, UserResponse, Token
from utils.auth import (
    get_password_hash, 
    verify_password, 
    create_access_token,
    get_current_active_user
)
import logging

logger = logging.getLogger(__name__)
router = APIRouter()

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(user_data: UserCreate):
    """Register a new user"""
    try:
        # Check if user already exists
        existing_user = await db.users.find_one({"email": user_data.email})
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email já cadastrado"
            )
        
        # Create new user
        hashed_password = get_password_hash(user_data.password)
        new_user = User(
            email=user_data.email,
            name=user_data.name,
            hashed_password=hashed_password
        )
        
        # Save to database
        user_dict = new_user.model_dump()
        user_dict['created_at'] = user_dict['created_at'].isoformat()
        
        await db.users.insert_one(user_dict)
        
        logger.info(f"New user registered: {user_data.email}")
        
        # Return user response (without password)
        return UserResponse(**new_user.model_dump())
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error registering user: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erro ao registrar usuário"
        )


@router.post("/login", response_model=Token)
async def login(credentials: UserLogin):
    """Login user and return JWT token"""
    try:
        # Find user by email
        user = await db.users.find_one({"email": credentials.email}, {"_id": 0})
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Email ou senha incorretos"
            )
        
        # Verify password
        if not verify_password(credentials.password, user["hashed_password"]):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Email ou senha incorretos"
            )
        
        # Check if user is active
        if not user.get("is_active", True):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Usuário inativo"
            )
        
        # Create access token
        access_token = create_access_token(data={"sub": user["email"]})
        
        logger.info(f"User logged in: {credentials.email}")
        
        return Token(access_token=access_token, token_type="bearer")
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error logging in: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erro ao fazer login"
        )


@router.get("/me", response_model=UserResponse)
async def get_current_user_info(current_user: dict = Depends(get_current_active_user)):
    """Get current authenticated user information"""
    # Convert ISO string back to datetime if needed
    if isinstance(current_user.get('created_at'), str):
        from datetime import datetime
        current_user['created_at'] = datetime.fromisoformat(current_user['created_at'])
    
    return UserResponse(**current_user)


@router.get("/users", response_model=list[UserResponse])
async def get_all_users(current_user: dict = Depends(get_current_active_user)):
    """Get all users (admin dashboard)"""
    try:
        # Get all users from database
        users = await db.users.find({}, {"_id": 0, "hashed_password": 0}).to_list(1000)
        
        # Convert ISO strings to datetime
        from datetime import datetime
        for user in users:
            if isinstance(user.get('created_at'), str):
                user['created_at'] = datetime.fromisoformat(user['created_at'])
        
        return [UserResponse(**user) for user in users]
        
    except Exception as e:
        logger.error(f"Error fetching users: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erro ao buscar usuários"
        )
