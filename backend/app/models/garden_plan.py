from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from backend.app.database import Base

class GardenPlan(Base):
    __tablename__ = "garden_plans"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(200), nullable=False)
    location_zone = Column(String(100), nullable=True)
    space_type = Column(String(100), default="balcony")  # balcony, container, indoor, outdoor_garden, raised_bed, windowsill
    sunlight_level = Column(String(100), default="Full Sun (6+ hrs)")
    soil_type = Column(String(100), default="Potting Mix with Compost")
    budget_level = Column(String(50), default="moderate")  # budget, moderate, premium
    preferences = Column(Text, nullable=True)  # user preferences: herbs, flowers, low maintenance, organic vegetables
    
    # Generated Plan Content (JSON strings)
    summary = Column(Text, nullable=True)
    recommended_plants = Column(Text, nullable=True)  # JSON-encoded list of plant objects
    preparation_steps = Column(Text, nullable=True)  # JSON-encoded list of prep steps
    planting_windows = Column(Text, nullable=True)  # JSON-encoded dict of seasons/windows
    maintenance_schedule = Column(Text, nullable=True)  # JSON-encoded list of ongoing tasks
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="garden_plans")
