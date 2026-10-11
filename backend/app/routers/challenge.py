from datetime import datetime, timedelta, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session
from sqlalchemy import func

from backend.app.database import get_db
from backend.app.models.user import User
from backend.app.models.challenge import OutdoorMission, UserMissionProgress, OutdoorActivityLog
from backend.app.schemas.challenge import (
    OutdoorMissionOut,
    MissionCompleteRequest,
    OutdoorActivityLogCreate,
    OutdoorActivityLogOut,
    ChallengeSummaryOut
)
from backend.app.utils.security import get_current_user
from backend.app.utils.file_storage import save_upload_file

router = APIRouter(prefix="/api/challenge", tags=["Touch Grass Challenge"])

def get_utc_now():
    return datetime.now(timezone.utc).replace(tzinfo=None)

def compute_user_streak(user_id: int, db: Session) -> (int, int):
    logs = db.query(OutdoorActivityLog).filter(
        OutdoorActivityLog.user_id == user_id
    ).order_by(OutdoorActivityLog.logged_at.desc()).all()

    if not logs:
        return 0, 0

    distinct_dates = sorted(
        list(set(l.logged_at.date() for l in logs)),
        reverse=True
    )

    today = get_utc_now().date()
    yesterday = today - timedelta(days=1)

    if not distinct_dates or (distinct_dates[0] != today and distinct_dates[0] != yesterday):
        current_streak = 0
    else:
        current_streak = 1
        for i in range(len(distinct_dates) - 1):
            if distinct_dates[i] - distinct_dates[i+1] == timedelta(days=1):
                current_streak += 1
            else:
                break

    sorted_asc = sorted(distinct_dates)
    longest_streak = 0
    temp_streak = 0
    for i in range(len(sorted_asc)):
        if i == 0:
            temp_streak = 1
        elif sorted_asc[i] - sorted_asc[i-1] == timedelta(days=1):
            temp_streak += 1
        else:
            temp_streak = 1
        if temp_streak > longest_streak:
            longest_streak = temp_streak

    return current_streak, max(longest_streak, current_streak)

@router.get("/missions", response_model=List[OutdoorMissionOut])
def get_missions(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    missions = db.query(OutdoorMission).filter(OutdoorMission.is_active == True).all()
    user_prog_map = {
        p.mission_id: p for p in db.query(UserMissionProgress).filter(
            UserMissionProgress.user_id == user.id
        ).all()
    }

    result = []
    for m in missions:
        prog = user_prog_map.get(m.id)
        result.append(OutdoorMissionOut(
            id=m.id,
            title=m.title,
            description=m.description,
            category=m.category,
            estimated_minutes=m.estimated_minutes,
            instructions=m.instructions,
            sustainable_tip=m.sustainable_tip,
            week_number=m.week_number,
            badge_name=m.badge_name,
            is_active=m.is_active,
            is_completed=prog.is_completed if prog else False,
            completed_at=prog.completed_at if prog else None,
            user_notes=prog.notes if prog else None,
            evidence_photo_url=prog.evidence_photo_url if prog else None
        ))
    return result

@router.post("/missions/{mission_id}/complete", response_model=OutdoorMissionOut)
def complete_mission(
    mission_id: int,
    req: MissionCompleteRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    mission = db.query(OutdoorMission).filter(OutdoorMission.id == mission_id).first()
    if not mission:
        raise HTTPException(status_code=404, detail="Mission not found")

    prog = db.query(UserMissionProgress).filter(
        UserMissionProgress.user_id == user.id,
        UserMissionProgress.mission_id == mission_id
    ).first()

    now = get_utc_now()
    if not prog:
        prog = UserMissionProgress(
            user_id=user.id,
            mission_id=mission_id,
            is_completed=True,
            completed_at=now,
            notes=req.notes,
            evidence_photo_url=req.evidence_photo_url
        )
        db.add(prog)
    else:
        prog.is_completed = True
        prog.completed_at = now
        prog.notes = req.notes or prog.notes
        if req.evidence_photo_url:
            prog.evidence_photo_url = req.evidence_photo_url

    # Automatically log mission estimated minutes to outdoor activity log
    log = OutdoorActivityLog(
        user_id=user.id,
        minutes_spent=mission.estimated_minutes,
        activity_type=f"Mission: {mission.title}",
        notes=f"Self-reported outdoor challenge mission completion. Notes: {req.notes or 'None'}",
        logged_at=now
    )
    db.add(log)
    db.commit()
    db.refresh(prog)

    return OutdoorMissionOut(
        id=mission.id,
        title=mission.title,
        description=mission.description,
        category=mission.category,
        estimated_minutes=mission.estimated_minutes,
        instructions=mission.instructions,
        sustainable_tip=mission.sustainable_tip,
        week_number=mission.week_number,
        badge_name=mission.badge_name,
        is_active=mission.is_active,
        is_completed=True,
        completed_at=prog.completed_at,
        user_notes=prog.notes,
        evidence_photo_url=prog.evidence_photo_url
    )

@router.post("/log-activity", response_model=OutdoorActivityLogOut, status_code=status.HTTP_201_CREATED)
def log_outdoor_activity(
    req: OutdoorActivityLogCreate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    now = get_utc_now()
    log = OutdoorActivityLog(
        user_id=user.id,
        minutes_spent=req.minutes_spent,
        activity_type=req.activity_type,
        notes=req.notes,
        logged_at=now
    )
    db.add(log)
    db.commit()
    db.refresh(log)
    return log

@router.get("/summary", response_model=ChallengeSummaryOut)
def get_challenge_summary(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    now = get_utc_now()
    total_missions = db.query(OutdoorMission).filter(OutdoorMission.is_active == True).count()
    completed_missions = db.query(UserMissionProgress).filter(
        UserMissionProgress.user_id == user.id,
        UserMissionProgress.is_completed == True
    ).count()

    target = user.preference.outdoor_goal_minutes if user.preference else 120
    seven_days_ago = now - timedelta(days=7)
    weekly_mins = db.query(func.sum(OutdoorActivityLog.minutes_spent)).filter(
        OutdoorActivityLog.user_id == user.id,
        OutdoorActivityLog.logged_at >= seven_days_ago
    ).scalar() or 0

    progress_pct = min(100.0, round((weekly_mins / target) * 100, 1)) if target > 0 else 0.0
    current_streak, longest_streak = compute_user_streak(user.id, db)

    recent = db.query(OutdoorActivityLog).filter(
        OutdoorActivityLog.user_id == user.id
    ).order_by(OutdoorActivityLog.logged_at.desc()).limit(10).all()

    return ChallengeSummaryOut(
        total_missions=total_missions,
        completed_missions=completed_missions,
        weekly_target_minutes=target,
        weekly_logged_minutes=weekly_mins,
        weekly_progress_pct=progress_pct,
        current_streak_days=current_streak,
        longest_streak_days=longest_streak,
        hacktoberfest_week=1,
        recent_activities=[OutdoorActivityLogOut.model_validate(r) for r in recent]
    )

@router.post("/upload-evidence")
def upload_challenge_evidence(
    file: UploadFile = File(...),
    user: User = Depends(get_current_user)
):
    path = save_upload_file(file, subfolder="evidence")
    return {"evidence_photo_url": path}
