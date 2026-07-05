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
  -> 后端 API 数据源
  -> 浏览器 UI 偏好存储

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

后端默认仍使用 SQLite，并通过 Alembic 管理 schema；需要时可通过 `DEVELOPER_OS_DATABASE_URL` 切换到本机 PostgreSQL。V3 暂不引入 Docker。V3.1 已加入 JWT 认证和公开注册；V3.2 已让 Dashboard 业务 API 按当前用户隔离；V3.3 已接入前端登录/注册体验；V3.4 已移除 Dashboard LocalStorage 业务数据模式。

Dashboard 现在固定使用后端 API。前端会先显示登录/注册界面，登录成功后 Dashboard 请求会自动携带 Bearer token。主题、语言和当前标签页仍然保存在浏览器本地；Todo、Learning、Notes、Goals 等业务数据只保存在后端账号数据中。

## 前端

```powershell
npm install --prefix frontend
npm run dev --prefix frontend
```

前端需要连接 FastAPI 后端。在 `frontend/.env.local` 中写入：

```text
NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8000/api/v1
```

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

以下命令都在项目根目录运行。这些是 Windows PowerShell 脚本，不会写入 `frontend/.env.local`。

启动 FastAPI 后端：

```powershell
.\scripts\dev-backend.ps1
```

启动前端：

```powershell
.\scripts\dev-frontend-api.ps1
```

运行数据库迁移：

```powershell
.\scripts\migrate-api-db.ps1
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

修改 `NEXT_PUBLIC_API_BASE_URL` 后，需要停止并重启前端开发脚本。Next.js 会在开发服务启动时读取 `NEXT_PUBLIC_*` 变量。

如果前端脚本提示已经有另一个 Next.js 开发服务在运行，先停止现有前端服务再切换模式。如果确认没有 Node 开发服务在运行，可以删除过期的 `frontend\.next\dev\lock` 文件，然后重新启动脚本。
