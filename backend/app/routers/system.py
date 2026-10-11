from fastapi import APIRouter
from backend.app.services.ai_service import ai_service
from backend.app.config import settings

router = APIRouter(prefix="/api/system", tags=["System"])

@router.get("/ai-status")
async def get_ai_service_status():
    status_info = await ai_service.check_ollama_status()
    return status_info

@router.get("/health")
def health_check():
    return {
        "status": "healthy",
        "project": settings.PROJECT_NAME,
        "environment": settings.ENVIRONMENT,
        "database": "connected"
    }
