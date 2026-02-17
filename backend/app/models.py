# backend/app/models.py
from pydantic import BaseModel, EmailStr, field_validator, ConfigDict
from typing import Optional, List, Dict, Any
from datetime import datetime

class UserBase(BaseModel):
    email: EmailStr

class UserCreate(UserBase):
    password: str
    
    @field_validator('password')
    @classmethod
    def password_strength(cls, v):
        if len(v) < 8:
            raise ValueError('Password debe tener al menos 8 caracteres')
        return v

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class User(UserBase):
    id: str
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

class UserResponse(BaseModel):
    user: User
    access_token: str
    token_type: str = "bearer"

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None

class EncryptedMetadata(BaseModel):
    ciphertext: str
    salt: str
    iv: str
    algorithm: str = "AES-GCM"

class MetadataCreate(BaseModel):
    file_id: str
    encrypted_data: EncryptedMetadata
    
    @field_validator('file_id')
    @classmethod
    def file_id_valid(cls, v):
        if len(v) < 8:
            raise ValueError('file_id debe tener al menos 8 caracteres')
        return v

class MetadataResponse(BaseModel):
    id: str
    user_id: str
    file_id: str
    encrypted_data: Dict[str, Any]
    created_at: datetime
    updated_at: datetime

class MetadataList(BaseModel):
    items: List[MetadataResponse]
    total: int

class MessageResponse(BaseModel):
    message: str
    detail: Optional[str] = None

class HealthResponse(BaseModel):
    status: str
    database: str
    timestamp: datetime