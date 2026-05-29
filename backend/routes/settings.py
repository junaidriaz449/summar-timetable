from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from models import Setting
from schemas import SettingOut, SettingUpdate, PinVerify, PinVerifyResult

router = APIRouter(prefix="/settings", tags=["settings"])


@router.get("", response_model=list[SettingOut])
def get_settings(db: Session = Depends(get_db)):
    return db.query(Setting).all()


@router.put("", response_model=SettingOut)
def update_setting(payload: SettingUpdate, db: Session = Depends(get_db)):
    setting = db.query(Setting).filter(Setting.key == payload.key).first()
    if setting:
        setting.value = payload.value
    else:
        setting = Setting(key=payload.key, value=payload.value)
        db.add(setting)
    db.commit()
    db.refresh(setting)
    return setting


@router.post("/verify-pin", response_model=PinVerifyResult)
def verify_pin(payload: PinVerify, db: Session = Depends(get_db)):
    setting = db.query(Setting).filter(Setting.key == "parent_pin").first()
    if not setting:
        raise HTTPException(status_code=500, detail="PIN not configured")
    return PinVerifyResult(valid=(setting.value == payload.pin))
