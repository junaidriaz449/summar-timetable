from datetime import date, timedelta
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

from database import get_db
from models import Kid, DailyLog, Task, PointsBalance, Streak, Badge, CategoryEnum
from schemas import DashboardOut, KidWeeklyStats, BadgeOut, DayStats

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


def _week_range(today: date):
    days_back = (today.weekday() - 5) % 7
    start = today - timedelta(days=days_back)
    end = start + timedelta(days=6)
    return start, end


@router.get("/weekly", response_model=DashboardOut)
def weekly_dashboard(db: Session = Depends(get_db)):
    today = date.today()
    week_start, week_end = _week_range(today)

    kids = db.query(Kid).all()
    kid_stats = []

    for kid in kids:
        pb = kid.points_balance
        st = kid.streak

        # Category breakdown for the week
        rows = (
            db.query(Task.category, func.sum(Task.points).label("pts"))
            .join(DailyLog, DailyLog.task_id == Task.id)
            .filter(DailyLog.kid_id == kid.id, DailyLog.date >= week_start)
            .group_by(Task.category)
            .all()
        )
        breakdown = {r.category.value: r.pts for r in rows}

        # Badges earned this week
        badges = (
            db.query(Badge)
            .filter(Badge.kid_id == kid.id, Badge.week_start_date == week_start)
            .all()
        )

        # Per-day breakdown (grouped queries for efficiency)
        day_pts_rows = (
            db.query(DailyLog.date, func.sum(Task.points).label("pts"))
            .join(Task, Task.id == DailyLog.task_id)
            .filter(DailyLog.kid_id == kid.id, DailyLog.date >= week_start, DailyLog.date <= week_end)
            .group_by(DailyLog.date)
            .all()
        )
        pts_by_date = {r.date: r.pts for r in day_pts_rows}

        day_task_rows = (
            db.query(DailyLog.date, func.count(DailyLog.id).label("cnt"))
            .filter(DailyLog.kid_id == kid.id, DailyLog.date >= week_start, DailyLog.date <= week_end)
            .group_by(DailyLog.date)
            .all()
        )
        tasks_by_date = {r.date: r.cnt for r in day_task_rows}

        week_badges_all = (
            db.query(Badge)
            .filter(
                Badge.kid_id == kid.id,
                func.date(Badge.earned_at) >= week_start,
                func.date(Badge.earned_at) <= week_end,
            )
            .all()
        )
        badges_by_date = {}
        for b in week_badges_all:
            day = b.earned_at.date()
            badges_by_date.setdefault(day, []).append(b)

        day_labels = ["SAT", "SUN", "MON", "TUE", "WED", "THU", "FRI"]
        days_breakdown = []
        for i in range(7):
            day_date = week_start + timedelta(days=i)
            days_breakdown.append(DayStats(
                date=day_date,
                day_label=day_labels[i],
                points_earned=pts_by_date.get(day_date, 0),
                tasks_completed=tasks_by_date.get(day_date, 0),
                is_today=(day_date == today),
                badges=[BadgeOut.model_validate(b) for b in badges_by_date.get(day_date, [])],
            ))

        kid_stats.append(KidWeeklyStats(
            kid_id=kid.id,
            name=kid.name,
            avatar_emoji=kid.avatar_emoji,
            color_theme=kid.color_theme,
            week_points=pb.week_points if pb else 0,
            total_points=pb.total_points if pb else 0,
            current_streak=st.current_streak if st else 0,
            longest_streak=st.longest_streak if st else 0,
            category_breakdown=breakdown,
            badges_this_week=[BadgeOut.model_validate(b) for b in badges],
            days_breakdown=days_breakdown,
        ))

    leader_id = None
    points_gap = 0
    if len(kid_stats) >= 2:
        sorted_stats = sorted(kid_stats, key=lambda x: x.week_points, reverse=True)
        leader_id = sorted_stats[0].kid_id
        points_gap = sorted_stats[0].week_points - sorted_stats[1].week_points

    return DashboardOut(
        kids=kid_stats,
        week_start=week_start,
        week_end=week_end,
        leader_id=leader_id,
        points_gap=points_gap,
    )
