# Developer OS Backend

FastAPI backend for Developer OS V3.

## Scope

V3.0 persists Dashboard business data with FastAPI, SQLAlchemy, SQLite by default, and Alembic-managed migrations:

- Todo
- Learning items
- Notes
- Goals and goal tasks

Local passcode, theme, language, and active tab remain browser-local. PostgreSQL is supported through `DEVELOPER_OS_DATABASE_URL`. Docker is intentionally out of scope for V3. JWT, user isolation, and frontend auth continue in V3.1-V3.3.

## Setup

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -e ".[dev]"
Copy-Item .env.example .env
```

The default database URL is:

```text
DEVELOPER_OS_DATABASE_URL=sqlite:///./backend/developer_os.db
```

To use a local PostgreSQL database, set:

```text
DEVELOPER_OS_DATABASE_URL=postgresql+psycopg://developer_os:developer_os@localhost:5432/developer_os
```

The PostgreSQL server and database/user are expected to exist locally; this project does not add Docker in V3.

## Run

From the repository root:

```powershell
.\scripts\dev-backend.ps1
```

Run database migrations:

```powershell
.\scripts\migrate-api-db.ps1
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
.\scripts\migrate-api-db.ps1 -DatabaseUrl "sqlite:///./backend/developer_os_migration_check.db"
Remove-Item -LiteralPath backend\developer_os_migration_check.db -Force -ErrorAction SilentlyContinue
npm run typecheck --prefix frontend
npm run lint --prefix frontend
npm run build --prefix frontend
```

The backend test suite covers health plus Dashboard CRUD behavior for Todo, Learning items, Notes, Goals, and nested goal tasks.

## Migrations

Alembic is the schema source of truth starting in V3.0.

Run migrations from the repository root:

```powershell
.\scripts\migrate-api-db.ps1
```

The script upgrades to `head` by default. To migrate to another revision:

```powershell
.\scripts\migrate-api-db.ps1 -Revision 20260705_0001
```

To validate migrations against a temporary SQLite database:

```powershell
.\scripts\migrate-api-db.ps1 -DatabaseUrl "sqlite:///./backend/developer_os_migration_check.db"
Remove-Item -LiteralPath backend\developer_os_migration_check.db -Force -ErrorAction SilentlyContinue
```

V3.0 keeps startup table creation as a local compatibility fallback while migrations are introduced. For clean PostgreSQL databases, run Alembic before starting the API.
