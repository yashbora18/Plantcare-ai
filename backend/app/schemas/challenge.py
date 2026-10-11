from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field, ConfigDict

class OutdoorMissionOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    description: str
    category: str
    estimated_minutes: int
    instructions: str
    sustainable_tip: Optional[str] = None
    week_number: int
    badge_name: str
    is_active: bool
    is_completed: bool = False
    completed_at: Optional[datetime] = None
    user_notes: Optional[str] = None
    evidence_photo_url: Optional[str] = None

class MissionCompleteRequest(BaseModel):
    notes: Optional[str] = Field(None, description="Observations recorded during the outdoor mission")
    evidence_photo_url: Optional[str] = None

class OutdoorActivityLogCreate(BaseModel):
    minutes_spent: int = Field(..., ge=1, le=720, description="Minutes spent outside")
    activity_type: str = Field(default="Garden Care", description="Activity category")
    notes: Optional[str] = None

class OutdoorActivityLogOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    minutes_spent: int
    activity_type: str
    notes: Optional[str] = None
    logged_at: datetime

class ChallengeSummaryOut(BaseModel):
    total_missions: int
    completed_missions: int
    weekly_target_minutes: int
    weekly_logged_minutes: int
    weekly_progress_pct: float
    current_streak_days: int
    longest_streak_days: int
    hacktoberfest_week: int = 1
    recent_activities: List[OutdoorActivityLogOut] = []
