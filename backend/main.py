from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database import engine, SessionLocal, Base
import models  # noqa: ensure models are registered before create_all
from seed import run_seed
from routes import kids, tasks, daily_log, points, rewards, badges, settings, dashboard


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        run_seed(db)
    finally:
        db.close()
    yield


app = FastAPI(title="Summer Timetable API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(kids.router,      prefix="/api")
app.include_router(tasks.router,     prefix="/api")
app.include_router(daily_log.router, prefix="/api")
app.include_router(points.router,    prefix="/api")
app.include_router(rewards.router,   prefix="/api")
app.include_router(badges.router,    prefix="/api")
app.include_router(settings.router,  prefix="/api")
app.include_router(dashboard.router, prefix="/api")
