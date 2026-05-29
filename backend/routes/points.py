from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from models import PointsBalance, Kid
from schemas import PointsOut, PointsAdjust

router = APIRouter(prefix="/points", tags=["points"])


@router.get("", response_model=list[PointsOut])
def list_points(db: Session = Depends(get_db)):
    return db.query(PointsBalance).all()


@router.get("/{kid_id}", response_model=PointsOut)
def get_points(kid_id: int, db: Session = Depends(get_db)):
    pb = db.query(PointsBalance).filter(PointsBalance.kid_id == kid_id).first()
    if not pb:
        raise HTTPException(status_code=404, detail="Kid not found")
    return pb


@router.post("/reset-week", status_code=200)
def reset_weekly_points(db: Session = Depends(get_db)):
    db.query(PointsBalance).update({PointsBalance.week_points: 0})
    db.commit()
    return {"status": "reset"}


@router.post("/{kid_id}/adjust", response_model=PointsOut)
def adjust_points(kid_id: int, payload: PointsAdjust, db: Session = Depends(get_db)):
    pb = db.query(PointsBalance).filter(PointsBalance.kid_id == kid_id).first()
    if not pb:
        raise HTTPException(status_code=404, detail="Kid not found")
    pb.total_points = max(0, pb.total_points + payload.delta)
    pb.week_points = max(0, pb.week_points + payload.delta)
    pb.last_updated = datetime.utcnow()
    db.commit()
    db.refresh(pb)
    return pb
