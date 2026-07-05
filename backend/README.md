# Developer OS Backend

FastAPI backend for Developer OS V3.

## Scope

V3 persists Dashboard business data with FastAPI, SQLAlchemy, SQLite by default, Alembic-managed migrations, JWT authentication, and user-scoped Dashboard APIs:

- Todo
- Learning items
- Notes
- Goals and goal tasks

Local passcode, theme, language, and active tab remain browser-local. PostgreSQL is supported through `DEVELOPER_OS_DATABASE_URL`. Docker is intentionally out of scope for V3. Frontend auth continues in V3.3.

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

Auth settings:

```text
DEVELOPER_OS_JWT_SECRET_KEY=developer-os-local-secret-change-me
DEVELOPER_OS_JWT_ALGORITHM=HS256
DEVELOPER_OS_JWT_ACCESS_TOKEN_EXPIRE_MINUTES=60
DEVELOPER_OS_PUBLIC_REGISTRATION_ENABLED=true
```

Use a strong `DEVELOPER_OS_JWT_SECRET_KEY` outside local development. Public registration is enabled by default in V3.1 and can be disabled without code changes.

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

The CRUD smoke registers or logs in a smoke user before calling protected Dashboard endpoints. Override the smoke account when needed:

```powershell
.\scripts\smoke-api-crud.ps1 -Email "smoke@example.com" -Username "smoke_user" -Password "smoke-password"
```

## Auth API

Registration status:

```text
GET /api/v1/auth/registration-status
```

Register:

```text
POST /api/v1/auth/register
{
  "email": "dev@example.com",
  "username": "devuser",
  "password": "strong-password",
  "displayName": "Developer"
}
```

Login:

```text
POST /api/v1/auth/login
{
  "identifier": "dev@example.com",
  "password": "strong-password"
}
```

Current user:

```text
GET /api/v1/auth/me
Authorization: Bearer <accessToken>
```

## Dashboard API Auth

Starting in V3.2, Dashboard business endpoints require:

```text
Authorization: Bearer <accessToken>
```

Protected resources:

```text
/api/v1/todos
/api/v1/learning-items
/api/v1/notes
/api/v1/goals
/api/v1/goals/{goalId}/tasks
```

Each list, create, update, and delete operation is scoped to the current token user. Cross-user access returns the same not-found contract as a missing resource.

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

The backend test suite covers health, auth registration/login/current-user behavior, migrations, Dashboard CRUD behavior, and cross-user isolation for Todo, Learning items, Notes, Goals, and nested goal tasks.

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
