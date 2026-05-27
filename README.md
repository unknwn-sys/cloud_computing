# Secure Cloud Log Analyzer with MapReduce

Secure Cloud Log Analyzer is an enterprise-style cybersecurity analytics app for uploading HTTP log files, auto-detecting common log formats, processing them with a parallel Python MapReduce pipeline, storing results in PostgreSQL, and monitoring traffic, errors, suspicious IPs, and audit activity in a SIEM-style dashboard.

For complete setup, maintenance, API, database, deployment, and troubleshooting documentation, read [DOC.md](DOC.md).

## Tech Stack

- Frontend: Next.js 15, React, TypeScript, Tailwind CSS, Recharts, Framer Motion, Lucide icons
- Backend: FastAPI, SQLAlchemy, JWT auth, SlowAPI rate limiting, Alembic migrations
- Database: PostgreSQL, with Neon-compatible connection strings
- Processing: Python `ProcessPoolExecutor` MapReduce pipeline with Apache, Nginx, JSON, generic HTTP, cloud, and mixed-log parsing
- Deployment: Vercel frontend and Railway backend

## Enterprise Features

- Empty premium login form with remember-me, show/hide password, loading state, session persistence, and automatic redirect for authenticated users.
- Proper logout from the dashboard, token clearing, session expiration handling, and dashboard access prevention after logout.
- Advanced status analytics for 1xx, 2xx, 3xx, 4xx, 5xx plus dynamic HTTP status code tracking.
- Endpoint analytics, failing endpoint detection, hourly trends, requests per IP, suspicious IP scoring, brute-force signals, bot/spam detection, and high error-rate alerts.
- Drag-and-drop upload, upload progress, loading skeletons, searchable upload table, pagination, CSV export, print/PDF export, audit section, threat monitoring section, and responsive navigation.
- Normalized analytics tables for summaries, suspicious events, traffic summaries, IP tracking, and error statistics.

## Run Locally Without Docker

Docker files exist in the repository, but Docker is not required. Use this workflow if Docker is not installed.

```bash
cp .env.example .env
```

Edit `.env` and set a real database URL, strong JWT secret, upload limits, and frontend API URL.

```text
DATABASE_URL=postgresql+psycopg://USER:PASSWORD@HOST/DATABASE?sslmode=require
JWT_SECRET=replace_with_a_long_random_secret
CORS_ORIGINS=http://localhost:3000
RATE_LIMIT_PER_MINUTE=60
MAX_UPLOAD_SIZE_MB=10
ALLOWED_LOG_EXTENSIONS=.log,.txt,.json
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000/api/v1
```

Backend:

```bash
cd server
python3.12 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python seed.py
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Frontend, in a second terminal:

```bash
cd client
npm install
npm run dev
```

Open:

```text
http://localhost:3000
```

Default seeded local credentials:

```text
admin@cloudlog.com / Admin@123
```

Change these credentials before any real deployment. The login UI does not prefill credentials.

## Key Endpoints

- `POST /api/v1/auth/login`
- `POST /api/v1/logs/upload`
- `GET /api/v1/analytics/dashboard`

Interactive API docs are available while the backend is running:

```text
http://localhost:8000/docs
```

## Deployment Notes

- Vercel must set `NEXT_PUBLIC_API_BASE_URL` to the Railway backend URL plus `/api/v1`.
- Railway must set `DATABASE_URL`, `JWT_SECRET`, `CORS_ORIGINS`, `RATE_LIMIT_PER_MINUTE`, `MAX_UPLOAD_SIZE_MB`, and `ALLOWED_LOG_EXTENSIONS`.
- `CORS_ORIGINS` must include the deployed Vercel frontend URL.
- Alembic migration scaffolding is included in `server/migrations`; the app still calls SQLAlchemy `create_all` on startup to preserve Railway compatibility.
- The dashboard uses browser storage for JWT persistence. Use HTTPS in production.
- Automated tests and CI workflow are recommended next steps.

See [DOC.md](DOC.md) for the full project documentation and recommended improvements.
