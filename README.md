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