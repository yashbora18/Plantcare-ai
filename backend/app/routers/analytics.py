from datetime import datetime, timedelta, timezone
from typing import Dict, Any, List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

from backend.app.database import get_db
from backend.app.models.user import User
from backend.app.models.plant import Plant
from backend.app.models.task import CareTask
from backend.app.models.assessment import HealthAssessment
from backend.app.models.garden_plan import GardenPlan
from backend.app.models.challenge import OutdoorMission, UserMissionProgress, OutdoorActivityLog
from backend.app.schemas.analytics import (
    DashboardStatsOut,
    AnalyticsOverviewOut,
    CategoryCount,
    ActivityDay
)
from backend.app.services.ai_service import ai_service
from backend.app.routers.challenge import compute_user_streak
from backend.app.utils.security import get_current_user

router = APIRouter(prefix="/api/analytics", tags=["Analytics"])

def get_utc_now():
    return datetime.now(timezone.utc).replace(tzinfo=None)

@router.get("/dashboard", response_model=DashboardStatsOut)
async def get_dashboard_stats(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    now = get_utc_now()
    today_start = datetime(now.year, now.month, now.day)
    today_end = today_start + timedelta(days=1)
    seven_days_ago = now - timedelta(days=7)

    # Plants
    total_plants = db.query(Plant).filter(Plant.user_id == user.id).count()
    plants_needing_attention = db.query(Plant).filter(
        Plant.user_id == user.id,
        Plant.status.in_(["needs_attention", "recovering"])
    ).count()

    # Tasks
    tasks_due_today = db.query(CareTask).filter(
        CareTask.user_id == user.id,
        CareTask.is_completed == False,
        CareTask.due_date >= today_start,
        CareTask.due_date < today_end
    ).count()

    upcoming_tasks_count = db.query(CareTask).filter(
        CareTask.user_id == user.id,
        CareTask.is_completed == False,
        CareTask.due_date >= today_end
    ).count()

    completed_recently = db.query(CareTask).filter(
        CareTask.user_id == user.id,
        CareTask.is_completed == True,
        CareTask.completed_at >= seven_days_ago
    ).count()

    # Outdoor Activity
    weekly_outdoor_mins = db.query(func.sum(OutdoorActivityLog.minutes_spent)).filter(
        OutdoorActivityLog.user_id == user.id,
        OutdoorActivityLog.logged_at >= seven_days_ago
    ).scalar() or 0

    target = user.preference.outdoor_goal_minutes if user.preference else 120
    outdoor_pct = min(100.0, round((weekly_outdoor_mins / target) * 100, 1)) if target > 0 else 0.0

    current_streak, _ = compute_user_streak(user.id, db)

    # Health assessments count
    health_issues = db.query(HealthAssessment).filter(HealthAssessment.user_id == user.id).count()

    # Check Ollama AI status
    ai_status = await ai_service.check_ollama_status()

    return DashboardStatsOut(
        total_plants=total_plants,
        plants_needing_attention=plants_needing_attention,
        tasks_due_today=tasks_due_today,
        upcoming_tasks_count=upcoming_tasks_count,
        completed_tasks_recently=completed_recently,
        weekly_outdoor_minutes=weekly_outdoor_mins,
        weekly_outdoor_target=target,
        outdoor_progress_pct=outdoor_pct,
        current_streak=current_streak,
        health_issues_count=health_issues,
        ai_status=ai_status
    )

@router.get("/overview", response_model=AnalyticsOverviewOut)
def get_analytics_overview(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    now = get_utc_now()
    seven_days_ago = now - timedelta(days=7)

    # Plants
    total_plants = db.query(Plant).filter(Plant.user_id == user.id).count()
    cats = db.query(Plant.category, func.count(Plant.id)).filter(
        Plant.user_id == user.id
    ).group_by(Plant.category).all()
    category_breakdown = [CategoryCount(category=c[0], count=c[1]) for c in cats]

    # Tasks
    total_completed = db.query(CareTask).filter(CareTask.user_id == user.id, CareTask.is_completed == True).count()
    total_pending = db.query(CareTask).filter(CareTask.user_id == user.id, CareTask.is_completed == False).count()
    total_tasks = total_completed + total_pending
    completion_rate = round((total_completed / total_tasks * 100), 1) if total_tasks > 0 else 0.0

    # Outdoor
    total_outdoor = db.query(func.sum(OutdoorActivityLog.minutes_spent)).filter(
        OutdoorActivityLog.user_id == user.id
    ).scalar() or 0

    weekly_outdoor = db.query(func.sum(OutdoorActivityLog.minutes_spent)).filter(
        OutdoorActivityLog.user_id == user.id,
        OutdoorActivityLog.logged_at >= seven_days_ago
    ).scalar() or 0

    outdoor_goal = user.preference.outdoor_goal_minutes if user.preference else 120
    streak_days, _ = compute_user_streak(user.id, db)

    # Missions
    total_missions = db.query(OutdoorMission).filter(OutdoorMission.is_active == True).count()
    completed_missions = db.query(UserMissionProgress).filter(
        UserMissionProgress.user_id == user.id,
        UserMissionProgress.is_completed == True
    ).count()

    total_assessments = db.query(HealthAssessment).filter(HealthAssessment.user_id == user.id).count()
    total_plans = db.query(GardenPlan).filter(GardenPlan.user_id == user.id).count()

    # 7-day activity timeline
    seven_day_activity = []
    for i in range(6, -1, -1):
        day_date = (now - timedelta(days=i)).date()
        day_start = datetime(day_date.year, day_date.month, day_date.day)
        day_end = day_start + timedelta(days=1)

        day_mins = db.query(func.sum(OutdoorActivityLog.minutes_spent)).filter(
            OutdoorActivityLog.user_id == user.id,
            OutdoorActivityLog.logged_at >= day_start,
            OutdoorActivityLog.logged_at < day_end
        ).scalar() or 0

        day_tasks = db.query(CareTask).filter(
            CareTask.user_id == user.id,
            CareTask.is_completed == True,
            CareTask.completed_at >= day_start,
            CareTask.completed_at < day_end
        ).count()

        seven_day_activity.append(ActivityDay(
            date=day_date.strftime("%a %b %d"),
            minutes=day_mins,
            tasks_done=day_tasks
        ))

    return AnalyticsOverviewOut(
        total_plants=total_plants,
        category_breakdown=category_breakdown,
        total_tasks_completed=total_completed,
        total_tasks_pending=total_pending,
        tasks_completion_rate=completion_rate,
        total_outdoor_minutes=total_outdoor,
        weekly_outdoor_minutes=weekly_outdoor,
        outdoor_goal_minutes=outdoor_goal,
        streak_days=streak_days,
        completed_missions_count=completed_missions,
        total_missions_count=total_missions,
        total_assessments=total_assessments,
        total_garden_plans=total_plans,
        seven_day_activity=seven_day_activity
    )
