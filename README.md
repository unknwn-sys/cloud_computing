# Secure Cloud Log Analyzer with MapReduce

Secure Cloud Log Analyzer is a full-stack cybersecurity analytics app for uploading `.log` files, processing them with a parallel Python MapReduce pipeline, storing results in PostgreSQL, and viewing security metrics in a protected dashboard.

For complete setup, maintenance, API, database, deployment, and troubleshooting documentation, read [DOC.md](DOC.md).

## Tech Stack

- Frontend: Next.js 15, React, TypeScript, Tailwind CSS, Recharts, Framer Motion
- Backend: FastAPI, SQLAlchemy, JWT auth, SlowAPI rate limiting
- Database: PostgreSQL, with Neon-compatible connection strings
- Processing: Python `ProcessPoolExecutor` MapReduce pipeline

## Run Locally Without Docker

Docker files exist in the repository, but Docker is not required. Use this workflow if Docker is not installed.

```bash
cp .env.example .env
```

Edit `.env` and set a real `DATABASE_URL` and strong `JWT_SECRET`.

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

Change these credentials before any real deployment.

## Key Endpoints

- `POST /api/v1/auth/login`
- `POST /api/v1/logs/upload`
- `GET /api/v1/analytics/dashboard`

Interactive API docs are available while the backend is running:

```text
http://localhost:8000/docs
```

## Important Notes

- The backend expects PostgreSQL through `DATABASE_URL`.
- The frontend expects `NEXT_PUBLIC_API_BASE_URL=http://localhost:8000/api/v1` for local development.
- The project currently has no automated tests, no CI workflow, and no Alembic migrations.
- `server/requirements.txt` may need `email-validator` because the auth schema uses Pydantic `EmailStr`.

See [DOC.md](DOC.md) for the full project documentation and recommended improvements.
