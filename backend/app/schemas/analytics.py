from typing import List, Dict, Any, Optional
from pydantic import BaseModel

class DashboardStatsOut(BaseModel):
    total_plants: int
    plants_needing_attention: int
    tasks_due_today: int
    upcoming_tasks_count: int
    completed_tasks_recently: int
    weekly_outdoor_minutes: int
    weekly_outdoor_target: int
    outdoor_progress_pct: float
    current_streak: int
    health_issues_count: int
    ai_status: Dict[str, Any]

class CategoryCount(BaseModel):
    category: str
    count: int

class ActivityDay(BaseModel):
    date: str
    minutes: int
    tasks_done: int

class AnalyticsOverviewOut(BaseModel):
    total_plants: int
    category_breakdown: List[CategoryCount]
    total_tasks_completed: int
    total_tasks_pending: int
    tasks_completion_rate: float
    total_outdoor_minutes: int
    weekly_outdoor_minutes: int
    outdoor_goal_minutes: int
    streak_days: int
    completed_missions_count: int
    total_missions_count: int
    total_assessments: int
    total_garden_plans: int
    seven_day_activity: List[ActivityDay]
