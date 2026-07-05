# Developer OS

<p align="right">
  <a href="README.md"><kbd>中文</kbd></a>
  <a href="README_EN.md"><kbd>English</kbd></a>
</p>

Personal Developer OS: a public developer site plus a private daily workspace.

## V2 Architecture

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

V2 keeps the public site static-data driven and adds a backend only for Dashboard business data:

- Todo
- Learning items
- Notes
- Goals and goal tasks

Passcode, theme, locale, and active tab remain browser-local. JWT, PostgreSQL, Redis, Docker, and AI features are reserved for later versions.

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

Run from the repository root:

```powershell
backend\.venv\Scripts\python.exe -m uvicorn app.main:app --app-dir backend --reload --host 127.0.0.1 --port 8000
```

Health check:

```text
GET http://127.0.0.1:8000/api/v1/health
```

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

Run a safe API CRUD smoke. This creates temporary smoke records for Todo, Learning, Notes, Goals, and Goal Tasks, then deletes them:

```powershell
.\scripts\smoke-api-crud.ps1
```

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

## V2.3 Local/API Smoke Runbook

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

5. In `/dashboard`, create and edit one Todo, Learning item, Note, Goal, and Goal Task.
6. Delete one Todo, Learning item, Note, Goal, and Goal Task.
7. Refresh the browser and verify the remaining records are still available from the API provider.

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
4. Verify the Dashboard remains usable and shows a non-blocking data error instead of a blank screen.

### SQLite reset

The default local API database is `backend/developer_os.db`. To reset local API data when the backend is stopped:

```powershell
.\scripts\reset-api-sqlite.ps1
```

## Quality Checks

```powershell
backend\.venv\Scripts\python.exe -m compileall -q -x "backend[\\/](\.venv|\.pytest_cache)" backend
backend\.venv\Scripts\python.exe -m pytest backend
npm run typecheck --prefix frontend
npm run lint --prefix frontend
npm run build --prefix frontend
```
