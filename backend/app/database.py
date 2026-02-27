# backend/app/database.py
# Conexión a MongoDB

from pymongo import MongoClient
from pymongo.database import Database
from app.config import settings
import logging

logger = logging.getLogger(__name__)

# Cliente MongoDB global
client: MongoClient = None
db: Database = None


def connect_to_mongo():
    """Conecta a MongoDB"""
    global client, db
    
    try:
        client = MongoClient(settings.MONGODB_URI)
        db = client[settings.MONGODB_DATABASE]
        
        # Verificar conexión
        client.admin.command('ping')
        logger.info(f"✓ Conectado a MongoDB: {settings.MONGODB_DATABASE}")
        
        # Crear índices
        db.users.create_index("email", unique=True)
        db.user_metadata.create_index([("user_id", 1), ("created_at", -1)])
        
        logger.info("✓ Índices creados correctamente")
        
    except Exception as e:
        logger.error(f"✗ Error conectando a MongoDB: {e}")
        raise


def close_mongo_connection():
    """Cierra la conexión a MongoDB"""
    global client
    if client:
        client.close()
        logger.info("✓ Conexión a MongoDB cerrada")


def get_database() -> Database:
    """Retorna la instancia de la base de datos"""
    return db