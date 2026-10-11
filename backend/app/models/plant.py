from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from backend.app.database import Base

class Plant(Base):
    __tablename__ = "plants"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    common_name = Column(String(150), nullable=False, index=True)
    scientific_name = Column(String(200), nullable=True)
    category = Column(String(100), default="Foliage")  # Foliage, Succulent, Herb, Vegetable, Flower, Fern, Tree, Fruit
    image_url = Column(String(500), nullable=True)
    location_type = Column(String(50), default="indoor")  # indoor, outdoor, balcony, greenhouse
    planting_date = Column(DateTime, nullable=True)
    sunlight_requirement = Column(String(100), default="Moderate indirect light")  # Full sun, Partial shade, Bright indirect, Low light
    watering_frequency_days = Column(Integer, default=7)
    soil_type = Column(String(150), nullable=True)  # Well-draining potting mix, Cactus mix, Loamy, etc.
    care_notes = Column(Text, nullable=True)
    status = Column(String(50), default="healthy")  # healthy, needs_attention, recovering
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="plants")
    schedules = relationship("CareSchedule", back_populates="plant", cascade="all, delete-orphan")
    tasks = relationship("CareTask", back_populates="plant", cascade="all, delete-orphan")
    assessments = relationship("HealthAssessment", back_populates="plant")

class CareSchedule(Base):
    __tablename__ = "care_schedules"

    id = Column(Integer, primary_key=True, index=True)
    plant_id = Column(Integer, ForeignKey("plants.id", ondelete="CASCADE"), nullable=False, index=True)
    task_type = Column(String(50), nullable=False)  # watering, fertilizing, pruning, repotting, misting, observation
    frequency_days = Column(Integer, default=7)
    last_completed_at = Column(DateTime, nullable=True)
    next_due_date = Column(DateTime, nullable=False)
    instructions = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    plant = relationship("Plant", back_populates="schedules")
