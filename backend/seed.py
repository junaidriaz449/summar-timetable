from sqlalchemy.orm import Session
from models import Kid, Task, Reward, Setting, PointsBalance, Streak, CategoryEnum, TierEnum


def run_seed(db: Session):
    if db.query(Kid).count() > 0:
        return

    kids = [
        Kid(name="Muntaha", age=6, color_theme="#F59E0B", avatar_emoji="🦁"),
        Kid(name="Abtaha",  age=8, color_theme="#3B82F6", avatar_emoji="🐯"),
    ]
    db.add_all(kids)
    db.flush()

    for kid in kids:
        db.add(PointsBalance(kid_id=kid.id, total_points=0, week_points=0))
        db.add(Streak(kid_id=kid.id, current_streak=0, longest_streak=0))

    tasks = [
        # Prayer
        Task(label="Daily Prayer",              category=CategoryEnum.prayer, points=15, age_group="both", icon_emoji="✅"),
        # Quran
        Task(label="Quran Reading (10 min)",    category=CategoryEnum.quran,  points=10, age_group="both", icon_emoji="📖"),
        Task(label="Dua Memorization",          category=CategoryEnum.quran,  points=8,  age_group="both", icon_emoji="🤲"),
        Task(label="Islamic Story Time",        category=CategoryEnum.quran,  points=5,  age_group="both", icon_emoji="🌙"),
        # Chores age 6 (Muntaha)
        Task(label="Make My Bed",               category=CategoryEnum.chore,  points=5,  age_group="6",    icon_emoji="🛏️"),
        Task(label="Put Toys Away",             category=CategoryEnum.chore,  points=5,  age_group="6",    icon_emoji="🧸"),
        Task(label="Set The Table",             category=CategoryEnum.chore,  points=5,  age_group="6",    icon_emoji="🍽️"),
        Task(label="Help With Laundry",         category=CategoryEnum.chore,  points=5,  age_group="6",    icon_emoji="👕"),
        # Chores age 8 (Abtaha)
        Task(label="Make My Bed",               category=CategoryEnum.chore,  points=5,  age_group="8",    icon_emoji="🛏️"),
        Task(label="Tidy Room",                 category=CategoryEnum.chore,  points=8,  age_group="8",    icon_emoji="🧹"),
        Task(label="Wash Dishes",               category=CategoryEnum.chore,  points=8,  age_group="8",    icon_emoji="🍳"),
        Task(label="Help With Groceries",       category=CategoryEnum.chore,  points=8,  age_group="8",    icon_emoji="🛒"),
        Task(label="Water The Plants",          category=CategoryEnum.chore,  points=5,  age_group="8",    icon_emoji="🌿"),
        # Play
        Task(label="Outdoor Play / Exercise",   category=CategoryEnum.play,   points=5,  age_group="both", icon_emoji="🏃"),
        Task(label="Creative Play / Drawing",   category=CategoryEnum.play,   points=5,  age_group="both", icon_emoji="🎨"),
        Task(label="Reading a Book",            category=CategoryEnum.play,   points=8,  age_group="both", icon_emoji="📚"),
        # Screen
        Task(label="Screen Time Within Limit",  category=CategoryEnum.screen, points=5,  age_group="both", icon_emoji="📺"),
    ]
    db.add_all(tasks)

    rewards = [
        # Snack tier
        Reward(label="Chips",               points_cost=20,  tier=TierEnum.snack, icon_emoji="🍟"),
        Reward(label="Chocolate",           points_cost=20,  tier=TierEnum.snack, icon_emoji="🍫"),
        Reward(label="Ice Cream",           points_cost=25,  tier=TierEnum.snack, icon_emoji="🍦"),
        Reward(label="Juice Box",           points_cost=15,  tier=TierEnum.snack, icon_emoji="🧃"),
        Reward(label="Special Snack",       points_cost=30,  tier=TierEnum.snack, icon_emoji="🍬"),
        # Big tier
        Reward(label="Trip to the Park",    points_cost=100, tier=TierEnum.big,   icon_emoji="🏞️"),
        Reward(label="New Toy",             points_cost=200, tier=TierEnum.big,   icon_emoji="🎮"),
        Reward(label="Movie Night Pick",    points_cost=80,  tier=TierEnum.big,   icon_emoji="🎬"),
        Reward(label="Special Meal Choice", points_cost=60,  tier=TierEnum.big,   icon_emoji="🍕"),
        Reward(label="Sticker Pack",        points_cost=50,  tier=TierEnum.big,   icon_emoji="🌟"),
    ]
    db.add_all(rewards)

    settings = [
        Setting(key="parent_pin",               value="1234"),
        Setting(key="screen_time_limit_minutes", value="60"),
        Setting(key="app_name",                  value="Abtaha Muntaha Summer Timetable"),
    ]
    db.add_all(settings)

    db.commit()
