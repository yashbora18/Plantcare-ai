
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from backend.app.config import settings
from backend.app.database import engine, Base, SessionLocal
from backend.app.utils.seed_missions import seed_missions_if_empty

from backend.app.routers import (
    auth,
    plants,
    tasks,
    doctor,
    assistant,
    garden_planner,
    challenge,
    analytics,
    system,
)


# ============================================================
# Application initialization
# ============================================================

upload_path = Path(settings.UPLOAD_DIR).resolve()
upload_path.mkdir(parents=True, exist_ok=True)

# Create database tables.
Base.metadata.create_all(bind=engine)

# Seed default outdoor missions.
with SessionLocal() as db:
    seed_missions_if_empty(db)


app = FastAPI(
    title=settings.PROJECT_NAME,
    description=(
        "PlantCare AI — Open-Source AI Gardening Companion. "
        "Tagline: 'Less Scrolling. More Growing.' "
        "Built for Hacktoberfest 2026 Week 1."
    ),
    version="1.0.0",
)



# ============================================================
# CORS configuration
# ============================================================

allowed_origins = set(settings.cors_origin_list or [])

allowed_origins.update(
    {
        "https://plantcare-ai-six.vercel.app",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5174",
    }
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=sorted(allowed_origins),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)



# ============================================================
# Static uploads
# ============================================================

app.mount(
    "/uploads",
    StaticFiles(directory=str(upload_path)),
    name="uploads",
)


# ============================================================
# API routers
# ============================================================

app.include_router(auth.router)
app.include_router(plants.router)
app.include_router(tasks.router)
app.include_router(doctor.router)
app.include_router(assistant.router)
app.include_router(garden_planner.router)
app.include_router(challenge.router)
app.include_router(analytics.router)
app.include_router(system.router)


# ============================================================
# Root endpoint
# ============================================================

@app.get("/")
def root_endpoint():
    return {
        "app": settings.PROJECT_NAME,
        "tagline": "Less Scrolling. More Growing.",
        "version": "1.0.0",
        "challenge": "Hacktoberfest 2026 Week 1: Touch Grass",
        "documentation": "/docs",
        "status": "operational",
    }
