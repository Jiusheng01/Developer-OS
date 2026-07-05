# Developer OS

[English](README_EN.md)

Developer OS 是一个个人开发者操作系统：它既是公开的个人开发者网站，也是自己每天使用的私人开发工作台。

## V2 架构

```text
frontend/ 前端应用（Next.js App Router）
  -> 工作台状态管理
  -> 工作台数据提供层
  -> 浏览器本地存储数据源 或 API 数据源

backend/ 后端服务（FastAPI）
  -> 后端接口
  -> 工作台业务服务层
  -> 数据仓储协议
  -> SQLAlchemy 数据仓储实现
  -> SQLite 数据库
```

V2 版本保持公开站点由静态结构化数据驱动，同时只为工作台业务数据接入后端：

- 待办事项
- 学习项
- 笔记
- 目标和目标拆解任务

本地口令、主题、语言和当前标签页仍然保存在浏览器本地。JWT、PostgreSQL、Redis、Docker 和 AI 功能保留到后续版本。

## 前端

```powershell
npm install --prefix frontend
npm run dev --prefix frontend
```

默认使用浏览器本地存储。要切换到 FastAPI 后端，在 `frontend/.env.local` 中写入：

```text
NEXT_PUBLIC_DASHBOARD_DATA_PROVIDER=api
NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8000/api/v1
```

使用 `NEXT_PUBLIC_DASHBOARD_DATA_PROVIDER=local` 或删除该变量，即可回到浏览器本地存储模式。

## 后端

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -e ".[dev]"
```

在项目根目录运行：

```powershell
backend\.venv\Scripts\python.exe -m uvicorn app.main:app --app-dir backend --reload --host 127.0.0.1 --port 8000
```

健康检查：

```text
GET http://127.0.0.1:8000/api/v1/health
```

## 推荐开发脚本

以下命令都在项目根目录运行。这些是 Windows PowerShell 脚本，不会写入 `frontend/.env.local`；数据源模式只对脚本启动的开发服务进程生效。

启动 FastAPI 后端：

```powershell
.\scripts\dev-backend.ps1
```

以浏览器本地存储模式启动前端：

```powershell
.\scripts\dev-frontend-local.ps1
```

以后端接口联调模式启动前端：

```powershell
.\scripts\dev-frontend-api.ps1
```

检查后端健康状态：

```powershell
.\scripts\smoke-api-health.ps1
```

运行安全的后端接口增删改查冒烟检查。它会为待办事项、学习项、笔记、目标和目标拆解任务创建临时检查数据，然后删除这些临时数据：

```powershell
.\scripts\smoke-api-crud.ps1
```

重置本地 SQLite 后端数据库。该操作是显式且具有破坏性的：

```powershell
.\scripts\reset-api-sqlite.ps1
```

只有在你明确知道要删除 `backend/developer_os.db` 时才使用 `-Force`：

```powershell
.\scripts\reset-api-sqlite.ps1 -Force
```

如果 PowerShell 阻止执行本地脚本，可以使用：

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\dev-backend.ps1
```

在本地存储模式和 API 数据源模式之间切换时，需要停止并重启前端开发脚本。Next.js 会在开发服务启动时读取 `NEXT_PUBLIC_*` 变量。

如果前端脚本提示已经有另一个 Next.js 开发服务在运行，先停止现有前端服务再切换模式。如果确认没有 Node 开发服务在运行，可以删除过期的 `frontend\.next\dev\lock` 文件，然后重新启动脚本。

## V2.3 本地存储/后端接口冒烟检查清单

当修改工作台数据访问逻辑，或验证全新环境时，使用这份清单。

### 浏览器本地存储模式

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
4. 创建并编辑一个待办事项、学习项、笔记、目标和目标拆解任务。
5. 删除一个待办事项、学习项、笔记、目标和目标拆解任务。
6. 刷新浏览器，确认剩余数据仍然保存在浏览器本地存储中。

### 后端接口模式

1. 在仓库根目录启动后端：

   ```powershell
   .\scripts\dev-backend.ps1
   ```

2. 验证健康状态：

   ```powershell
   .\scripts\smoke-api-health.ps1
   ```

3. 不打开浏览器，先验证后端接口增删改查：

   ```powershell
   .\scripts\smoke-api-crud.ps1
   ```

4. 以后端接口模式启动或重启前端：

   ```powershell
   .\scripts\dev-frontend-api.ps1
   ```

5. 在 `/dashboard` 中创建并编辑一个待办事项、学习项、笔记、目标和目标拆解任务。
6. 删除一个待办事项、学习项、笔记、目标和目标拆解任务。
7. 刷新浏览器，确认剩余数据仍然来自后端接口数据源。

### 设置页数据检查

1. 打开设置页。
2. 确认数据源标识与启动模式一致：本地或 API。
3. 生成导出 JSON，并保存到安全位置。
4. 粘贴无效 JSON，确认当前工作区不会被覆盖。
5. 粘贴刚生成的导出 JSON，并执行导入。
6. 只有在完成导出检查后才使用重置工作台数据：
   - 本地模式会重置当前浏览器工作区。
   - 后端接口模式会重置后端管理的业务数据，并让当前浏览器回到首次设置状态。

### 后端接口失败模式

1. 保持前端配置为 `NEXT_PUBLIC_DASHBOARD_DATA_PROVIDER=api`。
2. 停止后端。
3. 打开 `/dashboard`。
4. 确认工作台仍然可用，并显示非阻塞的数据错误，而不是白屏。

### SQLite 重置

默认本地后端数据库是 `backend/developer_os.db`。当后端停止时，可以重置本地后端数据：

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
