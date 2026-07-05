# Developer OS

[English](#developer-os) | [中文](#中文版本)

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

---

# 中文版本

Developer OS 是一个个人开发者操作系统：既是公开的个人开发者网站，也是私人日常工作台。

## V2 架构

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

V2 保持公开站点由静态结构化数据驱动，同时只为 Dashboard 业务数据接入后端：

- Todo
- Learning items
- Notes
- Goals and goal tasks

Passcode、主题、语言和当前标签页仍然保存在浏览器本地。JWT、PostgreSQL、Redis、Docker 和 AI 功能保留到后续版本。

## 前端

```powershell
npm install --prefix frontend
npm run dev --prefix frontend
```

默认模式是 LocalStorage。要使用 FastAPI 后端，创建 `frontend/.env.local`：

```text
NEXT_PUBLIC_DASHBOARD_DATA_PROVIDER=api
NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8000/api/v1
```

使用 `NEXT_PUBLIC_DASHBOARD_DATA_PROVIDER=local` 或删除该变量即可回到 LocalStorage 模式。

## 后端

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -e ".[dev]"
```

在仓库根目录运行：

```powershell
backend\.venv\Scripts\python.exe -m uvicorn app.main:app --app-dir backend --reload --host 127.0.0.1 --port 8000
```

健康检查：

```text
GET http://127.0.0.1:8000/api/v1/health
```

## 推荐开发脚本

以下命令都在仓库根目录运行。这些是 Windows PowerShell 脚本，不会写入 `frontend/.env.local`；数据 Provider 模式只对脚本启动的 dev server 进程生效。

启动 FastAPI 后端：

```powershell
.\scripts\dev-backend.ps1
```

以 LocalStorage 模式启动前端：

```powershell
.\scripts\dev-frontend-local.ps1
```

以 API 模式启动前端：

```powershell
.\scripts\dev-frontend-api.ps1
```

检查后端健康状态：

```powershell
.\scripts\smoke-api-health.ps1
```

运行安全的 API CRUD smoke。它会为 Todo、Learning、Notes、Goals 和 Goal Tasks 创建临时 smoke 数据，然后删除这些临时数据：

```powershell
.\scripts\smoke-api-crud.ps1
```

重置本地 SQLite API 数据库。该操作是显式且具有破坏性的：

```powershell
.\scripts\reset-api-sqlite.ps1
```

只有在你明确知道要删除 `backend/developer_os.db` 时才使用 `-Force`：

```powershell
.\scripts\reset-api-sqlite.ps1 -Force
```

如果 PowerShell 阻止本地脚本执行，可以使用：

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\dev-backend.ps1
```

在 local 和 API Provider 模式之间切换时，需要停止并重启前端 dev 脚本。Next.js 会在 dev server 启动时读取 `NEXT_PUBLIC_*` 变量。

如果前端脚本提示已经有另一个 Next.js dev server 在运行，先停止现有前端服务再切换模式。如果确认没有 Node dev server 在运行，可以删除过期的 `frontend\.next\dev\lock` 文件，然后重新启动脚本。

## V2.3 Local/API Smoke 清单

当修改 Dashboard 数据访问逻辑或验证全新环境时，使用这份清单。

### LocalStorage 模式

1. 确认 `frontend/.env.local` 不存在，或包含：

   ```text
   NEXT_PUBLIC_DASHBOARD_DATA_PROVIDER=local
   NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8000/api/v1
   ```

2. 启动前端：

   ```powershell
   .\scripts\dev-frontend-local.ps1
   ```

3. 打开 `http://127.0.0.1:3000/dashboard`。
4. 创建并编辑一个 Todo、Learning item、Note、Goal 和 Goal Task。
5. 删除一个 Todo、Learning item、Note、Goal 和 Goal Task。
6. 刷新浏览器，确认剩余数据仍然保存在浏览器本地存储中。

### API 模式

1. 在仓库根目录启动后端：

   ```powershell
   .\scripts\dev-backend.ps1
   ```

2. 验证健康状态：

   ```powershell
   .\scripts\smoke-api-health.ps1
   ```

3. 不打开浏览器，先验证 API CRUD：

   ```powershell
   .\scripts\smoke-api-crud.ps1
   ```

4. 以 API 模式启动或重启前端：

   ```powershell
   .\scripts\dev-frontend-api.ps1
   ```

5. 在 `/dashboard` 中创建并编辑一个 Todo、Learning item、Note、Goal 和 Goal Task。
6. 删除一个 Todo、Learning item、Note、Goal 和 Goal Task。
7. 刷新浏览器，确认剩余数据仍然来自 API Provider。

### Settings 数据检查

1. 打开 Settings。
2. 确认 Provider badge 与启动模式一致：Local 或 API。
3. 生成导出 JSON，并保存到安全位置。
4. 粘贴无效 JSON，确认当前工作区不会被覆盖。
5. 粘贴刚生成的导出 JSON，并执行导入。
6. 只有在完成导出检查后才使用 Reset dashboard data：
   - Local 模式会重置当前浏览器工作区。
   - API 模式会重置 Provider 管理的业务数据，并让当前浏览器回到首次设置状态。

### API 失败模式

1. 保持前端配置为 `NEXT_PUBLIC_DASHBOARD_DATA_PROVIDER=api`。
2. 停止后端。
3. 打开 `/dashboard`。
4. 确认 Dashboard 仍然可用，并显示非阻塞的数据错误，而不是白屏。

### SQLite 重置

默认本地 API 数据库是 `backend/developer_os.db`。当后端停止时，可以重置本地 API 数据：

```powershell
.\scripts\reset-api-sqlite.ps1
```

## 质量检查

```powershell
backend\.venv\Scripts\python.exe -m compileall -q -x "backend[\\/](\.venv|\.pytest_cache)" backend
backend\.venv\Scripts\python.exe -m pytest backend
npm run typecheck --prefix frontend
npm run lint --prefix frontend
npm run build --prefix frontend
```

## Git 规范

不要提交本地运行元数据或生成数据：

- `.agents/`
- `.codex/`
- `.trellis/`
- `AGENTS.md`
- `%SystemDrive%/`
- `backend/.venv/`
- SQLite database files
- build output and caches
