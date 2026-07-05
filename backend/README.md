# Developer OS Backend

FastAPI backend for Developer OS V2.

## Scope

V2 persists Dashboard business data with FastAPI, SQLAlchemy, and SQLite:

- Todo
- Learning items
- Notes
- Goals and goal tasks

Local passcode, theme, language, and active tab remain browser-local. JWT, PostgreSQL, Redis, Docker, and AI features are reserved for later versions.

## Setup

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -e ".[dev]"
Copy-Item .env.example .env
```

## Run

From the repository root:

```powershell
.\scripts\dev-backend.ps1
```

Health check:

```powershell
.\scripts\smoke-api-health.ps1
```

API CRUD smoke:

```powershell
.\scripts\smoke-api-crud.ps1
```

The default SQLite database path is:

```text
backend/developer_os.db
```

To reset local API data while the backend is stopped:

```powershell
.\scripts\reset-api-sqlite.ps1
```

## Frontend API Mode

Set these values in `frontend/.env.local`:

```text
NEXT_PUBLIC_DASHBOARD_DATA_PROVIDER=api
NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8000/api/v1
```

Use `NEXT_PUBLIC_DASHBOARD_DATA_PROVIDER=local` or omit the variable to keep the V1 LocalStorage mode.

## Validation

```powershell
backend\.venv\Scripts\python.exe -m compileall -q -x "backend[\\/](\.venv|\.pytest_cache)" backend
backend\.venv\Scripts\python.exe -m pytest backend
npm run typecheck --prefix frontend
npm run lint --prefix frontend
npm run build --prefix frontend
```

The backend test suite covers health plus Dashboard CRUD behavior for Todo, Learning items, Notes, Goals, and nested goal tasks.

## Migrations

The `alembic/` directory is reserved for the first migration-backed release. V2 initializes SQLite tables during local app startup so the app remains simple to run. When PostgreSQL is introduced, Alembic should become the schema source of truth.
