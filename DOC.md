# Secure Cloud Log Analyzer - Complete Project Documentation

## Project Overview

### What The Project Does

Secure Cloud Log Analyzer is a full-stack cybersecurity analytics application. It lets an admin user sign in, upload `.log` files, process those logs with a parallel Python MapReduce pipeline, store the computed analytics in PostgreSQL, and view the latest security metrics in a protected Next.js dashboard.

The current implementation is intentionally compact:

- A FastAPI backend exposes authentication, log upload, and dashboard analytics APIs.
- A Next.js frontend provides login and dashboard screens.
- PostgreSQL stores users, upload records, MapReduce summaries, and audit events.
- The MapReduce service parses log lines, counts total requests, counts HTTP 404 and 500 errors, and groups request volume by hour.

### Main Features

- Admin login using email and password.
- Password hashing with bcrypt through Passlib.
- JWT access token creation and bearer-token API authentication.
- Protected backend endpoints for log upload and analytics.
- `.log` file validation on upload.
- Parallel log processing using `ProcessPoolExecutor`.
- Dashboard cards for total requests, HTTP 404 count, and HTTP 500 count.
- Hourly traffic chart rendered with Recharts.
- Upload history stored in PostgreSQL.
- Audit log entry created after every successful upload.
- CORS allow-list controlled by environment variables.
- API rate limiting using SlowAPI.

### Architecture Overview

```text
Browser
  |
  | Next.js app on http://localhost:3000
  v
client/
  - login screen
  - dashboard screen
  - API helper adds Bearer token from localStorage
  |
  | HTTP requests to NEXT_PUBLIC_API_BASE_URL
  v
server/
  - FastAPI app on http://localhost:8000
  - JWT authentication
  - SQLAlchemy database access
  - MapReduce log processing
  |
  | DATABASE_URL
  v
PostgreSQL / Neon
  - users
  - log_uploads
  - audit_logs
```

### Frontend Explanation

The frontend lives in `client/` and uses the Next.js App Router. The root route redirects to `/login`. After login, the access token is saved in `localStorage`, and the user is sent to `/dashboard`.

Important frontend files:

- `client/app/page.tsx` redirects `/` to `/login`.
- `client/app/(auth)/login/page.tsx` renders the login form and calls `POST /auth/login`.
- `client/app/(dashboard)/dashboard/page.tsx` loads dashboard data, uploads `.log` files, and renders metrics.
- `client/components/charts/TrafficChart.tsx` renders the hourly traffic area chart.
- `client/lib/api.ts` centralizes API calls and attaches the JWT bearer token.

### Backend Explanation

The backend lives in `server/` and uses FastAPI. It mounts all API routes under `/api/v1`.

Important backend files:

- `server/app/main.py` creates the FastAPI app, configures CORS, configures rate limiting, creates database tables, and includes the API router.
- `server/app/api/v1/router.py` mounts auth, logs, and analytics routers.
- `server/app/api/v1/endpoints/auth.py` handles login.
- `server/app/api/v1/endpoints/logs.py` handles `.log` file upload and MapReduce processing.
- `server/app/api/v1/endpoints/analytics.py` returns upload and audit data.
- `server/app/services/mapreduce.py` contains the parallel log parser and reducer.
- `server/app/models/` defines SQLAlchemy database models.

### Tech Stack Detected

Frontend:

- Next.js `15.0.3`
- React `19.0.0-rc-66855b96-20241106`
- TypeScript `^5.6.3`
- Tailwind CSS `^3.4.15`
- Framer Motion `^11.11.17`
- Recharts `^2.13.3`
- Sonner `^1.7.1`
- Lucide React `^0.462.0`

Backend:

- Python 3.12 recommended
- FastAPI `0.115.5`
- Uvicorn `0.32.1`
- SQLAlchemy `2.0.36`
- psycopg `3.2.3`
- python-jose `3.3.0`
- passlib bcrypt `1.7.4`
- pydantic-settings `2.6.1`
- slowapi `0.1.9`

Database:

- PostgreSQL, preferably Neon PostgreSQL because the sample `DATABASE_URL` uses a Neon host with `sslmode=require`.

Deployment files detected:

- `railway.json`
- `server/Dockerfile`
- `client/Dockerfile`
- `docker-compose.yml`

You said you do not have Docker, so this documentation treats Docker as optional/legacy and gives normal local setup as the primary path.

## Full Folder Structure

```text
.
|-- .env.example
|-- .gitignore
|-- DOC.md
|-- README.md
|-- database/
|   `-- schema.sql
|-- docker-compose.yml
|-- docs/
|   `-- api.md
|-- railway.json
|-- client/
|   |-- Dockerfile
|   |-- app/
|   |   |-- (auth)/
|   |   |   `-- login/
|   |   |       `-- page.tsx
|   |   |-- (dashboard)/
|   |   |   `-- dashboard/
|   |   |       `-- page.tsx
|   |   |-- globals.css
|   |   |-- layout.tsx
|   |   `-- page.tsx
|   |-- components/
|   |   `-- charts/
|   |       `-- TrafficChart.tsx
|   |-- lib/
|   |   `-- api.ts
|   |-- middleware.ts
|   |-- next-env.d.ts
|   |-- next.config.ts
|   |-- package.json
|   |-- postcss.config.js
|   |-- tailwind.config.ts
|   `-- tsconfig.json
|-- server/
|   |-- Dockerfile
|   |-- requirements.txt
|   |-- seed.py
|   `-- app/
|       |-- main.py
|       |-- api/
|       |   `-- v1/
|       |       |-- router.py
|       |       `-- endpoints/
|       |           |-- analytics.py
|       |           |-- auth.py
|       |           `-- logs.py
|       |-- core/
|       |   |-- config.py
|       |   |-- deps.py
|       |   |-- rate_limit.py
|       |   `-- security.py
|       |-- db/
|       |   `-- session.py
|       |-- models/
|       |   |-- __init__.py
|       |   |-- audit.py
|       |   |-- log_upload.py
|       |   `-- user.py
|       |-- schemas/
|       |   |-- analytics.py
|       |   `-- auth.py
|       `-- services/
|           `-- mapreduce.py
`-- worker/
    `-- README.md
```

### Important Folders And Files

`client/`

- The browser application.
- Uses Next.js App Router.
- Contains all UI screens and chart components.

`client/app/(auth)/login/page.tsx`

- Login page.
- Renders empty email and password fields.
- Calls `api('/auth/login')`.
- Stores `access_token` in `localStorage` under the key `token`.

`client/app/(dashboard)/dashboard/page.tsx`

- Dashboard page.
- Fetches analytics from `GET /analytics/dashboard`.
- Uploads files to `POST /logs/upload`.
- Shows metric cards and hourly traffic chart.

`client/lib/api.ts`

- Shared API wrapper.
- Reads `NEXT_PUBLIC_API_BASE_URL`.
- Adds `Authorization: Bearer <token>` if a token exists in browser `localStorage`.
- Throws an error when the response status is not OK.

`server/`

- FastAPI backend.
- Owns API routing, authentication, database access, and MapReduce processing.

`server/app/main.py`

- Application entrypoint.
- Creates database tables with `Base.metadata.create_all(bind=engine)`.
- Adds CORS middleware.
- Adds SlowAPI middleware.
- Mounts API routes under `/api/v1`.

`server/app/core/config.py`

- Reads environment variables using `pydantic-settings`.
- Default env file path is `../.env`, relative to the process working directory.
- In local development, start the backend from the `server/` directory with the root `.env` copied into place or export env variables in the shell.

`server/app/core/security.py`

- Handles password hashing, password verification, and JWT creation.

`server/app/core/deps.py`

- Defines the `get_current_user` dependency.
- Decodes the JWT and fetches the matching database user.

`server/app/services/mapreduce.py`

- Splits uploaded log content into chunks.
- Uses process-based parallelism.
- Parses each line with this pattern:

```python
r"\[(\d{2}):\d{2}:\d{2}\].*\s(\d{3})\s"
```

Expected matching log lines must contain a timestamp like `[13:45:20]` and later a three-digit HTTP status code surrounded by whitespace.

`database/schema.sql`

- Manual SQL bootstrap schema.
- Matches the SQLAlchemy models closely.
- Useful for manually creating tables in PostgreSQL.

`server/seed.py`

- Creates the default admin user if it does not already exist.
- Default credentials:

```text
Email: admin@cloudlog.com
Password: Admin@123
```

Change this password before using the project outside local development.

`worker/README.md`

- Notes that MapReduce currently runs inside the API process.
- Recommends isolating it as a separate worker for horizontal scaling.

`docker-compose.yml`, `server/Dockerfile`, `client/Dockerfile`

- Docker deployment artifacts exist, but Docker is not required for local development.
- Because you said Docker is unavailable, use the non-Docker commands in this document.

## Requirements

### Required Software

Install these locally:

- Git
- Python 3.12 recommended
- Node.js 20 recommended
- npm
- PostgreSQL database, either:
  - Neon PostgreSQL cloud database, recommended by the current `.env.example`, or
  - Local PostgreSQL 14+.

### Python Version

The backend Dockerfile uses `python:3.12-slim`, so Python 3.12 is the safest local version.

Python 3.11 will likely work with the current dependencies, but Python 3.12 best matches the project configuration.

### Node Version

The client Dockerfile uses `node:20-alpine`, so Node.js 20 is recommended.

Next.js 15 also expects a modern Node runtime. Use Node 20 LTS for fewer compatibility surprises.

### Database Requirements

The backend expects a PostgreSQL connection string in SQLAlchemy psycopg format:

```text
postgresql+psycopg://USER:PASSWORD@HOST:PORT/DATABASE
```

For Neon, include SSL:

```text
postgresql+psycopg://USER:PASSWORD@HOST/DATABASE?sslmode=require
```

### OS Compatibility

The project should run on:

- Linux
- macOS
- Windows with WSL2 recommended

Because the backend uses `ProcessPoolExecutor`, WSL2 or Linux/macOS is preferable for local development.

### Environment Dependencies

The backend requires:

- `DATABASE_URL`
- `JWT_SECRET`
- `JWT_ALGORITHM`
- `ACCESS_TOKEN_EXPIRE_MINUTES`
- `CORS_ORIGINS`
- `RATE_LIMIT_PER_MINUTE`

The frontend requires:

- `NEXT_PUBLIC_API_BASE_URL`

## Environment Setup

The repository already includes `.env.example`.

Create a real `.env` in the repository root:

```bash
cp .env.example .env
```

### Environment Variables

`JWT_SECRET`

- Secret key used to sign JWT access tokens.
- Must be changed in every non-local environment.
- Use a long random value.

Example:

```text
JWT_SECRET=replace_with_64_random_characters
```

`JWT_ALGORITHM`

- JWT signing algorithm.
- Current code defaults to `HS256`.
- Keep `HS256` unless you intentionally change the security implementation.

```text
JWT_ALGORITHM=HS256
```

`ACCESS_TOKEN_EXPIRE_MINUTES`

- Number of minutes before access tokens expire.
- Current example uses `120`.

```text
ACCESS_TOKEN_EXPIRE_MINUTES=120
```

`BACKEND_PORT`

- Documented in `.env.example`, but the current backend startup command does not automatically read it.
- Use it as a convention when starting Uvicorn manually.

```bash
uvicorn app.main:app --reload --port 8000
```

`DATABASE_URL`

- SQLAlchemy database connection string.
- Required at backend import time because `settings = Settings()` loads config immediately.

Neon example:

```text
DATABASE_URL=postgresql+psycopg://neon_user:password@ep-xxxxx.us-east-2.aws.neon.tech/neondb?sslmode=require
```

Local PostgreSQL example:

```text
DATABASE_URL=postgresql+psycopg://postgres:postgres@localhost:5432/cloud_log_analyzer
```

`CORS_ORIGINS`

- Comma-separated list of browser origins allowed to call the API.
- For local frontend development:

```text
CORS_ORIGINS=http://localhost:3000
```

- For production, include the deployed frontend domain:

```text
CORS_ORIGINS=https://your-frontend-domain.com
```

`RATE_LIMIT_PER_MINUTE`

- Intended global rate-limit configuration.
- Current code loads this value but only hard-codes `20/minute` on the upload endpoint.
- Recommendation: wire this variable into endpoint decorators or central rate-limit config.

`NEXT_PUBLIC_API_BASE_URL`

- Browser-visible API base URL.
- Must include `/api/v1` because frontend calls paths like `/auth/login`.

Local:

```text
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000/api/v1
```

Production:

```text
NEXT_PUBLIC_API_BASE_URL=https://your-api-domain.com/api/v1
```

### Required API Keys Or Services

No third-party API keys are required.

Required external service:

- PostgreSQL database.

Recommended cloud database:

- Neon PostgreSQL.

## Installation Guide

This is the recommended setup because you said Docker is not available.

### 1. Clone Repository

```bash
git clone <repo-url>
cd cloud_computing
```

Why this is needed: it downloads the frontend, backend, SQL schema, and configuration files.

### 2. Configure Environment Variables

```bash
cp .env.example .env
```

Edit `.env` and set:

```text
JWT_SECRET=<strong-random-secret>
DATABASE_URL=<your-postgresql-url>
CORS_ORIGINS=http://localhost:3000
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000/api/v1
```

Why this is needed: the backend cannot start without `DATABASE_URL` and `JWT_SECRET`.

### 3. Create Or Prepare Database

Option A: Neon PostgreSQL

1. Create a Neon project.
2. Copy the connection string.
3. Make sure it includes `sslmode=require`.
4. Paste it into `.env` as `DATABASE_URL`.

Option B: Local PostgreSQL

Create the database:

```bash
createdb cloud_log_analyzer
```

Use this connection string:

```text
DATABASE_URL=postgresql+psycopg://postgres:postgres@localhost:5432/cloud_log_analyzer
```

Why this is needed: uploaded log summaries and users are persisted in PostgreSQL.

### 4. Install Backend Dependencies

```bash
cd server
python3.12 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

If `python3.12` is not available, try:

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

Important issue found: `server/app/schemas/auth.py` imports `EmailStr`. Pydantic usually requires the extra package `email-validator` for `EmailStr`. If backend startup fails with an email validator error, install it:

```bash
pip install email-validator
```

Recommended permanent fix:

```text
email-validator==2.2.0
```

Add that line to `server/requirements.txt`.

### 5. Make Environment Available To Backend

The backend config uses:

```python
env_file = "../.env"
```

When running from `server/`, this points to the repository root `.env`, so start backend commands from the `server/` folder.

Alternative:

```bash
export DATABASE_URL="postgresql+psycopg://..."
export JWT_SECRET="..."
```

### 6. Setup Database Tables

The application automatically creates tables on startup:

```python
Base.metadata.create_all(bind=engine)
```

So normally you only need to start the backend once.

Manual option:

```bash
psql "$DATABASE_URL" -f database/schema.sql
```

Run the manual command from the repository root if you prefer SQL-controlled setup.

### 7. Seed Default Admin User

From the `server/` directory with the virtual environment active:

```bash
python seed.py
```

This creates:

```text
admin@cloudlog.com / Admin@123
```

Why this is needed: the app has no registration endpoint. Without seeding, you cannot log in.

Production warning: change the default password immediately or create a new admin with a strong password.

### 8. Start Backend

From `server/`:

```bash
source .venv/bin/activate
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Verify backend:

```bash
curl http://localhost:8000/docs
```

OpenAPI docs should load in the browser at:

```text
http://localhost:8000/docs
```

### 9. Install Frontend Dependencies

Open a second terminal:

```bash
cd client
npm install
```

Why this is needed: installs Next.js, React, Tailwind, charting, animation, and UI helper packages.

Important issue found: there is no `package-lock.json` currently committed. After `npm install`, npm will create one. Commit it if this is a real project so builds are reproducible.

### 10. Start Frontend

From `client/`:

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

The app redirects to:

```text
http://localhost:3000/login
```

### 11. Verify Project Works

1. Start PostgreSQL or confirm Neon is reachable.
2. Start backend on port `8000`.
3. Start frontend on port `3000`.
4. Visit `http://localhost:3000/login`.
5. Login with seeded credentials.
6. Upload a `.log` file.
7. Confirm dashboard cards update.
8. Confirm new rows exist in `log_uploads` and `audit_logs`.

Example log line format that matches the parser:

```text
[13:45:20] GET /api/users 200 OK
[13:46:10] GET /missing 404 Not Found
[14:01:02] POST /api/upload 500 Error
```

The parser requires:

- A timestamp wrapped in square brackets.
- The hour as two digits.
- A three-digit HTTP status code later in the line.
- Whitespace around the status code.

## Docker Setup

You said you do not have Docker. Docker is not required to run this project locally.

The repository does contain Docker files:

- `server/Dockerfile`
- `client/Dockerfile`
- `docker-compose.yml`

Treat these as optional deployment artifacts or legacy convenience files.

### Non-Docker Local Setup

Use these instead:

Backend:

```bash
cd server
source .venv/bin/activate
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Frontend:

```bash
cd client
npm run dev
```

### If Docker Is Available In The Future

The existing compose file defines two services:

- `server` on port `8000`
- `client` on port `3000`

Command:

```bash
docker compose up --build
```

However, the compose file does not define a database container. It still requires `DATABASE_URL` to point to Neon or another PostgreSQL instance.

### Production Container Deployment

The Dockerfiles are minimal and can build separate frontend/backend containers. Before production container deployment, improve them by:

- Adding health checks.
- Using lockfiles for deterministic installs.
- Running as non-root users.
- Setting explicit environment variables in the hosting platform.
- Avoiding default admin credentials.

## Database Documentation

### Database Type

PostgreSQL.

The schema uses:

- `SERIAL` primary keys in `database/schema.sql`.
- SQLAlchemy integer primary keys in models.
- JSON/JSONB-compatible summary storage.

### Schema Overview

`users`

Stores admin accounts.

```sql
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL
);
```

Columns:

- `id`: user primary key.
- `email`: unique login email.
- `password_hash`: bcrypt password hash.

`log_uploads`

Stores uploaded filename, uploader, timestamp, and computed summary.

```sql
CREATE TABLE IF NOT EXISTS log_uploads (
  id SERIAL PRIMARY KEY,
  filename VARCHAR(255) NOT NULL,
  uploaded_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  summary JSONB NOT NULL
);
```

Columns:

- `id`: upload primary key.
- `filename`: original uploaded file name.
- `uploaded_by`: foreign key to `users.id`.
- `created_at`: upload time.
- `summary`: MapReduce result.

Example `summary`:

```json
{
  "total_requests": 1234,
  "http_404": 42,
  "http_500": 7,
  "hourly_traffic": {
    "00": 12,
    "01": 21,
    "13": 200
  }
}
```

`audit_logs`

Stores simple security/admin activity history.

```sql
CREATE TABLE IF NOT EXISTS audit_logs (
  id SERIAL PRIMARY KEY,
  actor_email VARCHAR(255) NOT NULL,
  action VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

Columns:

- `id`: audit primary key.
- `actor_email`: email of the acting user.
- `action`: plain-text event description.
- `created_at`: event time.

### Relationships

- `users.id` -> `log_uploads.uploaded_by`
- `audit_logs.actor_email` stores email text only and does not enforce a foreign key.

### Migration System

No migration framework is installed.

Current behavior:

- `server/app/main.py` calls `Base.metadata.create_all(bind=engine)`.
- Missing tables are created automatically.
- Existing columns are not altered automatically.

Recommendation:

- Add Alembic for production migrations.
- Stop relying on `create_all` for schema changes after the first release.
- Keep `database/schema.sql` updated as bootstrap documentation.

### Backup Instructions

For local PostgreSQL:

```bash
pg_dump "$DATABASE_URL" > backup.sql
```

Restore:

```bash
psql "$DATABASE_URL" < backup.sql
```

For Neon:

- Use Neon console backups/branches for managed backups.
- For manual export, use `pg_dump` with the Neon connection string.

## API Documentation

Base URL in local development:

```text
http://localhost:8000/api/v1
```

Authentication:

- `POST /auth/login` returns a JWT access token.
- Protected endpoints require:

```http
Authorization: Bearer <access_token>
```

### POST `/auth/login`

Authenticates an admin user.

Request:

```http
POST /api/v1/auth/login
Content-Type: application/json
```

```json
{
  "email": "admin@cloudlog.com",
  "password": "Admin@123"
}
```

Success response:

```json
{
  "access_token": "jwt-token-here",
  "token_type": "bearer"
}
```

Failure response:

```json
{
  "detail": "Invalid credentials"
}
```

Status codes:

- `200`: login succeeded.
- `401`: invalid email or password.
- `422`: invalid request body.

### POST `/logs/upload`

Uploads and analyzes a `.log` file.

Authentication:

- Required.

Rate limit:

- Hard-coded as `20/minute` in `server/app/api/v1/endpoints/logs.py`.

Request:

```http
POST /api/v1/logs/upload
Authorization: Bearer <access_token>
Content-Type: multipart/form-data
```

Form field:

- `file`: uploaded `.log` file.

Example:

```bash
curl -X POST http://localhost:8000/api/v1/logs/upload \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@sample.log"
```

Success response:

```json
{
  "upload_id": 1,
  "summary": {
    "total_requests": 3,
    "http_404": 1,
    "http_500": 1,
    "hourly_traffic": {
      "13": 2,
      "14": 1
    }
  }
}
```

Failure responses:

```json
{
  "detail": "Only .log files allowed"
}
```

```json
{
  "detail": "Invalid token"
}
```

```json
{
  "detail": "Rate limit exceeded"
}
```

Status codes:

- `200`: upload processed.
- `400`: non-`.log` file.
- `401`: missing or invalid token.
- `422`: malformed multipart request.
- `429`: upload rate limit exceeded.

### GET `/analytics/dashboard`

Returns recent uploads and recent audit events.

Authentication:

- Required.

Request:

```http
GET /api/v1/analytics/dashboard
Authorization: Bearer <access_token>
```

Example:

```bash
curl http://localhost:8000/api/v1/analytics/dashboard \
  -H "Authorization: Bearer $TOKEN"
```

Success response:

```json
{
  "uploads": [
    {
      "id": 1,
      "filename": "sample.log",
      "created_at": "2026-05-27T10:30:00",
      "summary": {
        "total_requests": 3,
        "http_404": 1,
        "http_500": 1,
        "hourly_traffic": {
          "13": 2,
          "14": 1
        }
      }
    }
  ],
  "audit": [
    {
      "id": 1,
      "action": "Uploaded sample.log",
      "actor_email": "admin@cloudlog.com",
      "created_at": "2026-05-27T10:30:00"
    }
  ]
}
```

Status codes:

- `200`: dashboard data returned.
- `401`: missing, invalid, or expired token.

### Error Handling

Current API error behavior:

- FastAPI validation errors return `422`.
- Invalid credentials return `401`.
- Invalid file extension returns `400`.
- Rate limit errors return `429`.
- Unexpected server/database errors return default `500`.

Recommendation:

- Add structured error response schemas.
- Add global exception logging.
- Return safer messages for production.

## Frontend Documentation

### Routing Structure

`/`

- Implemented in `client/app/page.tsx`.
- Immediately redirects to `/login`.

`/login`

- Implemented in `client/app/(auth)/login/page.tsx`.
- Renders login form.
- Saves JWT token to `localStorage`.

`/dashboard`

- Implemented in `client/app/(dashboard)/dashboard/page.tsx`.
- Fetches dashboard analytics.
- Uploads `.log` files.
- Displays latest upload metrics.

### State Management

There is no global state library.

Current state is local React component state:

- Login page keeps `email` and `password`.
- Dashboard keeps `data` and selected `file`.
- JWT token is persisted in `localStorage`.

### UI Architecture

- Tailwind CSS utility classes are used directly in components.
- Global base styles live in `client/app/globals.css`.
- The `.glass` utility class is custom CSS for translucent panels.
- Recharts handles chart rendering.
- Sonner handles toast notifications.
- Framer Motion animates the login form.

### Build System

Development:

```bash
npm run dev
```

Production build:

```bash
npm run build
```

Production start:

```bash
npm run start
```

Lint:

```bash
npm run lint
```

Important issue found: with Next.js 15, `next lint` may not be available in the same way as older Next versions. If `npm run lint` fails, add an explicit ESLint setup or replace it with the supported Next.js lint workflow for the installed version.

## Backend Documentation

### Server Structure

```text
server/app/
|-- main.py
|-- api/v1/
|   |-- router.py
|   `-- endpoints/
|-- core/
|-- db/
|-- models/
|-- schemas/
`-- services/
```

### Services And Modules

`core/config.py`

- Loads environment settings.
- Converts `CORS_ORIGINS` from comma-separated text into a list.

`core/security.py`

- Hashes passwords.
- Verifies passwords.
- Creates JWT access tokens.

`core/deps.py`

- Validates bearer tokens.
- Resolves the current user from the database.

`core/rate_limit.py`

- Configures SlowAPI.
- Returns custom JSON for rate-limit errors.

`db/session.py`

- Creates SQLAlchemy engine.
- Creates session factory.
- Provides `get_db()` dependency.

`services/mapreduce.py`

- Runs CPU-bound log processing in multiple processes.

### Authentication Flow

1. User submits email/password to `POST /api/v1/auth/login`.
2. Backend queries `users` by email.
3. Backend verifies password with bcrypt.
4. Backend creates JWT with:
   - `sub`: user id as string
   - `exp`: expiration timestamp
5. Frontend stores the token in `localStorage`.
6. Frontend sends `Authorization: Bearer <token>` on future API calls.
7. Backend decodes token and fetches user in `get_current_user`.

### Middleware

Backend middleware:

- CORS middleware from FastAPI.
- SlowAPI middleware for rate limiting.

Frontend middleware:

- `client/middleware.ts` currently passes all requests through.
- It does not enforce route protection.

Recommendation:

- Either remove the empty middleware or implement real dashboard protection.
- Because token is stored in `localStorage`, Next.js middleware cannot read it server-side. Prefer HTTP-only cookies if route protection should happen at middleware level.

### Background Jobs

No background queue is implemented.

The MapReduce job runs during the upload request. This means large files can make the HTTP request slow and consume API server CPU.

Recommendation:

- Move MapReduce work to a worker process for large uploads.
- Add a queue such as Redis Queue, Celery, Dramatiq, or a cloud queue.
- Store upload status such as `queued`, `processing`, `completed`, and `failed`.

## Authentication & Security

### Auth System

- Single admin-style login.
- No registration endpoint.
- Users are inserted by `server/seed.py`.
- JWT is used for API authentication.

### JWT

JWT payload currently includes:

```json
{
  "sub": "1",
  "exp": "expiration timestamp"
}
```

Signing:

- Secret: `JWT_SECRET`
- Algorithm: `JWT_ALGORITHM`, default `HS256`

### Sessions And Cookies

No server-side sessions are used.

No authentication cookies are used.

The frontend stores JWT in:

```text
localStorage["token"]
```

Security recommendation:

- For production, prefer short-lived access tokens in memory plus refresh tokens in HTTP-only, secure, same-site cookies.
- If keeping `localStorage`, enforce strong XSS protections and avoid rendering unsafe HTML.

### Roles And Permissions

No roles or permissions are implemented.

All authenticated users can:

- Upload logs.
- View dashboard data.

Recommendation:

- Add `role` column to `users`.
- Define roles such as `admin`, `analyst`, and `viewer`.
- Restrict upload and user management to admins/analysts.

### Security Practices Present

- Passwords are hashed.
- JWTs expire.
- Protected routes require bearer token.
- Upload endpoint checks `.log` extension.
- CORS origins are configurable.
- Rate limit exists on upload endpoint.
- `.env` files are ignored by Git.

### Security Gaps Found

- Default admin credentials are documented for local seeding and must be changed before deployment.
- No password rotation or user management workflow.
- JWT is stored in `localStorage`.
- Upload validation only checks filename extension, not size or MIME/content.
- No file size limit.
- No malware scanning.
- No request logging or security event alerting.
- No CSRF strategy, though bearer-token APIs are less exposed than cookie auth.
- No HTTPS enforcement in app config.
- No production secret validation.
- No lockout after repeated failed login attempts.
- No Alembic migrations.

## Deployment Guide

### Local Development

Use two terminals.

Terminal 1:

```bash
cd server
source .venv/bin/activate
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Terminal 2:

```bash
cd client
npm run dev
```

Browser:

```text
http://localhost:3000
```

### Staging

Recommended staging setup:

- Separate PostgreSQL database.
- Separate `JWT_SECRET`.
- Staging frontend URL in `CORS_ORIGINS`.
- Staging backend URL in `NEXT_PUBLIC_API_BASE_URL`.
- Seed a non-default admin password.

Example staging env:

```text
DATABASE_URL=postgresql+psycopg://...
JWT_SECRET=<staging-secret>
CORS_ORIGINS=https://staging-your-app.example.com
NEXT_PUBLIC_API_BASE_URL=https://staging-api-your-app.example.com/api/v1
```

### Production

Production requirements:

- Managed PostgreSQL with backups.
- Strong `JWT_SECRET`.
- HTTPS for frontend and backend.
- Production frontend origin in `CORS_ORIGINS`.
- No default admin password.
- Process manager for backend.
- Reverse proxy such as Nginx or Caddy.
- Logs and monitoring.

### VPS Deployment Without Docker

Recommended VPS layout:

```text
/opt/cloud-log-analyzer/
|-- client/
`-- server/
```

Backend steps:

```bash
cd /opt/cloud-log-analyzer/server
python3.12 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --host 127.0.0.1 --port 8000
```

Use `systemd` to keep backend running.

Example service:

```ini
[Unit]
Description=Secure Cloud Log Analyzer API
After=network.target

[Service]
WorkingDirectory=/opt/cloud-log-analyzer/server
EnvironmentFile=/opt/cloud-log-analyzer/.env
ExecStart=/opt/cloud-log-analyzer/server/.venv/bin/uvicorn app.main:app --host 127.0.0.1 --port 8000
Restart=always

[Install]
WantedBy=multi-user.target
```

Frontend steps:

```bash
cd /opt/cloud-log-analyzer/client
npm install
npm run build
npm run start -- -p 3000
```

For production, run the frontend with a process manager such as `systemd` or PM2.

Nginx should proxy:

- `/api/` or a backend subdomain to `127.0.0.1:8000`
- frontend domain to `127.0.0.1:3000`

### Docker Deployment

Docker files exist, but Docker is optional and not required. See the Docker section above.

### Cloud Deployment

Railway is implied by `railway.json` and README.

Recommended Railway setup:

- Create one service for `server/`.
- Create one service for `client/`.
- Add a PostgreSQL/Neon database.
- Set backend env variables on server service.
- Set `NEXT_PUBLIC_API_BASE_URL` on client service to the public server URL plus `/api/v1`.
- Set `CORS_ORIGINS` on server service to the public client URL.

Important: `railway.json` uses Dockerfile builder globally. In a monorepo, ensure each Railway service has the correct root directory:

- Server service root: `server`
- Client service root: `client`

## Build & Production

### Backend Production Command

From `server/`:

```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

For higher traffic, use Gunicorn with Uvicorn workers:

```bash
gunicorn app.main:app -k uvicorn.workers.UvicornWorker -w 2 -b 0.0.0.0:8000
```

Recommendation: add `gunicorn` to `server/requirements.txt` before using this command.

### Frontend Production Build

From `client/`:

```bash
npm install
npm run build
npm run start
```

### Environment Differences

Development:

- `NEXT_PUBLIC_API_BASE_URL=http://localhost:8000/api/v1`
- `CORS_ORIGINS=http://localhost:3000`
- Uvicorn reload enabled.
- Default admin may be acceptable only for quick local testing.

Production:

- Use deployed HTTPS URLs.
- Disable reload.
- Use strong secrets.
- Change admin credentials.
- Add backups and monitoring.

## Testing

### Current Testing Structure

No test files were found.

No frontend test framework is configured.

No backend test framework is configured.

### Manual Verification

Backend:

```bash
curl http://localhost:8000/docs
```

Login:

```bash
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@cloudlog.com","password":"Admin@123"}'
```

Upload:

```bash
TOKEN="<token-from-login>"
curl -X POST http://localhost:8000/api/v1/logs/upload \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@sample.log"
```

Dashboard:

```bash
curl http://localhost:8000/api/v1/analytics/dashboard \
  -H "Authorization: Bearer $TOKEN"
```

Frontend:

```bash
cd client
npm run build
```

### Recommended Backend Tests

Add `pytest` and FastAPI `TestClient` tests for:

- Login success.
- Login failure.
- JWT-protected endpoint without token.
- Upload rejects non-`.log` file.
- Upload processes valid sample log.
- Dashboard returns uploaded data.
- MapReduce parser handles 200, 404, 500, and malformed lines.

### Recommended Frontend Tests

Add one of:

- Playwright for end-to-end tests.
- React Testing Library for component tests.

Recommended E2E tests:

- Login redirects to dashboard.
- Invalid login shows toast.
- Upload button processes file.
- Dashboard metrics update.

### Coverage Commands

Not currently configured.

Recommended after adding pytest:

```bash
pip install pytest pytest-cov httpx
pytest --cov=app
```

Recommended after adding frontend tests:

```bash
npm test
```

## Troubleshooting

### Backend Fails With Missing `DATABASE_URL`

Symptom:

```text
pydantic validation error: database_url field required
```

Fix:

- Create `.env` in repository root.
- Start backend from `server/`.
- Confirm `.env` contains `DATABASE_URL`.

### Backend Fails With Missing `JWT_SECRET`

Symptom:

```text
pydantic validation error: jwt_secret field required
```

Fix:

```text
JWT_SECRET=your-long-random-secret
```

### `EmailStr` / Email Validator Error

Symptom:

```text
ImportError: email-validator is not installed
```

Fix:

```bash
cd server
source .venv/bin/activate
pip install email-validator
```

Recommended permanent fix:

```text
email-validator==2.2.0
```

Add it to `server/requirements.txt`.

### Login Always Fails

Causes:

- `python seed.py` was not run.
- Database URL points to a different database than expected.
- Password was changed.

Fix:

```bash
cd server
source .venv/bin/activate
python seed.py
```

Then use:

```text
admin@cloudlog.com / Admin@123
```

### Frontend Cannot Reach Backend

Symptom:

- Login toast says invalid credentials even when credentials are correct.
- Browser console shows failed network request.

Check:

```text
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000/api/v1
```

Also confirm backend is running:

```bash
curl http://localhost:8000/docs
```

### CORS Error In Browser

Symptom:

```text
Access to fetch ... has been blocked by CORS policy
```

Fix:

Set backend env:

```text
CORS_ORIGINS=http://localhost:3000
```

For multiple origins:

```text
CORS_ORIGINS=http://localhost:3000,https://your-production-site.com
```

Restart backend after changing env variables.

### Port 8000 Already In Use

Fix:

```bash
uvicorn app.main:app --reload --port 8001
```

Then update:

```text
NEXT_PUBLIC_API_BASE_URL=http://localhost:8001/api/v1
```

Restart frontend because `NEXT_PUBLIC_*` variables are read at build/dev startup.

### Port 3000 Already In Use

Fix:

```bash
cd client
npm run dev -- -p 3001
```

Then update backend:

```text
CORS_ORIGINS=http://localhost:3001
```

Restart backend.

### Upload Returns `Only .log files allowed`

Cause:

- Filename does not end in `.log`.

Fix:

- Rename the file with `.log`.
- Ensure the selected file is the intended log file.

### Upload Succeeds But Metrics Are Zero

Cause:

- Log lines do not match the parser regex.

Expected shape:

```text
[13:45:20] GET /path 200 OK
```

The code looks for:

- `[HH:MM:SS]`
- A three-digit status code later in the line.

Fix:

- Adjust log format.
- Or update `LOG_PATTERN` in `server/app/services/mapreduce.py` for your real log source.

### Database Connection Fails With Neon

Check:

- `sslmode=require` exists in the Neon URL.
- Username/password are correct.
- Database is not paused.
- IP/network restrictions allow your machine.

### `npm run lint` Fails

Cause:

- Current `package.json` uses `next lint`.
- Next.js 15 changed linting expectations.

Fix recommendation:

- Add ESLint config explicitly.
- Or update the lint command to the supported project lint setup.

### `npm install` Creates `package-lock.json`

This is expected because no lockfile currently exists.

Recommendation:

- Commit `client/package-lock.json` for reproducible builds.

### Build Fails Because React Is Release Candidate

The project uses:

```json
"react": "19.0.0-rc-66855b96-20241106"
```

If dependency conflicts appear:

- Use `npm install --legacy-peer-deps` as a temporary local workaround.
- Prefer upgrading to stable React/Next compatible versions when possible.

## Performance Notes

### Current Performance Profile

- MapReduce runs in the API request process.
- `ProcessPoolExecutor` can use multiple CPU cores.
- Uploaded file content is fully read into memory.
- Dashboard loads latest 20 uploads and latest 20 audit logs.
- No caching is implemented.

### Optimization Recommendations

- Add upload file size limits.
- Stream or chunk large files instead of reading full content into memory.
- Move MapReduce processing to a background worker for large files.
- Store processing status so users do not wait on long requests.
- Add database indexes:

```sql
CREATE INDEX IF NOT EXISTS idx_log_uploads_created_at ON log_uploads(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_log_uploads_uploaded_by ON log_uploads(uploaded_by);
```

- Add pagination for upload history and audit logs.
- Cache dashboard summary if many users read the same data.
- Consider object storage for raw uploaded files if they must be retained.

### Scaling Considerations

For small files and low traffic:

- Current architecture is enough.

For larger files or multiple users:

- Split API and worker.
- Add Redis or another queue.
- Add file storage such as S3-compatible storage.
- Use database migrations.
- Add observability.

## Developer Guide

### How To Contribute

Recommended workflow:

1. Create a feature branch.
2. Make a focused change.
3. Run backend and frontend locally.
4. Add tests for behavior changes.
5. Update docs when behavior changes.
6. Open a pull request.

### Coding Conventions

Backend:

- Keep route handlers in `server/app/api/v1/endpoints/`.
- Keep reusable business logic in `server/app/services/`.
- Keep environment config in `server/app/core/config.py`.
- Keep SQLAlchemy models in `server/app/models/`.
- Keep Pydantic request/response schemas in `server/app/schemas/`.

Frontend:

- Keep route pages under `client/app/`.
- Keep reusable components under `client/components/`.
- Keep API utilities under `client/lib/`.
- Prefer typed API responses instead of `any`.

### Git Workflow

Suggested branch naming:

```text
feature/upload-history
fix/jwt-expiration-handling
docs/setup-guide
```

Suggested commit style:

```text
feat: add upload history table
fix: validate log upload size
docs: document Neon setup
```

### Adding A New Backend Endpoint

1. Add schema in `server/app/schemas/`.
2. Add handler in `server/app/api/v1/endpoints/`.
3. Register router in `server/app/api/v1/router.py`.
4. Add database model or migration if needed.
5. Add tests.
6. Document endpoint in `DOC.md` and `docs/api.md`.

### Adding A New Frontend Page

1. Create route folder under `client/app/`.
2. Add `page.tsx`.
3. Add API call in `client/lib/api.ts` or a dedicated helper.
4. Add reusable UI under `client/components/`.
5. Test route in browser.

### Adding A New Database Table

Current project has no Alembic migration system.

Short-term local approach:

1. Add SQLAlchemy model in `server/app/models/`.
2. Import it in `server/app/models/__init__.py`.
3. Let `create_all` create it on startup.
4. Update `database/schema.sql`.

Production recommendation:

1. Add Alembic.
2. Generate migration.
3. Review migration.
4. Apply migration in staging.
5. Apply migration in production.

## Useful Commands

### Install

Backend:

```bash
cd server
python3.12 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

Frontend:

```bash
cd client
npm install
```

### Configure

```bash
cp .env.example .env
```

### Seed

```bash
cd server
source .venv/bin/activate
python seed.py
```

### Run

Backend:

```bash
cd server
source .venv/bin/activate
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Frontend:

```bash
cd client
npm run dev
```

### Build

Frontend:

```bash
cd client
npm run build
```

### Start Production Frontend

```bash
cd client
npm run start
```

### Test

No automated tests are configured.

Manual API docs:

```bash
curl http://localhost:8000/docs
```

### Lint

```bash
cd client
npm run lint
```

Note: this command may need project lint configuration updates for Next.js 15.

### Format

No formatter is configured.

Recommendations:

Frontend:

```bash
npm install --save-dev prettier
```

Backend:

```bash
pip install black ruff
```

### Deploy

Without Docker on VPS:

```bash
cd server
source .venv/bin/activate
uvicorn app.main:app --host 127.0.0.1 --port 8000
```

```bash
cd client
npm install
npm run build
npm run start
```

Railway:

- Create separate client and server services.
- Set service roots to `client` and `server`.
- Configure all env variables.

## Final Verification Checklist

Use this checklist before considering the project fully functional.

- [ ] `.env` exists in the repository root.
- [ ] `DATABASE_URL` points to a reachable PostgreSQL database.
- [ ] `JWT_SECRET` is set to a strong non-default value.
- [ ] `CORS_ORIGINS` includes the frontend URL.
- [ ] `NEXT_PUBLIC_API_BASE_URL` includes backend URL plus `/api/v1`.
- [ ] Backend dependencies install successfully.
- [ ] `email-validator` issue is resolved if encountered.
- [ ] Backend starts on port `8000`.
- [ ] `http://localhost:8000/docs` opens.
- [ ] Database tables exist.
- [ ] `python seed.py` creates the admin user.
- [ ] Frontend dependencies install successfully.
- [ ] Frontend starts on port `3000`.
- [ ] Login page opens.
- [ ] Admin login succeeds.
- [ ] Dashboard page loads.
- [ ] `.log` upload succeeds.
- [ ] Dashboard metric cards update.
- [ ] Hourly chart renders data.
- [ ] `log_uploads` table receives a row.
- [ ] `audit_logs` table receives a row.
- [ ] Default password is changed before any real deployment.
- [ ] Production frontend/backend URLs are configured.
- [ ] Backups are configured for production database.

## Missing Configs, Files, And Issues Found

These are project-specific findings from the repository inspection.

1. `server/requirements.txt` is missing `email-validator`, but `server/app/schemas/auth.py` uses `EmailStr`.
2. No automated tests are present.
3. No CI/CD workflow files are present.
4. No Alembic migration system is present.
5. No `client/package-lock.json` is committed.
6. Docker files exist, but local setup does not need Docker.
7. `RATE_LIMIT_PER_MINUTE` is loaded but not used by the upload endpoint, which hard-codes `20/minute`.
8. `client/middleware.ts` does not protect dashboard routes.
9. JWT is stored in `localStorage`.
10. Default admin credentials are documented for local seeding and must be changed before deployment.
11. Upload validation only checks `.log` extension.
12. No file size limit is enforced.
13. Raw uploaded files are not retained, only summaries are stored.
14. No background queue is implemented for long-running processing.
15. `docs/api.md` is very minimal compared with the actual API behavior.

## Architecture And Security Improvements

Recommended high-priority improvements:

- Add `email-validator` to backend requirements.
- Add Alembic migrations.
- Add backend tests for auth, upload, dashboard, and MapReduce.
- Add frontend build/test checks.
- Commit `package-lock.json`.
- Replace default admin credentials for production.
- Add upload file size limits.
- Add a real route protection strategy in the frontend.
- Move JWT storage to a safer auth design using HTTP-only cookies.
- Add role-based access control.
- Add structured logging.
- Add database indexes for dashboard queries.
- Move MapReduce to a worker queue for large files.
- Add CI with backend install/test and frontend install/build.

Recommended medium-priority improvements:

- Add pagination to dashboard data.
- Add user management endpoints.
- Add audit events for login success/failure.
- Add failed-login throttling.
- Add OpenAPI response models for all endpoints.
- Add health endpoint such as `GET /health`.
- Add deployment-specific environment validation.
- Add frontend logout button and token-expiry handling.
