from datetime import datetime, timedelta, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from backend.app.database import get_db
from backend.app.models.user import User
from backend.app.models.task import CareTask
from backend.app.models.plant import Plant, CareSchedule
from backend.app.schemas.task import (
    CareTaskCreate,
    CareTaskUpdate,
    CareTaskOut,
    TaskCompletionRequest
)
from backend.app.utils.security import get_current_user

router = APIRouter(prefix="/api/tasks", tags=["Care Tasks"])

def get_utc_now():
    return datetime.now(timezone.utc).replace(tzinfo=None)

def enrich_task_out(task: CareTask) -> CareTaskOut:
    t_out = CareTaskOut.model_validate(task)
    if task.plant:
        t_out.plant_name = task.plant.common_name
        t_out.plant_image_url = task.plant.image_url
    return t_out

@router.get("", response_model=List[CareTaskOut])
def get_user_tasks(
    filter_by: Optional[str] = "today",  # all, today, upcoming, overdue, completed
    plant_id: Optional[int] = None,
    task_type: Optional[str] = None,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(CareTask).filter(CareTask.user_id == user.id)

    if plant_id:
        query = query.filter(CareTask.plant_id == plant_id)
    if task_type and task_type != "all":
        query = query.filter(CareTask.task_type == task_type)

    now = get_utc_now()
    today_start = datetime(now.year, now.month, now.day)
    today_end = today_start + timedelta(days=1)

    if filter_by == "today":
        query = query.filter(
            CareTask.due_date >= today_start,
            CareTask.due_date < today_end,
            CareTask.is_completed == False
        )
    elif filter_by == "upcoming":
        query = query.filter(
            CareTask.due_date >= today_end,
            CareTask.is_completed == False
        )
    elif filter_by == "overdue":
        query = query.filter(
            CareTask.due_date < today_start,
            CareTask.is_completed == False
        )
    elif filter_by == "completed":
        query = query.filter(CareTask.is_completed == True)
    elif filter_by == "pending":
        query = query.filter(CareTask.is_completed == False)

    tasks = query.order_by(CareTask.due_date.asc()).all()
    return [enrich_task_out(t) for t in tasks]

@router.post("", response_model=CareTaskOut, status_code=status.HTTP_201_CREATED)
def create_care_task(
    req: CareTaskCreate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if req.plant_id:
        plant = db.query(Plant).filter(Plant.id == req.plant_id, Plant.user_id == user.id).first()
        if not plant:
            raise HTTPException(status_code=404, detail="Plant not found")

    task = CareTask(
        user_id=user.id,
        plant_id=req.plant_id,
        task_type=req.task_type,
        title=req.title,
        description=req.description,
        due_date=req.due_date,
        notes=req.notes,
        is_completed=False
    )
    db.add(task)
    db.commit()
    db.refresh(task)
    return enrich_task_out(task)

@router.put("/{task_id}/complete", response_model=CareTaskOut)
def complete_care_task(
    task_id: int,
    req: TaskCompletionRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    task = db.query(CareTask).filter(CareTask.id == task_id, CareTask.user_id == user.id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    now = get_utc_now()
    task.is_completed = True
    task.completed_at = now
    if req.notes:
        task.notes = (task.notes or "") + f"\nCompleted with note: {req.notes}"

    if task.plant_id:
        sched = db.query(CareSchedule).filter(
            CareSchedule.plant_id == task.plant_id,
            CareSchedule.task_type == task.task_type
        ).first()
        if sched:
            sched.last_completed_at = now
            next_due = now + timedelta(days=sched.frequency_days)
            sched.next_due_date = next_due

            next_task = CareTask(
                user_id=user.id,
                plant_id=task.plant_id,
                task_type=task.task_type,
                title=f"{task.task_type.capitalize()} {task.plant.common_name}",
                description=sched.instructions or f"Recurring {task.task_type} every {sched.frequency_days} days.",
                due_date=next_due,
                is_completed=False
            )
            db.add(next_task)

    db.commit()
    db.refresh(task)
    return enrich_task_out(task)

@router.put("/{task_id}", response_model=CareTaskOut)
def update_care_task(
    task_id: int,
    req: CareTaskUpdate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    task = db.query(CareTask).filter(CareTask.id == task_id, CareTask.user_id == user.id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    for field, val in req.model_dump(exclude_unset=True).items():
        setattr(task, field, val)

    db.commit()
    db.refresh(task)
    return enrich_task_out(task)

@router.delete("/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_care_task(
    task_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    task = db.query(CareTask).filter(CareTask.id == task_id, CareTask.user_id == user.id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    db.delete(task)
    db.commit()
    return None
