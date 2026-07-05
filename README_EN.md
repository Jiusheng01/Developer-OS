# Developer OS

<p align="left">
  <a href="README.md"><u>中文</u></a> | <a href="README_EN.md"><u>English</u></a>
</p>

Personal Developer OS: a public developer site plus a private daily workspace.

## V3 Architecture

```text
frontend/ Next.js App Router
  -> Dashboard Store
  -> Dashboard Data Provider
  -> Backend API provider
  -> Browser UI preference storage

backend/ FastAPI
  -> API endpoints
  -> Dashboard service layer
  -> Repository protocols
  -> SQLAlchemy repository
  -> SQLite
```

V3.0 keeps the public site static-data driven and adds migration-backed database infrastructure for Dashboard business data:

- Todo
- Learning items
- Notes
- Goals and goal tasks

The backend still defaults to SQLite and now uses Alembic as the schema source of truth. Set `DEVELOPER_OS_DATABASE_URL` to switch to a local PostgreSQL database. V3 does not introduce Docker. V3.1 adds JWT auth and public registration; V3.2 scopes Dashboard business APIs to the current user; V3.3 adds the frontend login/register experience; V3.4 removes the Dashboard LocalStorage business-data mode.

The Dashboard now always uses the backend API. The frontend shows login/register before the Dashboard and automatically attaches the bearer token to business API requests. Theme, locale, and active tab remain browser-local; Todo, Learning, Notes, and Goals are stored only in the backend account data.

## Frontend

```powershell
npm install --prefix frontend
npm run dev --prefix frontend
```

The frontend expects the FastAPI backend. Create `frontend/.env.local`:

```text
NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8000/api/v1
```

## Backend

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -e ".[dev]"
```

Run database migrations:

```powershell
.\scripts\migrate-api-db.ps1
```

If the default SQLite database was created by an earlier version, the script detects existing Dashboard tables without a valid Alembic revision, stamps them as the V3.0 baseline, then upgrades to the current head.

Run from the repository root:

```powershell
backend\.venv\Scripts\python.exe -m uvicorn app.main:app --app-dir backend --reload --host 127.0.0.1 --port 8000
```

Health check:

```text
GET http://127.0.0.1:8000/api/v1/health
```

Auth endpoints:

```text
GET  /api/v1/auth/registration-status
POST /api/v1/auth/register
POST /api/v1/auth/login
GET  /api/v1/auth/me
```

Public registration is enabled by default and can be disabled with `DEVELOPER_OS_PUBLIC_REGISTRATION_ENABLED=false`. Configure the JWT signing secret with `DEVELOPER_OS_JWT_SECRET_KEY`. After V3.2, Todo, Learning, Notes, Goals, and Goal Task APIs require a bearer token.

## Recommended Development Scripts

Run these commands from the repository root. They are Windows PowerShell scripts and do not write `frontend/.env.local`.

Start the FastAPI backend:

```powershell
.\scripts\dev-backend.ps1
```

Start the frontend:

```powershell
.\scripts\dev-frontend-api.ps1
```

Run database migrations:

```powershell
.\scripts\migrate-api-db.ps1
```

After V3.3, frontend API mode automatically enters the login/register flow at `/dashboard`. Successful registration signs in immediately. If the backend disables public registration, the frontend hides the registration entry point and prompts you to use an existing account.

Reset the local SQLite API database. This is intentionally explicit and destructive:

```powershell
.\scripts\reset-api-sqlite.ps1
```

Use `-Force` only when you already know you want to delete `backend/developer_os.db`:

```powershell
.\scripts\reset-api-sqlite.ps1 -Force
```

If your shell blocks local scripts, run them with:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\dev-backend.ps1
```

After changing `NEXT_PUBLIC_API_BASE_URL`, stop and restart the frontend dev script. Next.js reads `NEXT_PUBLIC_*` variables when the dev server starts.

If a frontend script reports that another Next.js dev server may already be running, stop the existing frontend server before switching modes. If no Node dev server is running, remove the stale `frontend\.next\dev\lock` file and start the script again.
