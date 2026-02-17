# backend/app/routers/auth.py
# Rutas de autenticación (register, login)

from fastapi import APIRouter, HTTPException, status
from app.models import UserCreate, UserLogin, UserResponse, User
from app.auth import (
    get_password_hash,
    verify_password,
    create_access_token,
    get_user_by_email,
    create_user_in_db
)
from pymongo.errors import DuplicateKeyError

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(user_data: UserCreate):
    """
    Registra un nuevo usuario
    
    - **email**: Email válido (único)
    - **password**: Mínimo 8 caracteres
    """
    # Verificar si el usuario ya existe
    existing_user = get_user_by_email(user_data.email)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El email ya está registrado"
        )
    
    # Hash del password
    hashed_password = get_password_hash(user_data.password)
    
    # Crear usuario en DB
    try:
        user_doc = create_user_in_db(user_data.email, hashed_password)
    except DuplicateKeyError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El email ya está registrado"
        )
    
    # Crear token
    access_token = create_access_token(data={"sub": user_data.email})
    
    # Respuesta
    user = User(
        id=str(user_doc["_id"]),
        email=user_doc["email"],
        created_at=user_doc["created_at"]
    )
    
    return UserResponse(user=user, access_token=access_token)


@router.post("/login", response_model=UserResponse)
async def login(credentials: UserLogin):
    """
    Inicia sesión con email y password
    
    Retorna JWT token para autenticación
    """
    # Buscar usuario
    user_doc = get_user_by_email(credentials.email)
    
    if not user_doc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email o password incorrectos"
        )
    
    # Verificar password
    if not verify_password(credentials.password, user_doc["hashed_password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email o password incorrectos"
        )
    
    # Crear token
    access_token = create_access_token(data={"sub": credentials.email})
    
    # Respuesta
    user = User(
        id=str(user_doc["_id"]),
        email=user_doc["email"],
        created_at=user_doc["created_at"]
    )
    
    return UserResponse(user=user, access_token=access_token)