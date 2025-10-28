# Info Manager

这是一个全栈信息管理系统，包含 FastAPI 后端和 Vue 3 前端。

## 项目结构

```
info-manager/
├── info-manager-backend/    # FastAPI 后端
│   ├── backend/            # 后端应用代码
│   │   ├── app/           # FastAPI 应用
│   │   └── pyproject.toml # Python 依赖
│   └── docker-compose.yml # Docker 编排
└── info-manager-front/     # Vue 3 前端
    ├── src/               # 前端源代码
    └── package.json       # Node 依赖
```

## 技术栈

### 后端
- **FastAPI** - 现代化的 Python Web 框架
- **SQLModel** - SQL 数据库 ORM
- **PostgreSQL** - 数据库
- **Alembic** - 数据库迁移
- **Pydantic** - 数据验证
- **JWT** - 身份认证

### 前端
- **Vue 3** - 渐进式 JavaScript 框架
- **TypeScript** - 类型安全
- **Vite** - 构建工具

## 快速开始

### 前置要求

- Python 3.10+
- Node.js 18+
- PostgreSQL (或使用 Docker)
- uv (Python 包管理器)

### 后端设置

```bash
# 进入后端目录
cd info-manager-backend/backend

# 安装依赖
uv sync

# 激活虚拟环境
source .venv/bin/activate

# 设置环境变量 (创建 .env 文件)
# 参考后端 README.md

# 运行数据库迁移
alembic upgrade head

# 启动开发服务器
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

后端 API 文档: http://localhost:8000/docs

### 前端设置

```bash
# 进入前端目录
cd info-manager-front

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

前端应用: http://localhost:5173

### 使用 Docker (推荐)

```bash
cd info-manager-backend
docker-compose up -d
```

## VS Code 开发

### 推荐工作流

1. 在 VS Code 中打开工作区文件:
   ```bash
   code info-manager.code-workspace
   ```

2. 安装推荐的扩展（VS Code 会自动提示）

3. 使用任务运行器:
   - `Cmd+Shift+P` → `Tasks: Run Task`
   - 选择对应的任务

### 可用任务

- 🐍 Backend: Install Dependencies
- 🐍 Backend: Run Dev Server
- 🧪 Backend: Run Tests
- 🐍 Backend: Run Migrations
- 🎨 Frontend: Install Dependencies
- 🎨 Frontend: Run Dev Server
- 🎨 Frontend: Build
- 🐋 Docker: Start All Services
- 🐋 Docker: Stop All Services
- 🚀 Start Full Stack (Local)

### 调试

配置了以下调试启动项:
- 🐍 Backend: FastAPI - 调试后端
- 🧪 Backend: Pytest Current File - 调试测试
- 🎨 Frontend: Chrome - 调试前端
- 🚀 Full Stack - 同时调试前后端

## 开发指南

### 后端开发

```bash
# 运行测试
pytest app/tests -v

# 代码格式化
ruff format .

# 代码检查
ruff check .

# 类型检查
mypy .

# 创建数据库迁移
alembic revision --autogenerate -m "描述"
alembic upgrade head
```

### 前端开发

```bash
# 运行开发服务器
npm run dev

# 构建生产版本
npm run build

# 预览生产构建
npm run preview

# 类型检查
vue-tsc -b
```

## API 端点

- `GET /api/v1/` - API 根路径
- `GET /docs` - Swagger UI 文档
- `GET /redoc` - ReDoc 文档
- `POST /api/v1/login/access-token` - 登录
- `GET /api/v1/users/me` - 获取当前用户
- `GET /api/v1/items/` - 获取项目列表

更多详情请参考 [后端 README](info-manager-backend/README.md)

## 环境变量

### 后端 (.env)

```env
# PostgreSQL
POSTGRES_SERVER=localhost
POSTGRES_USER=postgres
POSTGRES_PASSWORD=changethis
POSTGRES_DB=app

# Security
SECRET_KEY=changethis123  # 使用: openssl rand -hex 32

# Email (可选)
SMTP_HOST=
SMTP_USER=
SMTP_PASSWORD=
EMAILS_FROM_EMAIL=

# 其他
PROJECT_NAME="Info Manager"
BACKEND_CORS_ORIGINS=["http://localhost:5173"]
```

## 部署

参考:
- [后端部署文档](info-manager-backend/deployment.md)
- [开发指南](info-manager-backend/development-zh.md)

## 许可证

参考 [LICENSE](info-manager-backend/LICENSE) 文件。

## 贡献

欢迎贡献！请遵循现有的代码风格和测试要求。

## 支持

如有问题，请参考:
- [后端 README](info-manager-backend/README.md)
- [前端 README](info-manager-front/README.md)
- [安全策略](info-manager-backend/SECURITY.md)
