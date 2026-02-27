# backend/app/main.py
# Aplicación principal FastAPI

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.database import connect_to_mongo, close_mongo_connection
from app.routers import auth, metadata
from app.models import HealthResponse
from datetime import datetime
import logging

# Configurar logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Crear aplicación FastAPI
app = FastAPI(
    title="Organizatext API",
    description="Backend para sincronización de metadata cifrada",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Configurar CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Eventos de inicio/cierre
@app.on_event("startup")
async def startup_event():
    """Conectar a MongoDB al iniciar"""
    connect_to_mongo()
    logger.info("✓ Aplicación iniciada correctamente")


@app.on_event("shutdown")
async def shutdown_event():
    """Cerrar conexión a MongoDB al terminar"""
    close_mongo_connection()
    logger.info("✓ Aplicación cerrada correctamente")


# Rutas
app.include_router(auth.router)
app.include_router(metadata.router)


# Health check
@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Verifica el estado del servidor y la base de datos"""
    from app.database import client
    
    try:
        # Ping a MongoDB
        client.admin.command('ping')
        db_status = "connected"
    except Exception as e:
        logger.error(f"MongoDB health check failed: {e}")
        db_status = "disconnected"
    
    return HealthResponse(
        status="ok",
        database=db_status,
        timestamp=datetime.utcnow()
    )


# Ruta raíz
@app.get("/")
async def root():
    """Mensaje de bienvenida"""
    return {
        "message": "Organizatext API",
        "version": "1.0.0",
        "docs": "/docs"
    }