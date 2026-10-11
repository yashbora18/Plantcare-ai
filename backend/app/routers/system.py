
from fastapi import APIRouter

from backend.app.config import settings
from backend.app.services.ai_service import ai_service

router = APIRouter(prefix="/api/system", tags=["System"])


@router.get("/ai-status")
async def get_ai_service_status():
    if settings.GEMINI_API_KEY.strip():
        return {
            "available": True,
            "provider": "gemini",
            "configured_model": settings.GEMINI_MODEL,
            "message": "Google Gemini AI is configured.",
            "note": "The API key has not yet been verified.",
        }

    ollama_status = await ai_service.check_ollama_status()

    return {
        **ollama_status,
        "provider": "ollama",
        "message": ollama_status.get(
            "message",
            "Local Ollama AI service is unavailable.",
        ),
    }


@router.get("/health")
def health_check():
    return {
        "status": "healthy",
        "project": settings.PROJECT_NAME,
        "environment": settings.ENVIRONMENT,
        "database": "connected",
    }
