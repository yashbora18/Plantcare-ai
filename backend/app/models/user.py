from datetime import datetime
from sqlalchemy import Column, Integer, String, Boolean, DateTime
from sqlalchemy.orm import relationship
from backend.app.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    username = Column(String(100), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(150), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    preference = relationship("UserPreference", back_populates="user", uselist=False, cascade="all, delete-orphan")
    plants = relationship("Plant", back_populates="user", cascade="all, delete-orphan")
    tasks = relationship("CareTask", back_populates="user", cascade="all, delete-orphan")
    assessments = relationship("HealthAssessment", back_populates="user", cascade="all, delete-orphan")
    garden_plans = relationship("GardenPlan", back_populates="user", cascade="all, delete-orphan")
    mission_progress = relationship("UserMissionProgress", back_populates="user", cascade="all, delete-orphan")
    activity_logs = relationship("OutdoorActivityLog", back_populates="user", cascade="all, delete-orphan")
    chat_sessions = relationship("ChatSession", back_populates="user", cascade="all, delete-orphan")
