# Abtaha Muntaha Summer Timetable ☀️

A self-hosted web app for brothers Muntaha (age 6) and Abtaha (age 8) to track summer activities, earn points, and redeem rewards — with a parent management panel.

## Quick Start

```bash
docker compose up --build
```

App is available at:
- **Frontend**: http://localhost:4173
- **Backend API**: http://localhost:8000/api
- **API Docs**: http://localhost:8000/docs

Default parent PIN: **1234**

---

## Cloudflare Tunnel Setup

Route both services through a single domain using Cloudflare Tunnel:

1. Create a tunnel pointing to your server
2. Add two public hostname rules in the Cloudflare dashboard:

| Subdomain | Path | Service |
|---|---|---|
| `timetable.0overhead.dev` | `/api/*` | `http://localhost:8000` |
| `timetable.0overhead.dev` | `/*` | `http://localhost:4173` |

> The `/api/*` rule must be listed **above** the `/*` rule so API requests route to the backend.

---

## Changing the Default PIN

**Option 1 — Via the app:**
1. Open the app → Parent tab → enter current PIN (default: `1234`)
2. Go to Settings tab → Change PIN

**Option 2 — Direct DB edit:**
```bash
docker compose exec backend python -c "
from database import SessionLocal
from models import Setting
db = SessionLocal()
s = db.query(Setting).filter(Setting.key == 'parent_pin').first()
s.value = 'YOUR_NEW_PIN'
db.commit()
print('PIN updated')
"
```

---

## Data Persistence

SQLite database is stored in a Docker named volume (`db_data`). It persists across container restarts and rebuilds.

To back up the database:
```bash
docker compose cp backend:/data/db.sqlite ./backup.sqlite
```

To reset all data:
```bash
docker compose down -v
docker compose up --build
```

---

## Development

```bash
# Backend (requires Python 3.11+)
cd backend
pip install -r requirements.txt
DATABASE_URL=sqlite:///./dev.sqlite uvicorn main:app --reload

# Frontend (requires Node 18+)
cd frontend
npm install
npm run dev   # proxies /api → localhost:8000
```
