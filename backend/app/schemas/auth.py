from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr, Field, ConfigDict

class UserRegister(BaseModel):
    email: EmailStr
    username: str = Field(..., min_length=3, max_length=50)
    password: str = Field(..., min_length=6, max_length=100)
    full_name: Optional[str] = None

class UserLogin(BaseModel):
    username_or_email: str
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: int
    username: str
    email: str

class UserPreferenceOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    theme: str = "light"
    outdoor_goal_minutes: int = 120
    gardening_zone: Optional[str] = None
    experience_level: str = "beginner"
    notifications_enabled: bool = True

class UserPreferenceUpdate(BaseModel):
    theme: Optional[str] = None
    outdoor_goal_minutes: Optional[int] = None
    gardening_zone: Optional[str] = None
    experience_level: Optional[str] = None
    notifications_enabled: Optional[bool] = None

class UserProfile(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    email: str
    username: str
    full_name: Optional[str] = None
    is_active: bool
    created_at: datetime
    preference: Optional[UserPreferenceOut] = None
