from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, Boolean, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from backend.app.database import Base

class HealthAssessment(Base):
    __tablename__ = "health_assessments"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    plant_id = Column(Integer, ForeignKey("plants.id", ondelete="SET NULL"), nullable=True, index=True)
    image_path = Column(String(500), nullable=True)
    symptoms_input = Column(Text, nullable=True)
    
    # AI Diagnosis Fields
    primary_issue = Column(String(200), nullable=False)
    severity = Column(String(50), default="moderate")  # healthy, mild, moderate, severe, critical
    confidence_score = Column(Float, default=0.85)
    possible_causes = Column(Text, nullable=True)  # JSON-encoded list of causes
    visible_symptoms = Column(Text, nullable=True)  # JSON-encoded list
    recommended_steps = Column(Text, nullable=True)  # JSON-encoded list
    care_adjustments = Column(Text, nullable=True)  # JSON-encoded dict: watering, sunlight, soil, pest
    preventive_measures = Column(Text, nullable=True)  # JSON-encoded list
    expert_consultation_needed = Column(Boolean, default=False)
    raw_ai_response = Column(Text, nullable=True)
    model_used = Column(String(100), nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow, index=True)

    # Relationships
    user = relationship("User", back_populates="assessments")
    plant = relationship("Plant", back_populates="assessments")
