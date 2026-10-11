import json
from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from backend.app.database import get_db
from backend.app.models.user import User
from backend.app.models.garden_plan import GardenPlan
from backend.app.schemas.garden_plan import (
    GardenPlanRequest,
    GardenPlanGenerated,
    GardenPlanOut
)
from backend.app.services.ai_service import ai_service
from backend.app.utils.security import get_current_user

router = APIRouter(prefix="/api/planner", tags=["Smart Garden Planner"])

def enrich_plan_out(plan: GardenPlan) -> GardenPlanOut:
    def safe_json(val, default):
        if not val:
            return default
        try:
            return json.loads(val)
        except Exception:
            return default

    return GardenPlanOut(
        id=plan.id,
        user_id=plan.user_id,
        title=plan.title,
        location_zone=plan.location_zone,
        space_type=plan.space_type,
        sunlight_level=plan.sunlight_level,
        soil_type=plan.soil_type,
        budget_level=plan.budget_level,
        preferences=plan.preferences,
        summary=plan.summary,
        recommended_plants=safe_json(plan.recommended_plants, []),
        preparation_steps=safe_json(plan.preparation_steps, []),
        planting_windows=safe_json(plan.planting_windows, {}),
        maintenance_schedule=safe_json(plan.maintenance_schedule, []),
        created_at=plan.created_at,
        updated_at=plan.updated_at
    )

@router.post("/generate", response_model=GardenPlanGenerated)
async def generate_garden_plan_ai(
    req: GardenPlanRequest,
    user: User = Depends(get_current_user)
):
    plan = await ai_service.generate_garden_plan(req.model_dump())
    return plan

@router.post("/save", response_model=GardenPlanOut, status_code=status.HTTP_201_CREATED)
def save_garden_plan(
    plan_data: Dict[str, Any],
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    plan = GardenPlan(
        user_id=user.id,
        title=plan_data.get("title", "My Garden Plan"),
        location_zone=plan_data.get("location_zone"),
        space_type=plan_data.get("space_type", "balcony"),
        sunlight_level=plan_data.get("sunlight_level", "Full Sun"),
        soil_type=plan_data.get("soil_type", "Potting Mix"),
        budget_level=plan_data.get("budget_level", "moderate"),
        preferences=plan_data.get("preferences"),
        summary=plan_data.get("summary"),
        recommended_plants=json.dumps(plan_data.get("recommended_plants", [])),
        preparation_steps=json.dumps(plan_data.get("preparation_steps", [])),
        planting_windows=json.dumps(plan_data.get("planting_windows", {})),
        maintenance_schedule=json.dumps(plan_data.get("maintenance_schedule", []))
    )
    db.add(plan)
    db.commit()
    db.refresh(plan)
    return enrich_plan_out(plan)

@router.get("/plans", response_model=List[GardenPlanOut])
def get_user_plans(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    plans = db.query(GardenPlan).filter(GardenPlan.user_id == user.id).order_by(GardenPlan.created_at.desc()).all()
    return [enrich_plan_out(p) for p in plans]

@router.get("/plans/{plan_id}", response_model=GardenPlanOut)
def get_single_plan(
    plan_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    plan = db.query(GardenPlan).filter(GardenPlan.id == plan_id, GardenPlan.user_id == user.id).first()
    if not plan:
        raise HTTPException(status_code=404, detail="Garden plan not found")
    return enrich_plan_out(plan)

@router.delete("/plans/{plan_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_garden_plan(
    plan_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    plan = db.query(GardenPlan).filter(GardenPlan.id == plan_id, GardenPlan.user_id == user.id).first()
    if not plan:
        raise HTTPException(status_code=404, detail="Garden plan not found")
    db.delete(plan)
    db.commit()
    return None
