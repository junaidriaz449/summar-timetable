from datetime import date, datetime
from typing import Optional, List
from pydantic import BaseModel
from models import CategoryEnum, TierEnum, RedemptionStatusEnum


# ── Kids ──────────────────────────────────────────────────────────────────────

class KidBase(BaseModel):
    name: str
    age: int
    color_theme: str
    avatar_emoji: str


class KidUpdate(BaseModel):
    name: Optional[str] = None
    color_theme: Optional[str] = None
    avatar_emoji: Optional[str] = None


class KidOut(KidBase):
    id: int
    created_at: datetime
    points_today: int = 0
    tasks_done_today: int = 0
    current_streak: int = 0
    total_points: int = 0
    week_points: int = 0

    model_config = {"from_attributes": True}


# ── Tasks ─────────────────────────────────────────────────────────────────────

class TaskBase(BaseModel):
    label: str
    category: CategoryEnum
    points: int
    age_group: str
    icon_emoji: str


class TaskCreate(TaskBase):
    pass


class TaskUpdate(BaseModel):
    label: Optional[str] = None
    category: Optional[CategoryEnum] = None
    points: Optional[int] = None
    age_group: Optional[str] = None
    icon_emoji: Optional[str] = None
    is_active: Optional[bool] = None


class TaskOut(TaskBase):
    id: int
    is_active: bool

    model_config = {"from_attributes": True}


# ── Daily Log ─────────────────────────────────────────────────────────────────

class DailyLogCreate(BaseModel):
    kid_id: int
    task_id: int
    date: date


class DailyLogOut(BaseModel):
    id: int
    kid_id: int
    task_id: int
    date: date
    completed_at: datetime

    model_config = {"from_attributes": True}


# ── Points ────────────────────────────────────────────────────────────────────

class PointsOut(BaseModel):
    kid_id: int
    total_points: int
    week_points: int
    last_updated: datetime

    model_config = {"from_attributes": True}


class PointsAdjust(BaseModel):
    delta: int
    reason: str


# ── Rewards ───────────────────────────────────────────────────────────────────

class RewardBase(BaseModel):
    label: str
    points_cost: int
    tier: TierEnum
    icon_emoji: str


class RewardCreate(RewardBase):
    pass


class RewardUpdate(BaseModel):
    label: Optional[str] = None
    points_cost: Optional[int] = None
    tier: Optional[TierEnum] = None
    icon_emoji: Optional[str] = None
    is_active: Optional[bool] = None


class RewardOut(RewardBase):
    id: int
    is_active: bool

    model_config = {"from_attributes": True}


# ── Redemptions ───────────────────────────────────────────────────────────────

class RedemptionCreate(BaseModel):
    kid_id: int
    reward_id: int


class RedemptionUpdate(BaseModel):
    status: RedemptionStatusEnum


class RedemptionOut(BaseModel):
    id: int
    kid_id: int
    reward_id: int
    status: RedemptionStatusEnum
    requested_at: datetime
    resolved_at: Optional[datetime] = None
    reward: RewardOut

    model_config = {"from_attributes": True}


# ── Badges ────────────────────────────────────────────────────────────────────

class BadgeOut(BaseModel):
    id: int
    kid_id: int
    badge_key: str
    badge_label: str
    badge_emoji: str
    week_start_date: Optional[date] = None
    earned_at: datetime

    model_config = {"from_attributes": True}


# ── Dashboard ─────────────────────────────────────────────────────────────────

class DayStats(BaseModel):
    date: date
    day_label: str
    points_earned: int
    tasks_completed: int
    is_today: bool
    badges: List[BadgeOut]


class KidWeeklyStats(BaseModel):
    kid_id: int
    name: str
    avatar_emoji: str
    color_theme: str
    week_points: int
    total_points: int
    current_streak: int
    longest_streak: int
    category_breakdown: dict
    badges_this_week: List[BadgeOut]
    days_breakdown: List[DayStats] = []


class DashboardOut(BaseModel):
    kids: List[KidWeeklyStats]
    week_start: date
    week_end: date
    leader_id: Optional[int] = None
    points_gap: int = 0


# ── Settings ──────────────────────────────────────────────────────────────────

class SettingOut(BaseModel):
    key: str
    value: str

    model_config = {"from_attributes": True}


class SettingUpdate(BaseModel):
    key: str
    value: str


class PinVerify(BaseModel):
    pin: str


class PinVerifyResult(BaseModel):
    valid: bool
