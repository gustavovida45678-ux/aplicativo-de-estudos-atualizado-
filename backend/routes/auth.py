from fastapi import APIRouter, HTTPException, status, Depends
from motor.motor_asyncio import AsyncIOMotorClient
import os
import secrets
from models.user import (
    User, UserCreate, UserLogin, UserResponse, Token,
    RegisterResponse, VerifyEmailRequest, ResendVerificationRequest
)
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
mongo_url = os.environ.get('MONGO_URL') or os.environ.get('MONGODB_URI')
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ.get('DB_NAME', 'study_app')]

# Email verification config
EMAIL_MODE = os.environ.get('EMAIL_VERIFICATION_MODE', 'mock').lower()
FRONTEND_URL = os.environ.get('FRONTEND_URL', 'http://localhost:3000').rstrip('/')


def build_verification_link(token: str) -> str:
    return f"{FRONTEND_URL}/?verify={token}"


async def send_verification_email(email: str, name: str, link: str):
    """Send verification email. In mock mode just logs it."""
    if EMAIL_MODE == 'mock':
        logger.info("=" * 70)
        logger.info("📧 [MOCK EMAIL] Verification email")
        logger.info(f"   To:      {email}")
        logger.info(f"   Name:    {name}")
        logger.info(f"   Link:    {link}")
        logger.info("=" * 70)
        return True
    # Future: integrate Resend / SMTP here
    return False


@router.post("/register", response_model=RegisterResponse, status_code=status.HTTP_201_CREATED)
async def register(user_data: UserCreate):
    """Register a new user. Sends a verification link (mock mode = returned in response)."""
    try:
        existing_user = await db.users.find_one({"email": user_data.email})
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email já cadastrado"
            )

        # Create verification token
        verification_token = secrets.token_urlsafe(32)

        # Create new user (not verified yet)
        hashed_password = get_password_hash(user_data.password)
        new_user = User(
            email=user_data.email,
            name=user_data.name,
            hashed_password=hashed_password,
            email_verified=False,
            verification_token=verification_token,
        )

        user_dict = new_user.model_dump()
        user_dict['created_at'] = user_dict['created_at'].isoformat()
        await db.users.insert_one(user_dict)

        # Build verification link
        link = build_verification_link(verification_token)
        await send_verification_email(user_data.email, user_data.name, link)

        logger.info(f"New user registered (pending verification): {user_data.email}")

        return RegisterResponse(
            user=UserResponse(**new_user.model_dump()),
            verification_required=True,
            verification_link=link if EMAIL_MODE == 'mock' else None,
            message="Cadastro realizado. Confirme seu email para ativar a conta."
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error registering user: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erro ao registrar usuário"
        )


@router.post("/verify-email")
async def verify_email(payload: VerifyEmailRequest):
    """Verify user email using token."""
    try:
        if not payload.token:
            raise HTTPException(400, "Token inválido")

        user = await db.users.find_one({"verification_token": payload.token})
        if not user:
            raise HTTPException(400, "Token inválido ou já utilizado")

        if user.get("email_verified"):
            return {"success": True, "message": "Email já confirmado", "email": user["email"]}

        await db.users.update_one(
            {"_id": user["_id"]},
            {"$set": {"email_verified": True, "verification_token": None}}
        )

        logger.info(f"Email verified: {user['email']}")
        return {"success": True, "message": "Email confirmado com sucesso", "email": user["email"]}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error verifying email: {e}")
        raise HTTPException(500, "Erro ao confirmar email")


@router.post("/resend-verification")
async def resend_verification(payload: ResendVerificationRequest):
    """Resend verification email."""
    try:
        user = await db.users.find_one({"email": payload.email})
        if not user:
            # Don't reveal user existence; return generic success
            return {"success": True, "message": "Se o email existir, um novo link foi enviado"}

        if user.get("email_verified"):
            return {"success": True, "message": "Email já confirmado", "already_verified": True}

        new_token = secrets.token_urlsafe(32)
        await db.users.update_one(
            {"_id": user["_id"]},
            {"$set": {"verification_token": new_token}}
        )

        link = build_verification_link(new_token)
        await send_verification_email(payload.email, user.get("name", ""), link)

        return {
            "success": True,
            "message": "Link de confirmação reenviado",
            "verification_link": link if EMAIL_MODE == 'mock' else None,
        }
    except Exception as e:
        logger.error(f"Error resending verification: {e}")
        raise HTTPException(500, "Erro ao reenviar confirmação")


@router.post("/login", response_model=Token)
async def login(credentials: UserLogin):
    """Login user and return JWT token (only if email verified)."""
    try:
        user = await db.users.find_one({"email": credentials.email}, {"_id": 0})

        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Email ou senha incorretos"
            )

        if not verify_password(credentials.password, user["hashed_password"]):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Email ou senha incorretos"
            )

        if not user.get("is_active", True):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Usuário inativo"
            )

        # Block login if email not verified
        if not user.get("email_verified", False):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="EMAIL_NOT_VERIFIED"
            )

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
    if isinstance(current_user.get('created_at'), str):
        from datetime import datetime
        current_user['created_at'] = datetime.fromisoformat(current_user['created_at'])

    return UserResponse(**current_user)


@router.get("/users", response_model=list[UserResponse])
async def get_all_users(current_user: dict = Depends(get_current_active_user)):
    """Get all users (admin dashboard)"""
    try:
        users = await db.users.find({}, {"_id": 0, "hashed_password": 0, "verification_token": 0}).to_list(1000)

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
