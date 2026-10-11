from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field, ConfigDict

class CareTaskBase(BaseModel):
    plant_id: Optional[int] = None
    task_type: str = "watering"  # watering, fertilizing, pruning, repotting, misting, observation, custom
    title: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = None
    due_date: datetime
    notes: Optional[str] = None

class CareTaskCreate(CareTaskBase):
    pass

class CareTaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    due_date: Optional[datetime] = None
    notes: Optional[str] = None
    is_completed: Optional[bool] = None

class TaskCompletionRequest(BaseModel):
    notes: Optional[str] = None

class CareTaskOut(CareTaskBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    is_completed: bool
    completed_at: Optional[datetime] = None
    created_at: datetime
    plant_name: Optional[str] = None
    plant_image_url: Optional[str] = None
