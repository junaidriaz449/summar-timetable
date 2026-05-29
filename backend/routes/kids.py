from datetime import date
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
import pytz

from database import get_db
from models import Kid, DailyLog, Task, PointsBalance, Streak
from schemas import KidOut, KidUpdate

router = APIRouter(prefix="/kids", tags=["kids"])

KHI = pytz.timezone("Asia/Karachi")


def today_khi() -> date:
    return date.today()  # server already uses UTC but date comparison is date-only


def _enrich_kid(kid: Kid, db: Session) -> KidOut:
    today = date.today()

    points_today = (
        db.query(func.sum(Task.points))
        .join(DailyLog, DailyLog.task_id == Task.id)
        .filter(DailyLog.kid_id == kid.id, DailyLog.date == today)
        .scalar() or 0
    )
    tasks_done = (
        db.query(func.count(DailyLog.id))
        .filter(DailyLog.kid_id == kid.id, DailyLog.date == today)
        .scalar() or 0
    )
    pb = kid.points_balance
    st = kid.streak

    return KidOut(
        id=kid.id,
        name=kid.name,
        age=kid.age,
        color_theme=kid.color_theme,
        avatar_emoji=kid.avatar_emoji,
        created_at=kid.created_at,
        points_today=points_today,
        tasks_done_today=tasks_done,
        current_streak=st.current_streak if st else 0,
        total_points=pb.total_points if pb else 0,
        week_points=pb.week_points if pb else 0,
    )


@router.get("", response_model=list[KidOut])
def list_kids(db: Session = Depends(get_db)):
    kids = db.query(Kid).all()
    return [_enrich_kid(k, db) for k in kids]


@router.get("/{kid_id}", response_model=KidOut)
def get_kid(kid_id: int, db: Session = Depends(get_db)):
    kid = db.query(Kid).filter(Kid.id == kid_id).first()
    if not kid:
        raise HTTPException(status_code=404, detail="Kid not found")
    return _enrich_kid(kid, db)


@router.put("/{kid_id}", response_model=KidOut)
def update_kid(kid_id: int, payload: KidUpdate, db: Session = Depends(get_db)):
    kid = db.query(Kid).filter(Kid.id == kid_id).first()
    if not kid:
        raise HTTPException(status_code=404, detail="Kid not found")
    for field, value in payload.model_dump(exclude_none=True).items():
        setattr(kid, field, value)
    db.commit()
    db.refresh(kid)
    return _enrich_kid(kid, db)
