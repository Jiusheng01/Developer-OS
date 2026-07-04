# Developer OS

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

## V2.1 Local/API Smoke Runbook

Use this checklist when changing Dashboard data access or validating a fresh setup.

### LocalStorage mode

1. Ensure `frontend/.env.local` is missing or contains:

   ```text
   NEXT_PUBLIC_DASHBOARD_DATA_PROVIDER=local
   NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8000/api/v1
   ```

2. Start the frontend:

   ```powershell
   npm run dev --prefix frontend
   ```

3. Open `http://127.0.0.1:3000/dashboard`.
4. Create or edit one Todo, Learning item, Note, and Goal.
5. Refresh the browser and verify the records remain available from browser storage.

### API mode

1. Start the backend from the repository root:

   ```powershell
   backend\.venv\Scripts\python.exe -m uvicorn app.main:app --app-dir backend --reload --host 127.0.0.1 --port 8000
   ```

2. Verify health:

   ```powershell
   Invoke-RestMethod http://127.0.0.1:8000/api/v1/health
   ```

3. Set `frontend/.env.local`:

   ```text
   NEXT_PUBLIC_DASHBOARD_DATA_PROVIDER=api
   NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8000/api/v1
   ```

4. Restart the frontend dev server.
5. In `/dashboard`, create, update, delete, and refresh-check Todo, Learning, Notes, and Goals.

### API failure mode

1. Keep the frontend configured with `NEXT_PUBLIC_DASHBOARD_DATA_PROVIDER=api`.
2. Stop the backend.
3. Open `/dashboard`.
4. Verify the Dashboard remains usable and shows a non-blocking data error instead of a blank screen.

### SQLite reset

The default local API database is `backend/developer_os.db`. To reset local API data when the backend is stopped:

```powershell
Remove-Item -LiteralPath backend/developer_os.db -Force
```

## Quality Checks

```powershell
backend\.venv\Scripts\python.exe -m compileall -q -x "backend[\\/](\.venv|\.pytest_cache)" backend
backend\.venv\Scripts\python.exe -m pytest backend
npm run typecheck --prefix frontend
npm run lint --prefix frontend
npm run build --prefix frontend
```

## Git Hygiene

Do not commit local runtime metadata or generated data:

- `.agents/`
- `.codex/`
- `.trellis/`
- `AGENTS.md`
- `%SystemDrive%/`
- `backend/.venv/`
- SQLite database files
- build output and caches
