from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field, ConfigDict

class CareAdjustments(BaseModel):
    watering: Optional[str] = "Check soil moisture before watering"
    sunlight: Optional[str] = "Ensure adequate natural indirect light"
    soil: Optional[str] = "Inspect soil drainage and aeration"
    pest_management: Optional[str] = "Wipe leaves with neem oil or damp cloth if pests present"

class PlantHealthAnalysisResponse(BaseModel):
    primary_issue: str = Field(..., description="Short title of the diagnosed condition")
    severity: str = Field(default="moderate", description="mild, moderate, severe, critical, healthy")
    confidence_score: float = Field(default=0.85, ge=0.0, le=1.0)
    visible_symptoms: List[str] = Field(default_factory=list, description="List of visible symptoms observed")
    possible_causes: List[str] = Field(default_factory=list, description="Potential causes for the symptoms")
    recommended_steps: List[str] = Field(default_factory=list, description="Step-by-step immediate action plan")
    care_adjustments: CareAdjustments = Field(default_factory=CareAdjustments)
    preventive_measures: List[str] = Field(default_factory=list, description="Long term prevention practices")
    expert_consultation_needed: bool = Field(default=False)
    disclaimer: str = Field(
        default="AI plant assessments are estimates based on visual symptoms and should not replace professional horticultural diagnosis. Consult local extension agents for severe blights."
    )
    is_vision_model: bool = Field(default=False)

class HealthAssessmentCreate(BaseModel):
    plant_id: Optional[int] = None
    symptoms_input: Optional[str] = None
    image_url: Optional[str] = None
    analysis: PlantHealthAnalysisResponse

class HealthAssessmentOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    plant_id: Optional[int] = None
    plant_name: Optional[str] = None
    image_path: Optional[str] = None
    symptoms_input: Optional[str] = None
    primary_issue: str
    severity: str
    confidence_score: float
    possible_causes: List[str] = []
    visible_symptoms: List[str] = []
    recommended_steps: List[str] = []
    care_adjustments: Dict[str, Any] = {}
    preventive_measures: List[str] = []
    expert_consultation_needed: bool
    model_used: Optional[str] = None
    created_at: datetime
