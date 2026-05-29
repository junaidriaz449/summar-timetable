from datetime import datetime
from sqlalchemy import (
    Column, Integer, String, Boolean, DateTime, Date,
    ForeignKey, UniqueConstraint, Enum as SAEnum
)
from sqlalchemy.orm import relationship
from database import Base
import enum


class CategoryEnum(str, enum.Enum):
    prayer = "prayer"
    quran = "quran"
    chore = "chore"
    play = "play"
    screen = "screen"


class TierEnum(str, enum.Enum):
    snack = "snack"
    big = "big"


class RedemptionStatusEnum(str, enum.Enum):
    pending = "pending"
    approved = "approved"
    rejected = "rejected"


class Kid(Base):
    __tablename__ = "kids"

    id = Column(Integer, primary_key=True)
    name = Column(String, nullable=False)
    age = Column(Integer, nullable=False)
    color_theme = Column(String, nullable=False)
    avatar_emoji = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    daily_logs = relationship("DailyLog", back_populates="kid")
    points_balance = relationship("PointsBalance", back_populates="kid", uselist=False)
    streak = relationship("Streak", back_populates="kid", uselist=False)
    redemptions = relationship("Redemption", back_populates="kid")
    badges = relationship("Badge", back_populates="kid")


class Task(Base):
    __tablename__ = "tasks"

    id = Column(Integer, primary_key=True)
    label = Column(String, nullable=False)
    category = Column(SAEnum(CategoryEnum), nullable=False)
    points = Column(Integer, nullable=False)
    age_group = Column(String, nullable=False)  # "6", "8", or "both"
    icon_emoji = Column(String, nullable=False)
    is_active = Column(Boolean, default=True)

    daily_logs = relationship("DailyLog", back_populates="task")


class DailyLog(Base):
    __tablename__ = "daily_log"
    __table_args__ = (UniqueConstraint("kid_id", "task_id", "date"),)

    id = Column(Integer, primary_key=True)
    kid_id = Column(Integer, ForeignKey("kids.id"), nullable=False)
    task_id = Column(Integer, ForeignKey("tasks.id"), nullable=False)
    date = Column(Date, nullable=False)
    completed_at = Column(DateTime, default=datetime.utcnow)

    kid = relationship("Kid", back_populates="daily_logs")
    task = relationship("Task", back_populates="daily_logs")


class PointsBalance(Base):
    __tablename__ = "points_balance"

    kid_id = Column(Integer, ForeignKey("kids.id"), primary_key=True)
    total_points = Column(Integer, default=0)
    week_points = Column(Integer, default=0)
    last_updated = Column(DateTime, default=datetime.utcnow)

    kid = relationship("Kid", back_populates="points_balance")


class Streak(Base):
    __tablename__ = "streaks"

    kid_id = Column(Integer, ForeignKey("kids.id"), primary_key=True)
    current_streak = Column(Integer, default=0)
    longest_streak = Column(Integer, default=0)
    last_active_date = Column(Date, nullable=True)

    kid = relationship("Kid", back_populates="streak")


class Reward(Base):
    __tablename__ = "rewards"

    id = Column(Integer, primary_key=True)
    label = Column(String, nullable=False)
    points_cost = Column(Integer, nullable=False)
    tier = Column(SAEnum(TierEnum), nullable=False)
    icon_emoji = Column(String, nullable=False)
    is_active = Column(Boolean, default=True)

    redemptions = relationship("Redemption", back_populates="reward")


class Redemption(Base):
    __tablename__ = "redemptions"

    id = Column(Integer, primary_key=True)
    kid_id = Column(Integer, ForeignKey("kids.id"), nullable=False)
    reward_id = Column(Integer, ForeignKey("rewards.id"), nullable=False)
    status = Column(SAEnum(RedemptionStatusEnum), default=RedemptionStatusEnum.pending)
    requested_at = Column(DateTime, default=datetime.utcnow)
    resolved_at = Column(DateTime, nullable=True)

    kid = relationship("Kid", back_populates="redemptions")
    reward = relationship("Reward", back_populates="redemptions")


class Badge(Base):
    __tablename__ = "badges"

    id = Column(Integer, primary_key=True)
    kid_id = Column(Integer, ForeignKey("kids.id"), nullable=False)
    badge_key = Column(String, nullable=False)
    badge_label = Column(String, nullable=False)
    badge_emoji = Column(String, nullable=False)
    week_start_date = Column(Date, nullable=True)
    earned_at = Column(DateTime, default=datetime.utcnow)

    kid = relationship("Kid", back_populates="badges")


class Setting(Base):
    __tablename__ = "settings"

    key = Column(String, primary_key=True)
    value = Column(String, nullable=False)
