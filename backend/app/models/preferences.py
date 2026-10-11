from datetime import datetime
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from backend.app.database import Base

class UserPreference(Base):
    __tablename__ = "user_preferences"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    theme = Column(String(20), default="light")  # 'light' or 'dark'
    outdoor_goal_minutes = Column(Integer, default=120)  # Weekly target minutes
    gardening_zone = Column(String(50), nullable=True)  # e.g., "Zone 6b", "Tropical", etc.
    experience_level = Column(String(50), default="beginner")  # beginner, intermediate, advanced
    notifications_enabled = Column(Boolean, default=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", back_populates="preference")
