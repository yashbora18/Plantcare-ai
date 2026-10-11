import json
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.orm import Session

from backend.app.database import get_db
from backend.app.models.user import User
from backend.app.models.plant import Plant
from backend.app.models.assessment import HealthAssessment
from backend.app.schemas.assessment import (
    PlantHealthAnalysisResponse,
    HealthAssessmentCreate,
    HealthAssessmentOut
)
from backend.app.services.ai_service import ai_service
from backend.app.utils.security import get_current_user
from backend.app.utils.file_storage import save_upload_file

router = APIRouter(prefix="/api/doctor", tags=["AI Plant Doctor"])

def enrich_assessment_out(a: HealthAssessment) -> HealthAssessmentOut:
    def safe_json(val, default):
        if not val:
            return default
        try:
            return json.loads(val)
        except Exception:
            return default

    return HealthAssessmentOut(
        id=a.id,
        user_id=a.user_id,
        plant_id=a.plant_id,
        plant_name=a.plant.common_name if a.plant else None,
        image_path=a.image_path,
        symptoms_input=a.symptoms_input,
        primary_issue=a.primary_issue,
        severity=a.severity,
        confidence_score=a.confidence_score,
        possible_causes=safe_json(a.possible_causes, []),
        visible_symptoms=safe_json(a.visible_symptoms, []),
        recommended_steps=safe_json(a.recommended_steps, []),
        care_adjustments=safe_json(a.care_adjustments, {}),
        preventive_measures=safe_json(a.preventive_measures, []),
        expert_consultation_needed=a.expert_consultation_needed,
        model_used=a.model_used,
        created_at=a.created_at
    )

@router.post("/diagnose", response_model=PlantHealthAnalysisResponse)
async def diagnose_plant_health(
    file: Optional[UploadFile] = File(None),
    symptoms: Optional[str] = Form(None),
    plant_id: Optional[int] = Form(None),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    plant_context = None
    if plant_id:
        plant = db.query(Plant).filter(Plant.id == plant_id, Plant.user_id == user.id).first()
        if plant:
            plant_context = {
                "common_name": plant.common_name,
                "category": plant.category,
                "location_type": plant.location_type,
                "watering_frequency_days": plant.watering_frequency_days,
                "sunlight_requirement": plant.sunlight_requirement
            }

    image_bytes = None
    if file and file.filename:
        image_bytes = await file.read()

    # Call AI Service layer
    diagnosis = await ai_service.analyze_plant_health(
        image_bytes=image_bytes,
        symptoms=symptoms,
        plant_context=plant_context
    )

    return diagnosis

@router.post("/save-assessment", response_model=HealthAssessmentOut, status_code=status.HTTP_201_CREATED)
def save_assessment_record(
    req: HealthAssessmentCreate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    plant = None
    if req.plant_id:
        plant = db.query(Plant).filter(Plant.id == req.plant_id, Plant.user_id == user.id).first()
        if plant and req.analysis.severity in ["moderate", "severe", "critical"]:
            plant.status = "needs_attention"

    assessment = HealthAssessment(
        user_id=user.id,
        plant_id=req.plant_id,
        image_path=req.image_url,
        symptoms_input=req.symptoms_input,
        primary_issue=req.analysis.primary_issue,
        severity=req.analysis.severity,
        confidence_score=req.analysis.confidence_score,
        possible_causes=json.dumps(req.analysis.possible_causes),
        visible_symptoms=json.dumps(req.analysis.visible_symptoms),
        recommended_steps=json.dumps(req.analysis.recommended_steps),
        care_adjustments=json.dumps(req.analysis.care_adjustments.model_dump()),
        preventive_measures=json.dumps(req.analysis.preventive_measures),
        expert_consultation_needed=req.analysis.expert_consultation_needed,
        model_used=ai_service.vision_model if req.analysis.is_vision_model else ai_service.model
    )
    db.add(assessment)
    db.commit()
    db.refresh(assessment)

    return enrich_assessment_out(assessment)

@router.post("/upload-leaf-photo")
def upload_leaf_photo(
    file: UploadFile = File(...),
    user: User = Depends(get_current_user)
):
    path = save_upload_file(file, subfolder="leaves")
    return {"image_url": path}

@router.get("/history", response_model=List[HealthAssessmentOut])
def get_assessment_history(
    plant_id: Optional[int] = None,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(HealthAssessment).filter(HealthAssessment.user_id == user.id)
    if plant_id:
        query = query.filter(HealthAssessment.plant_id == plant_id)
    
    records = query.order_by(HealthAssessment.created_at.desc()).all()
    return [enrich_assessment_out(r) for r in records]

@router.get("/history/{assessment_id}", response_model=HealthAssessmentOut)
def get_assessment_detail(
    assessment_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    record = db.query(HealthAssessment).filter(
        HealthAssessment.id == assessment_id,
        HealthAssessment.user_id == user.id
    ).first()
    if not record:
        raise HTTPException(status_code=404, detail="Health assessment not found")
    return enrich_assessment_out(record)
