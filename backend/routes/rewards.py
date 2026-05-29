from datetime import datetime
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from models import Reward, Redemption, PointsBalance, RedemptionStatusEnum
from schemas import (
    RewardOut, RewardCreate, RewardUpdate,
    RedemptionOut, RedemptionCreate, RedemptionUpdate,
)

router = APIRouter(tags=["rewards"])


# ── Rewards CRUD ──────────────────────────────────────────────────────────────

@router.get("/rewards", response_model=list[RewardOut])
def list_rewards(db: Session = Depends(get_db)):
    return db.query(Reward).filter(Reward.is_active == True).all()


@router.post("/rewards", response_model=RewardOut, status_code=201)
def create_reward(payload: RewardCreate, db: Session = Depends(get_db)):
    reward = Reward(**payload.model_dump())
    db.add(reward)
    db.commit()
    db.refresh(reward)
    return reward


@router.put("/rewards/{reward_id}", response_model=RewardOut)
def update_reward(reward_id: int, payload: RewardUpdate, db: Session = Depends(get_db)):
    reward = db.query(Reward).filter(Reward.id == reward_id).first()
    if not reward:
        raise HTTPException(status_code=404, detail="Reward not found")
    for field, value in payload.model_dump(exclude_none=True).items():
        setattr(reward, field, value)
    db.commit()
    db.refresh(reward)
    return reward


@router.delete("/rewards/{reward_id}", status_code=204)
def deactivate_reward(reward_id: int, db: Session = Depends(get_db)):
    reward = db.query(Reward).filter(Reward.id == reward_id).first()
    if not reward:
        raise HTTPException(status_code=404, detail="Reward not found")
    reward.is_active = False
    db.commit()


# ── Redemptions ───────────────────────────────────────────────────────────────

@router.get("/redemptions", response_model=list[RedemptionOut])
def list_redemptions(status: Optional[str] = None, db: Session = Depends(get_db)):
    q = db.query(Redemption)
    if status:
        q = q.filter(Redemption.status == status)
    return q.order_by(Redemption.requested_at.desc()).all()


@router.post("/redemptions", response_model=RedemptionOut, status_code=201)
def create_redemption(payload: RedemptionCreate, db: Session = Depends(get_db)):
    reward = db.query(Reward).filter(Reward.id == payload.reward_id, Reward.is_active == True).first()
    if not reward:
        raise HTTPException(status_code=404, detail="Reward not found")

    pb = db.query(PointsBalance).filter(PointsBalance.kid_id == payload.kid_id).first()
    if not pb:
        raise HTTPException(status_code=404, detail="Kid not found")
    if pb.total_points < reward.points_cost:
        raise HTTPException(status_code=400, detail="Insufficient points")

    # Deduct points on request
    pb.total_points -= reward.points_cost
    pb.week_points = max(0, pb.week_points - reward.points_cost)

    redemption = Redemption(kid_id=payload.kid_id, reward_id=payload.reward_id)
    db.add(redemption)
    db.commit()
    db.refresh(redemption)
    return redemption


@router.put("/redemptions/{redemption_id}", response_model=RedemptionOut)
def update_redemption(redemption_id: int, payload: RedemptionUpdate, db: Session = Depends(get_db)):
    redemption = db.query(Redemption).filter(Redemption.id == redemption_id).first()
    if not redemption:
        raise HTTPException(status_code=404, detail="Redemption not found")

    if payload.status == RedemptionStatusEnum.rejected and redemption.status == RedemptionStatusEnum.pending:
        # Refund points
        pb = db.query(PointsBalance).filter(PointsBalance.kid_id == redemption.kid_id).first()
        if pb:
            pb.total_points += redemption.reward.points_cost
            pb.week_points += redemption.reward.points_cost

    redemption.status = payload.status
    redemption.resolved_at = datetime.utcnow()
    db.commit()
    db.refresh(redemption)
    return redemption
