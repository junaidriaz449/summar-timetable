# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Run the full app
```bash
docker compose up --build        # first run or after any file change
docker compose up                # subsequent runs (no file changes)
docker compose down -v           # wipe everything including the SQLite volume
```

### Backend dev (Python 3.11+)
```bash
cd backend
pip install -r requirements.txt
DATABASE_URL=sqlite:///./dev.sqlite uvicorn main:app --reload
# API docs at http://localhost:8000/docs
```

### Frontend dev (Node 18+)
```bash
cd frontend
npm install
npm run dev    # Vite dev server at :5173, proxies /api → localhost:8000
npm run build  # production build (VITE_API_BASE=/api baked in via Dockerfile ENV)
```

## Architecture

Two Docker services talk through nginx:

```
Browser → frontend:4173 (nginx)
              ├── /api/* → proxy_pass → backend:8000 (FastAPI/uvicorn)
              └── /*     → serve dist/ (React SPA)
```

`VITE_API_BASE` is a compile-time Vite constant set in `frontend/Dockerfile` as `ENV VITE_API_BASE=/api`. It must **not** be a Docker runtime env var — Vite bakes it at build time.

In production (Cloudflare tunnel), the tunnel itself routes `/api/*` to port 8000 and `/*` to port 4173 — the nginx proxy handles it for local dev only.

### Backend structure

| File | Purpose |
|---|---|
| `models.py` | All SQLAlchemy ORM models — single source of truth for DB schema |
| `schemas.py` | All Pydantic v2 request/response shapes |
| `seed.py` | `run_seed(db)` — called at startup, no-ops if `kids` table is non-empty |
| `database.py` | Engine, `SessionLocal`, `Base`, `get_db()` dependency |
| `routes/daily_log.py` | The core write path — every task completion flows here |
| `routes/badges.py` | `evaluate_badges(kid_id, db)` — called inline after each log write |

Routes all mount under `/api` prefix in `main.py`.

**Points are never stored incrementally** — `_recalc_points()` in `daily_log.py` re-sums all `DailyLog` rows every time a task is toggled. `PointsBalance.total_points` and `.week_points` are derived caches, always recalculated from scratch.

**Badge deduplication** is by `(kid_id, badge_key, week_start_date)`. The week champion badge uses a separate `POST /api/points/reset-week` endpoint to zero `week_points` without touching `total_points` — never use the generic `adjust` endpoint for weekly resets.

### Frontend structure

| Path | Purpose |
|---|---|
| `src/api/client.js` | Axios instance — error interceptor fires `react-hot-toast` on any failed request |
| `src/api/*.js` | One file per backend domain, each exports named async functions |
| `src/views/Schedule.jsx` | Main interaction screen — optimistic task toggle with revert on error |
| `src/views/ParentPanel.jsx` | PIN-gated; PIN verified server-side via `POST /api/settings/verify-pin` |

Frontend state is local React state per view — no global store. Each view re-fetches from the API after mutations.

## Key domain rules

- **Week** runs Saturday → Friday. Formula for week start: `today - timedelta(days=(today.weekday() - 5) % 7)`
- **Streak** increments when a kid completes ≥ 3 tasks on a calendar day; evaluated in `_recalc_streak()` on every log write
- **Muntaha** = age 6, amber `#F59E0B`, 🦁 — **Abtaha** = age 8, blue `#3B82F6`, 🐯
- Task `age_group` is `"6"`, `"8"`, or `"both"` — frontend filters by `kid.age` as a string
- Redemption points are deducted on request, refunded on reject — approved redemptions are non-refundable
- The circular import between `daily_log.py` and `badges.py` is intentional — `evaluate_badges` is imported inside the function body to break the cycle
