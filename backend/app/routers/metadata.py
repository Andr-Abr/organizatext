# backend/app/routers/metadata.py
# Rutas para gestión de metadata cifrada
from pydantic import BaseModel
from fastapi import APIRouter, HTTPException, status, Depends
from typing import List
from app.models import MetadataCreate, MetadataResponse, MetadataList, User
from app.auth import get_current_user
from app.database import get_database
from datetime import datetime
from bson import ObjectId

router = APIRouter(prefix="/metadata", tags=["Metadata"])


@router.post("/", response_model=MetadataResponse, status_code=status.HTTP_201_CREATED)
async def create_metadata(
    metadata: MetadataCreate,
    current_user: User = Depends(get_current_user)
):
    """
    Guarda metadata cifrada de un archivo
    
    La metadata viene cifrada desde el cliente (AES-GCM)
    """
    db = get_database()
    
    # Crear documento
    doc = {
        "user_id": current_user.id,
        "file_id": metadata.file_id,
        "encrypted_data": metadata.encrypted_data.dict(),
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
    }
    
    # Insertar en DB
    result = db.user_metadata.insert_one(doc)
    doc["_id"] = result.inserted_id
    
    return MetadataResponse(
        id=str(doc["_id"]),
        user_id=doc["user_id"],
        file_id=doc["file_id"],
        encrypted_data=doc["encrypted_data"],
        created_at=doc["created_at"],
        updated_at=doc["updated_at"]
    )


@router.get("/", response_model=MetadataList)
async def get_all_metadata(current_user: User = Depends(get_current_user)):
    """
    Obtiene toda la metadata del usuario actual
    """
    db = get_database()
    
    # Buscar metadata del usuario
    cursor = db.user_metadata.find({"user_id": current_user.id}).sort("created_at", -1)
    
    items = []
    for doc in cursor:
        items.append(MetadataResponse(
            id=str(doc["_id"]),
            user_id=doc["user_id"],
            file_id=doc["file_id"],
            encrypted_data=doc["encrypted_data"],
            created_at=doc["created_at"],
            updated_at=doc["updated_at"]
        ))
    
    return MetadataList(items=items, total=len(items))


@router.get("/{file_id}", response_model=MetadataResponse)
async def get_metadata_by_file_id(
    file_id: str,
    current_user: User = Depends(get_current_user)
):
    """
    Obtiene metadata de un archivo específico
    """
    db = get_database()
    
    doc = db.user_metadata.find_one({
        "user_id": current_user.id,
        "file_id": file_id
    })
    
    if not doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Metadata no encontrada"
        )
    
    return MetadataResponse(
        id=str(doc["_id"]),
        user_id=doc["user_id"],
        file_id=doc["file_id"],
        encrypted_data=doc["encrypted_data"],
        created_at=doc["created_at"],
        updated_at=doc["updated_at"]
    )


@router.delete("/{file_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_metadata(
    file_id: str,
    current_user: User = Depends(get_current_user)
):
    """
    Elimina metadata de un archivo
    """
    db = get_database()
    
    result = db.user_metadata.delete_one({
        "user_id": current_user.id,
        "file_id": file_id
    })
    
    if result.deleted_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Metadata no encontrada"
        )
    
    return None

@router.delete("/all/", status_code=status.HTTP_200_OK)
async def delete_all_metadata(current_user: User = Depends(get_current_user)):
    """Elimina TODA la metadata del usuario en MongoDB"""
    db = get_database()
    result = db.user_metadata.delete_many({"user_id": current_user.id})
    return {"deleted": result.deleted_count, "message": f"{result.deleted_count} registros eliminados"}


class FileIdList(BaseModel):
    file_ids: list


@router.post("/delete-selected/", status_code=status.HTTP_200_OK)
async def delete_selected_metadata(
    body: FileIdList,
    current_user: User = Depends(get_current_user)
):
    """Elimina metadata seleccionada por lista de file_ids"""
    db = get_database()
    result = db.user_metadata.delete_many({
        "user_id": current_user.id,
        "file_id": {"$in": body.file_ids}
    })
    return {"deleted": result.deleted_count}