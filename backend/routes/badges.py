from datetime import date, timedelta
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

from database import get_db
from models import Badge, DailyLog, Task, Streak, PointsBalance, Kid, CategoryEnum
from schemas import BadgeOut

router = APIRouter(prefix="/badges", tags=["badges"])

BADGE_DEFS = {
    "prayer_champ":  ("🕌", "Prayer Champ"),
    "quran_hero":    ("📖", "Quran Hero"),
    "chore_star":    ("🧹", "Chore Star"),
    "on_fire":       ("🔥", "On Fire"),
    "unstoppable":   ("⚡", "Unstoppable"),
    "week_champion": ("👑", "Week Champion"),
    "perfect_day":   ("🎯", "Perfect Day"),
    "good_brother":  ("🤝", "Good Brother"),
}


def _week_start(today: date) -> date:
    return today - timedelta(days=(today.weekday() - 5) % 7)


def _already_earned(kid_id: int, badge_key: str, week_start: date, db: Session) -> bool:
    return db.query(Badge).filter(
        Badge.kid_id == kid_id,
        Badge.badge_key == badge_key,
        Badge.week_start_date == week_start,
    ).first() is not None


def _award(kid_id: int, badge_key: str, week_start: date, db: Session):
    emoji, label = BADGE_DEFS[badge_key]
    db.add(Badge(
        kid_id=kid_id,
        badge_key=badge_key,
        badge_label=label,
        badge_emoji=emoji,
        week_start_date=week_start,
    ))


def evaluate_badges(kid_id: int, db: Session):
    today = date.today()
    week_start = _week_start(today)
    kid = db.query(Kid).filter(Kid.id == kid_id).first()
    if not kid:
        return

    # Prayer Champ — 7 prayers this week
    prayer_count = (
        db.query(func.count(DailyLog.id))
        .join(Task, Task.id == DailyLog.task_id)
        .filter(
            DailyLog.kid_id == kid_id,
            DailyLog.date >= week_start,
            Task.category == CategoryEnum.prayer,
        )
        .scalar() or 0
    )
    if prayer_count >= 7 and not _already_earned(kid_id, "prayer_champ", week_start, db):
        _award(kid_id, "prayer_champ", week_start, db)

    # Quran Hero — 5 quran sessions this week
    quran_count = (
        db.query(func.count(DailyLog.id))
        .join(Task, Task.id == DailyLog.task_id)
        .filter(
            DailyLog.kid_id == kid_id,
            DailyLog.date >= week_start,
            Task.category == CategoryEnum.quran,
        )
        .scalar() or 0
    )
    if quran_count >= 5 and not _already_earned(kid_id, "quran_hero", week_start, db):
        _award(kid_id, "quran_hero", week_start, db)

    # Chore Star — all active chores for this kid's age done on a single day
    age_group = str(kid.age)
    chore_tasks = (
        db.query(Task)
        .filter(
            Task.category == CategoryEnum.chore,
            Task.is_active == True,
            (Task.age_group == age_group) | (Task.age_group == "both"),
        )
        .all()
    )
    chore_ids = {t.id for t in chore_tasks}
    if chore_ids:
        chore_logs = (
            db.query(DailyLog.date, func.count(DailyLog.id).label("cnt"))
            .filter(DailyLog.kid_id == kid_id, DailyLog.task_id.in_(chore_ids))
            .group_by(DailyLog.date)
            .all()
        )
        for log_date, cnt in chore_logs:
            if cnt >= len(chore_ids) and not _already_earned(kid_id, "chore_star", week_start, db):
                _award(kid_id, "chore_star", week_start, db)
                break

    # On Fire — 3 day streak
    streak = db.query(Streak).filter(Streak.kid_id == kid_id).first()
    if streak and streak.current_streak >= 3 and not _already_earned(kid_id, "on_fire", week_start, db):
        _award(kid_id, "on_fire", week_start, db)

    # Unstoppable — 7 day streak
    if streak and streak.current_streak >= 7 and not _already_earned(kid_id, "unstoppable", week_start, db):
        _award(kid_id, "unstoppable", week_start, db)

    # Perfect Day — all active tasks for this kid done on a single day
    all_tasks = (
        db.query(Task)
        .filter(
            Task.is_active == True,
            (Task.age_group == age_group) | (Task.age_group == "both"),
        )
        .all()
    )
    all_task_ids = {t.id for t in all_tasks}
    if all_task_ids:
        day_logs = (
            db.query(DailyLog.date, func.count(DailyLog.id).label("cnt"))
            .filter(DailyLog.kid_id == kid_id, DailyLog.task_id.in_(all_task_ids))
            .group_by(DailyLog.date)
            .all()
        )
        for log_date, cnt in day_logs:
            if cnt >= len(all_task_ids) and not _already_earned(kid_id, "perfect_day", week_start, db):
                _award(kid_id, "perfect_day", week_start, db)
                # Good Brother — check if other kid also has a perfect day on same date
                other_kids = db.query(Kid).filter(Kid.id != kid_id).all()
                for other in other_kids:
                    other_age = str(other.age)
                    other_tasks = (
                        db.query(Task)
                        .filter(
                            Task.is_active == True,
                            (Task.age_group == other_age) | (Task.age_group == "both"),
                        )
                        .all()
                    )
                    other_task_ids = {t.id for t in other_tasks}
                    if other_task_ids:
                        other_cnt = (
                            db.query(func.count(DailyLog.id))
                            .filter(
                                DailyLog.kid_id == other.id,
                                DailyLog.task_id.in_(other_task_ids),
                                DailyLog.date == log_date,
                            )
                            .scalar() or 0
                        )
                        if other_cnt >= len(other_task_ids):
                            if not _already_earned(kid_id, "good_brother", week_start, db):
                                _award(kid_id, "good_brother", week_start, db)
                            if not _already_earned(other.id, "good_brother", week_start, db):
                                _award(other.id, "good_brother", week_start, db)
                break

    # Week Champion — most week_points; only award Sunday (weekday=6) or gap > 50
    all_pb = db.query(PointsBalance).all()
    if len(all_pb) >= 2:
        sorted_pb = sorted(all_pb, key=lambda x: x.week_points, reverse=True)
        leader = sorted_pb[0]
        gap = leader.week_points - sorted_pb[1].week_points
        is_sunday = today.weekday() == 6
        if (is_sunday or gap > 50) and not _already_earned(leader.kid_id, "week_champion", week_start, db):
            _award(leader.kid_id, "week_champion", week_start, db)

    db.commit()


@router.get("/{kid_id}", response_model=list[BadgeOut])
def get_badges(kid_id: int, db: Session = Depends(get_db)):
    return db.query(Badge).filter(Badge.kid_id == kid_id).order_by(Badge.earned_at.desc()).all()


@router.post("/evaluate/{kid_id}", status_code=200)
def trigger_evaluate(kid_id: int, db: Session = Depends(get_db)):
    evaluate_badges(kid_id, db)
    return {"status": "evaluated"}
