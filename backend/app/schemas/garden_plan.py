from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field, ConfigDict

class RecommendedPlantItem(BaseModel):
    name: str = Field(..., description="Common plant name")
    scientific_name: Optional[str] = None
    category: str = "Herb"  # Herb, Vegetable, Flower, Succulent, Foliage
    difficulty: str = "Easy"  # Easy, Moderate, Advanced
    sunlight: str = "Full Sun"
    watering: str = "Every 3-5 days"
    spacing_inches: Optional[int] = 12
    companion_plants: List[str] = Field(default_factory=list)
    why_recommended: str = Field(..., description="Why this plant fits the user's constraints")

class GardenPlanRequest(BaseModel):
    title: Optional[str] = None
    location_zone: str = Field(..., description="Growing zone or city/climate e.g. Zone 7b, Mediterranean, Subtropical")
    space_type: str = Field(..., description="balcony, container, indoor, outdoor_garden, raised_bed, windowsill")
    sunlight_level: str = Field(..., description="Full Sun (6+ hrs), Partial Shade (3-6 hrs), Indirect Bright, Low Light")
    soil_type: str = Field(..., description="Potting Mix, Garden Loam, Sandy, Clay, Raised Bed Compost Blend")
    budget_level: str = Field(default="moderate", description="budget, moderate, premium")
    preferences: Optional[str] = Field(default="Culinary herbs and pollinator friendly blooms", description="Planting goals, edible, ornamental, etc.")

class GardenPlanGenerated(BaseModel):
    title: str
    summary: str
    recommended_plants: List[RecommendedPlantItem] = Field(default_factory=list)
    preparation_steps: List[str] = Field(default_factory=list)
    planting_windows: Dict[str, str] = Field(default_factory=dict)
    maintenance_schedule: List[str] = Field(default_factory=list)
    sustainable_tips: List[str] = Field(default_factory=list)

class GardenPlanOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    title: str
    location_zone: Optional[str] = None
    space_type: str
    sunlight_level: str
    soil_type: str
    budget_level: str
    preferences: Optional[str] = None
    summary: Optional[str] = None
    recommended_plants: List[Dict[str, Any]] = []
    preparation_steps: List[str] = []
    planting_windows: Dict[str, str] = {}
    maintenance_schedule: List[str] = []
    created_at: datetime
    updated_at: datetime
