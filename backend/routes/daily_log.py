import datetime as dt
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from sqlalchemy.exc import IntegrityError

from database import get_db
from models import DailyLog, Task, PointsBalance, Streak, Kid
from schemas import DailyLogCreate, DailyLogOut

router = APIRouter(prefix="/daily-log", tags=["daily-log"])


def _recalc_points(kid_id: int, db: Session):
    today = dt.date.today()
    pb = db.query(PointsBalance).filter(PointsBalance.kid_id == kid_id).first()
    if not pb:
        return

    total = (
        db.query(func.sum(Task.points))
        .join(DailyLog, DailyLog.task_id == Task.id)
        .filter(DailyLog.kid_id == kid_id)
        .scalar() or 0
    )
    days_back = (today.weekday() - 5) % 7
    week_start = today - dt.timedelta(days=days_back)
    week = (
        db.query(func.sum(Task.points))
        .join(DailyLog, DailyLog.task_id == Task.id)
        .filter(DailyLog.kid_id == kid_id, DailyLog.date >= week_start)
        .scalar() or 0
    )
    pb.total_points = total
    pb.week_points = week
    pb.last_updated = dt.datetime.utcnow()


def _recalc_streak(kid_id: int, db: Session):
    today = dt.date.today()
    streak = db.query(Streak).filter(Streak.kid_id == kid_id).first()
    if not streak:
        return

    tasks_today = (
        db.query(func.count(DailyLog.id))
        .filter(DailyLog.kid_id == kid_id, DailyLog.date == today)
        .scalar() or 0
    )

    if tasks_today >= 3:
        if streak.last_active_date is None:
            streak.current_streak = 1
        elif streak.last_active_date == today - dt.timedelta(days=1):
            streak.current_streak += 1
        elif streak.last_active_date == today:
            pass  # already counted today
        else:
            streak.current_streak = 1
        streak.last_active_date = today
        if streak.current_streak > streak.longest_streak:
            streak.longest_streak = streak.current_streak


@router.get("/{kid_id}", response_model=list[DailyLogOut])
def get_daily_log(kid_id: int, log_date: Optional[dt.date] = None, db: Session = Depends(get_db)):
    target_date = log_date or dt.date.today()
    return (
        db.query(DailyLog)
        .filter(DailyLog.kid_id == kid_id, DailyLog.date == target_date)
        .all()
    )


@router.post("", response_model=DailyLogOut, status_code=201)
def mark_complete(payload: DailyLogCreate, db: Session = Depends(get_db)):
    kid = db.query(Kid).filter(Kid.id == payload.kid_id).first()
    if not kid:
        raise HTTPException(status_code=404, detail="Kid not found")
    task = db.query(Task).filter(Task.id == payload.task_id, Task.is_active == True).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    log = DailyLog(kid_id=payload.kid_id, task_id=payload.task_id, date=payload.date)
    db.add(log)
    try:
        db.flush()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="Task already completed for this date")

    _recalc_points(payload.kid_id, db)
    _recalc_streak(payload.kid_id, db)
    db.commit()
    db.refresh(log)

    from routes.badges import evaluate_badges
    evaluate_badges(payload.kid_id, db)

    return log


@router.delete("/{log_id}", status_code=204)
def unmark_complete(log_id: int, db: Session = Depends(get_db)):
    log = db.query(DailyLog).filter(DailyLog.id == log_id).first()
    if not log:
        raise HTTPException(status_code=404, detail="Log entry not found")
    kid_id = log.kid_id
    db.delete(log)
    db.flush()
    _recalc_points(kid_id, db)
    _recalc_streak(kid_id, db)
    db.commit()
