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
  -> LocalStorage provider or API provider

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

The backend still defaults to SQLite and now uses Alembic as the schema source of truth. Set `DEVELOPER_OS_DATABASE_URL` to switch to a local PostgreSQL database. V3 does not introduce Docker. V3.1 adds JWT auth and public registration; V3.2 scopes Dashboard business APIs to the current user; V3.3 adds the frontend login/register experience.

In API mode, the frontend shows login/register before the Dashboard and automatically attaches the bearer token to business API requests. Local mode no longer uses a passcode gate and opens `/dashboard` directly. Theme, locale, and active tab remain browser-local.

## Frontend

```powershell
npm install --prefix frontend
npm run dev --prefix frontend
```

Default mode is LocalStorage. To use the FastAPI backend, create `frontend/.env.local`:

```text
NEXT_PUBLIC_DASHBOARD_DATA_PROVIDER=api
NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8000/api/v1
```

Use `NEXT_PUBLIC_DASHBOARD_DATA_PROVIDER=local` or remove the variable to return to LocalStorage mode.

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

Run these commands from the repository root. They are Windows PowerShell scripts and do not write `frontend/.env.local`; provider mode is set only for the dev server process they start.

Start the FastAPI backend:

```powershell
.\scripts\dev-backend.ps1
```

Start the frontend in localStorage mode:

```powershell
.\scripts\dev-frontend-local.ps1
```

Start the frontend in API mode:

```powershell
.\scripts\dev-frontend-api.ps1
```

Check backend health:

```powershell
.\scripts\smoke-api-health.ps1
```

Run database migrations:

```powershell
.\scripts\migrate-api-db.ps1
```

Run a safe API CRUD smoke. It registers or logs in a smoke user, creates temporary Todo, Learning, Notes, Goals, and Goal Task records for that user, then deletes them:

```powershell
.\scripts\smoke-api-crud.ps1
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

When switching between local and API provider mode, stop and restart the frontend dev script. Next.js reads `NEXT_PUBLIC_*` variables when the dev server starts.

If a frontend script reports that another Next.js dev server may already be running, stop the existing frontend server before switching modes. If no Node dev server is running, remove the stale `frontend\.next\dev\lock` file and start the script again.

## V3.0 Local/API Smoke Runbook

Use this checklist when changing Dashboard data access or validating a fresh setup.

### LocalStorage mode

1. Ensure `frontend/.env.local` is missing or contains:

   ```text
   NEXT_PUBLIC_DASHBOARD_DATA_PROVIDER=local
   NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8000/api/v1
   ```

2. Start the frontend:

   ```powershell
   .\scripts\dev-frontend-local.ps1
   ```

3. Open `http://127.0.0.1:3000/dashboard`.
4. Create and edit one Todo, Learning item, Note, Goal, and Goal Task.
5. Delete one Todo, Learning item, Note, Goal, and Goal Task.
6. Refresh the browser and verify the remaining records are still available from browser storage.

### API mode

1. Start the backend from the repository root:

   ```powershell
   .\scripts\dev-backend.ps1
   ```

2. Verify health:

   ```powershell
   .\scripts\smoke-api-health.ps1
   ```

3. Verify API CRUD behavior without a browser:

   ```powershell
   .\scripts\smoke-api-crud.ps1
   ```

4. Start or restart the frontend in API mode:

   ```powershell
   .\scripts\dev-frontend-api.ps1
   ```

5. Open `http://127.0.0.1:3000/dashboard`, then register or sign in.
6. Create and edit one Todo, Learning item, Note, Goal, and Goal Task.
7. Delete one Todo, Learning item, Note, Goal, and Goal Task.
8. Refresh the browser and verify you stay signed in and the remaining records still come from the API provider.
9. Click Sign out in the header and verify the login screen returns.

### Settings data checks

1. Open Settings.
2. Confirm the provider badge matches the mode you started: Local or API.
3. Generate an export JSON and copy it somewhere safe.
4. Paste invalid JSON and verify the current workspace is not overwritten.
5. Paste the generated export JSON and import it.
6. Use Reset dashboard data only after the export check:
   - Local mode resets this browser workspace.
   - API mode resets provider-backed business data and returns this browser to first-run setup.

### API failure mode

1. Keep the frontend configured with `NEXT_PUBLIC_DASHBOARD_DATA_PROVIDER=api`.
2. Stop the backend.
3. Open `/dashboard`.
4. When signed out, verify the login screen shows an API connection error instead of a blank screen.
5. With an existing valid session, verify the Dashboard can still open and shows a non-blocking data error.

### SQLite reset

The default local API database is `backend/developer_os.db`. To reset local API data when the backend is stopped:

```powershell
.\scripts\reset-api-sqlite.ps1
```

## Quality Checks

```powershell
backend\.venv\Scripts\python.exe -m compileall -q -x "backend[\\/](\.venv|\.pytest_cache)" backend
backend\.venv\Scripts\python.exe -m pytest backend
.\scripts\migrate-api-db.ps1 -DatabaseUrl "sqlite:///./backend/developer_os_migration_check.db"
Remove-Item -LiteralPath backend\developer_os_migration_check.db -Force -ErrorAction SilentlyContinue
npm run typecheck --prefix frontend
npm run lint --prefix frontend
npm run build --prefix frontend
```
