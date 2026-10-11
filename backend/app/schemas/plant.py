from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field, ConfigDict

class CareScheduleBase(BaseModel):
    task_type: str  # watering, fertilizing, pruning, repotting, misting, observation
    frequency_days: int = Field(default=7, ge=1, le=365)
    instructions: Optional[str] = None

class CareScheduleCreate(CareScheduleBase):
    pass

class CareScheduleOut(CareScheduleBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    plant_id: int
    last_completed_at: Optional[datetime] = None
    next_due_date: datetime
    created_at: datetime

class PlantBase(BaseModel):
    common_name: str = Field(..., min_length=1, max_length=150)
    scientific_name: Optional[str] = None
    category: str = "Foliage"
    image_url: Optional[str] = None
    location_type: str = "indoor"
    planting_date: Optional[datetime] = None
    sunlight_requirement: str = "Moderate indirect light"
    watering_frequency_days: int = Field(default=7, ge=1, le=180)
    soil_type: Optional[str] = None
    care_notes: Optional[str] = None
    status: str = "healthy"

class PlantCreate(PlantBase):
    pass

class PlantUpdate(BaseModel):
    common_name: Optional[str] = None
    scientific_name: Optional[str] = None
    category: Optional[str] = None
    image_url: Optional[str] = None
    location_type: Optional[str] = None
    planting_date: Optional[datetime] = None
    sunlight_requirement: Optional[str] = None
    watering_frequency_days: Optional[int] = None
    soil_type: Optional[str] = None
    care_notes: Optional[str] = None
    status: Optional[str] = None

class PlantOut(PlantBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    created_at: datetime
    updated_at: datetime
    schedules: List[CareScheduleOut] = []
    days_until_next_water: Optional[int] = None
