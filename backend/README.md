# Developer OS Backend

FastAPI backend for Developer OS V3/V4.

## Scope

V3 persists Dashboard business data with FastAPI, SQLAlchemy, SQLite by default, Alembic-managed migrations, JWT authentication, and user-scoped Dashboard APIs:

- Todo
- Learning items
- Notes
- Goals and goal tasks

The Dashboard uses the backend API for business data; theme, language, and active tab remain browser-local. PostgreSQL is supported through `DEVELOPER_OS_DATABASE_URL`. Docker is intentionally out of scope for V3. Frontend Dashboard access uses the login/register gate.

V4 starts the AI Learning Workspace direction with:

- AI Providers for OpenAI-compatible model configuration
- AI Planner for structured learning-plan draft generation
- Backend-owned LLM Provider boundary

The frontend never calls model APIs directly. API keys stay in backend persistence and are not returned by read endpoints.

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

For an existing local SQLite database created before Alembic, the migration runner detects Dashboard tables without a valid `alembic_version`, stamps the schema as the V3.0 baseline, and then upgrades to `head`. This preserves the local database file while bringing it under Alembic control.

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

## AI API

AI Provider endpoints:

```text
GET    /api/v1/ai/providers
POST   /api/v1/ai/providers
PATCH  /api/v1/ai/providers/{providerId}
POST   /api/v1/ai/providers/{providerId}/default
DELETE /api/v1/ai/providers/{providerId}
```

Create Provider:

```text
POST /api/v1/ai/providers
Authorization: Bearer <accessToken>
{
  "providerType": "openai_compatible",
  "displayName": "OpenAI Compatible",
  "baseUrl": "https://api.openai.com/v1",
  "apiKey": "<secret>",
  "model": "gpt-4.1-mini",
  "enabled": true
}
```

Read responses include `hasApiKey` and never include `apiKey`.

Planner endpoint:

```text
POST /api/v1/ai/planner/generate
Authorization: Bearer <accessToken>
{
  "target": "Become an AI application developer",
  "currentLevel": "Can build small Python apps",
  "deadline": "2026-12-31",
  "weeklyHours": 8,
  "preferredStack": ["FastAPI", "PostgreSQL", "RAG"],
  "constraints": "Keep the plan project-based."
}
```

The Planner returns a structured draft. It does not directly write into Todo, Learning, Notes, or Goals in this slice.

The default SQLite database path is:

```text
backend/developer_os.db
```

To reset local API data while the backend is stopped:

```powershell
.\scripts\reset-api-sqlite.ps1
```

## Frontend

Set these values in `frontend/.env.local`:

```text
NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8000/api/v1
```

`/dashboard` displays the frontend auth gate before loading Dashboard business data. Registration calls `POST /api/v1/auth/register` and then signs in with `POST /api/v1/auth/login`. After sign-in, Todo, Learning, Notes, Goals, and Goal Task requests automatically include:

```text
Authorization: Bearer <accessToken>
```

If `DEVELOPER_OS_PUBLIC_REGISTRATION_ENABLED=false`, the frontend hides the registration tab and asks the user to sign in with an existing account.

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

V3.0 keeps startup table creation as a local compatibility fallback while migrations are introduced. For clean PostgreSQL databases, run Alembic before starting the API.
