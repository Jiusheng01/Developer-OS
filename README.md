# Developer OS

<p align="left">
  <a href="README.md"><u>中文</u></a> | <a href="README_EN.md"><u>English</u></a>
</p>

Developer OS 是一个个人开发者操作系统：它既是公开的个人开发者网站，也是自己每天使用的私人开发工作台。

## V3 架构

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

V3.0 保持公开站点由静态结构化数据驱动，同时为工作台业务数据补齐后端数据库迁移基础：

- 待办事项
- 学习项
- 笔记
- 目标和目标拆解任务

后端默认仍使用 SQLite，并通过 Alembic 管理 schema；需要时可通过 `DEVELOPER_OS_DATABASE_URL` 切换到本机 PostgreSQL。V3 暂不引入 Docker。V3.1 已加入 JWT 认证和公开注册；V3.2 已让 Dashboard 业务 API 按当前用户隔离；V3.3 已接入前端登录/注册体验。

API 模式下，前端会先显示登录/注册界面，登录成功后 Dashboard 请求会自动携带 Bearer token。本地存储模式仍使用浏览器本地口令。主题、语言和当前标签页仍然保存在浏览器本地。

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

运行数据库迁移：

```powershell
.\scripts\migrate-api-db.ps1
```

如果默认 SQLite 数据库是早期版本创建的，脚本会在检测到已有 Dashboard 表但缺少有效 Alembic 版本号时，先将旧 schema 标记为 V3.0 基线，再继续升级到当前版本。

在项目根目录运行：

```powershell
backend\.venv\Scripts\python.exe -m uvicorn app.main:app --app-dir backend --reload --host 127.0.0.1 --port 8000
```

健康检查：

```text
GET http://127.0.0.1:8000/api/v1/health
```

认证接口：

```text
GET  /api/v1/auth/registration-status
POST /api/v1/auth/register
POST /api/v1/auth/login
GET  /api/v1/auth/me
```

公开注册默认开启，可通过 `DEVELOPER_OS_PUBLIC_REGISTRATION_ENABLED=false` 关闭。JWT 密钥通过 `DEVELOPER_OS_JWT_SECRET_KEY` 配置。V3.2 后，待办事项、学习项、笔记、目标等业务 API 都需要 Bearer token。

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

运行数据库迁移：

```powershell
.\scripts\migrate-api-db.ps1
```

运行安全的后端接口增删改查冒烟检查。它会先注册或登录一个 smoke 用户，再为该用户创建待办事项、学习项、笔记、目标和目标拆解任务的临时检查数据，然后删除这些临时数据：

```powershell
.\scripts\smoke-api-crud.ps1
```

V3.3 后，前端 API 模式会在 `/dashboard` 自动进入登录/注册流程。注册成功后会自动登录；如果后端关闭公开注册，前端会隐藏注册入口并提示使用已有账号登录。

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

## V3.0 本地存储/后端接口冒烟检查清单

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

5. 打开 `http://127.0.0.1:3000/dashboard`，注册或登录一个账号。
6. 创建并编辑一个待办事项、学习项、笔记、目标和目标拆解任务。
7. 删除一个待办事项、学习项、笔记、目标和目标拆解任务。
8. 刷新浏览器，确认仍处于登录态，且剩余数据来自后端接口数据源。
9. 点击顶部退出登录，确认再次进入登录界面。

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
4. 未登录时确认登录界面显示 API 连接错误，而不是白屏。
5. 已有有效登录态时，确认工作台仍可打开，并显示非阻塞的数据错误。

### SQLite 重置

默认本地后端数据库是 `backend/developer_os.db`。当后端停止时，可以重置本地后端数据：

```powershell
.\scripts\reset-api-sqlite.ps1
```

## 质量检查

```powershell
backend\.venv\Scripts\python.exe -m compileall -q -x "backend[\\/](\.venv|\.pytest_cache)" backend
backend\.venv\Scripts\python.exe -m pytest backend
.\scripts\migrate-api-db.ps1 -DatabaseUrl "sqlite:///./backend/developer_os_migration_check.db"
Remove-Item -LiteralPath backend\developer_os_migration_check.db -Force -ErrorAction SilentlyContinue
npm run typecheck --prefix frontend
npm run lint --prefix frontend
npm run build --prefix frontend
```
