from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from backend.app.database import Base

class OutdoorMission(Base):
    __tablename__ = "outdoor_missions"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=False)
    category = Column(String(50), default="soil_care")  # soil_care, biodiversity, planting, pest_inspection, community_maintenance, sun_observation, composting
    estimated_minutes = Column(Integer, default=15)
    instructions = Column(Text, nullable=False)
    sustainable_tip = Column(Text, nullable=True)
    week_number = Column(Integer, default=1)  # Hacktoberfest Week 1
    badge_name = Column(String(100), default="Grass Toucher")
    is_active = Column(Boolean, default=True)

    user_progress = relationship("UserMissionProgress", back_populates="mission", cascade="all, delete-orphan")

class UserMissionProgress(Base):
    __tablename__ = "user_mission_progress"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    mission_id = Column(Integer, ForeignKey("outdoor_missions.id", ondelete="CASCADE"), nullable=False, index=True)
    is_completed = Column(Boolean, default=False, index=True)
    completed_at = Column(DateTime, nullable=True)
    notes = Column(Text, nullable=True)  # User notes describing real observation
    evidence_photo_url = Column(String(500), nullable=True)  # Optional photo proof uploaded
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="mission_progress")
    mission = relationship("OutdoorMission", back_populates="user_progress")

class OutdoorActivityLog(Base):
    __tablename__ = "outdoor_activity_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    minutes_spent = Column(Integer, nullable=False)
    activity_type = Column(String(100), default="General Gardening")  # Soil check, Sowing, Pruning, Zen Time, Balcony Care
    notes = Column(Text, nullable=True)
    logged_at = Column(DateTime, default=datetime.utcnow, index=True)

    user = relationship("User", back_populates="activity_logs")
