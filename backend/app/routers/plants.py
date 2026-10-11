from datetime import datetime, timedelta, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session

from backend.app.database import get_db
from backend.app.models.user import User
from backend.app.models.plant import Plant, CareSchedule
from backend.app.models.task import CareTask
from backend.app.schemas.plant import PlantCreate, PlantUpdate, PlantOut
from backend.app.utils.security import get_current_user
from backend.app.utils.file_storage import save_upload_file

router = APIRouter(prefix="/api/plants", tags=["Plants"])

def get_utc_now():
    return datetime.now(timezone.utc).replace(tzinfo=None)

def calculate_days_until_water(plant: Plant) -> Optional[int]:
    now_date = get_utc_now().date()
    for sched in plant.schedules:
        if sched.task_type == "watering":
            delta = (sched.next_due_date.date() - now_date).days
            return delta
    return plant.watering_frequency_days

@router.get("", response_model=List[PlantOut])
def get_user_plants(
    category: Optional[str] = None,
    location: Optional[str] = None,
    status_filter: Optional[str] = None,
    search: Optional[str] = None,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(Plant).filter(Plant.user_id == user.id)

    if category and category != "all":
        query = query.filter(Plant.category.ilike(f"%{category}%"))
    if location and location != "all":
        query = query.filter(Plant.location_type.ilike(f"%{location}%"))
    if status_filter and status_filter != "all":
        query = query.filter(Plant.status == status_filter)
    if search:
        query = query.filter(
            (Plant.common_name.ilike(f"%{search}%")) |
            (Plant.scientific_name.ilike(f"%{search}%"))
        )

    plants = query.order_by(Plant.created_at.desc()).all()

    result = []
    for p in plants:
        p_out = PlantOut.model_validate(p)
        p_out.days_until_next_water = calculate_days_until_water(p)
        result.append(p_out)

    return result

@router.post("", response_model=PlantOut, status_code=status.HTTP_201_CREATED)
def create_plant(
    req: PlantCreate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    now = get_utc_now()
    plant = Plant(
        user_id=user.id,
        common_name=req.common_name,
        scientific_name=req.scientific_name,
        category=req.category,
        image_url=req.image_url,
        location_type=req.location_type,
        planting_date=req.planting_date or now,
        sunlight_requirement=req.sunlight_requirement,
        watering_frequency_days=req.watering_frequency_days,
        soil_type=req.soil_type,
        care_notes=req.care_notes,
        status=req.status
    )
    db.add(plant)
    db.flush()

    # 1. Watering
    water_due = now + timedelta(days=req.watering_frequency_days)
    water_schedule = CareSchedule(
        plant_id=plant.id,
        task_type="watering",
        frequency_days=req.watering_frequency_days,
        next_due_date=water_due,
        instructions=f"Water until soil is moist, adjusting for drainage."
    )
    db.add(water_schedule)

    # 2. Observation / Health Check (weekly)
    obs_due = now + timedelta(days=7)
    obs_schedule = CareSchedule(
        plant_id=plant.id,
        task_type="observation",
        frequency_days=7,
        next_due_date=obs_due,
        instructions="Inspect leaf underside, new leaf growth, and moisture."
    )
    db.add(obs_schedule)

    # Create initial care task for watering
    initial_task = CareTask(
        user_id=user.id,
        plant_id=plant.id,
        task_type="watering",
        title=f"Water {plant.common_name}",
        description=f"Standard scheduled watering ({req.watering_frequency_days} day cycle).",
        due_date=water_due,
        is_completed=False
    )
    db.add(initial_task)

    db.commit()
    db.refresh(plant)

    res = PlantOut.model_validate(plant)
    res.days_until_next_water = req.watering_frequency_days
    return res

@router.get("/{plant_id}", response_model=PlantOut)
def get_plant_detail(
    plant_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    plant = db.query(Plant).filter(Plant.id == plant_id, Plant.user_id == user.id).first()
    if not plant:
        raise HTTPException(status_code=404, detail="Plant not found")
    
    res = PlantOut.model_validate(plant)
    res.days_until_next_water = calculate_days_until_water(plant)
    return res

@router.put("/{plant_id}", response_model=PlantOut)
def update_plant(
    plant_id: int,
    req: PlantUpdate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    plant = db.query(Plant).filter(Plant.id == plant_id, Plant.user_id == user.id).first()
    if not plant:
        raise HTTPException(status_code=404, detail="Plant not found")

    for field, val in req.model_dump(exclude_unset=True).items():
        setattr(plant, field, val)

    if req.watering_frequency_days is not None:
        now = get_utc_now()
        for sched in plant.schedules:
            if sched.task_type == "watering":
                sched.frequency_days = req.watering_frequency_days
                sched.next_due_date = now + timedelta(days=req.watering_frequency_days)

    db.commit()
    db.refresh(plant)
    res = PlantOut.model_validate(plant)
    res.days_until_next_water = calculate_days_until_water(plant)
    return res

@router.delete("/{plant_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_plant(
    plant_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    plant = db.query(Plant).filter(Plant.id == plant_id, Plant.user_id == user.id).first()
    if not plant:
        raise HTTPException(status_code=404, detail="Plant not found")

    db.delete(plant)
    db.commit()
    return None

@router.post("/{plant_id}/upload-image")
def upload_plant_image(
    plant_id: int,
    file: UploadFile = File(...),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    plant = db.query(Plant).filter(Plant.id == plant_id, Plant.user_id == user.id).first()
    if not plant:
        raise HTTPException(status_code=404, detail="Plant not found")

    file_path = save_upload_file(file, subfolder="plants")
    plant.image_url = file_path
    db.commit()
    return {"message": "Image uploaded successfully", "image_url": file_path}
