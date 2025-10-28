# Info Manager 工作区配置完成！

## 🎉 配置概览

您的工作区已经按照最佳实践完成配置，包含以下内容：

### 📁 文件结构

```
info-manager/
├── 📄 info-manager.code-workspace    # VS Code 多文件夹工作区配置
├── 📄 README.md                      # 项目主文档
├── 📄 CONTRIBUTING.md                # 贡献指南
├── 📄 TODO.md                        # 项目清单
├── 📄 .gitignore                     # Git 忽略文件
├── 📄 setup.sh                       # 自动化设置脚本
├── 📄 api-tests.http                 # API 测试文件
├── .vscode/
│   ├── settings.json                 # 编辑器设置
│   └── extensions.json               # 推荐扩展
├── info-manager-backend/             # FastAPI 后端
│   └── backend/
│       ├── .env.example              # 环境变量示例
│       ├── pyproject.toml            # Python 依赖
│       ├── alembic.ini               # 数据库迁移配置
│       └── app/                      # 应用代码
└── info-manager-front/               # Vue 3 前端
    ├── .env.example                  # 环境变量示例
    ├── .prettierrc                   # Prettier 配置
    ├── .eslintrc.cjs                 # ESLint 配置
    ├── package.json                  # Node 依赖
    └── src/                          # 应用代码
```

### 🔧 工作区功能

#### 1. 多文件夹工作区
- 🔧 根目录视图
- 🐍 后端专用视图
- 🎨 前端专用视图

#### 2. 编辑器配置
- ✅ 保存时自动格式化
- ✅ 自动修复代码问题
- ✅ 自动组织导入
- ✅ 统一的代码风格
- ✅ 智能文件排除

#### 3. 推荐扩展
**Python 开发:**
- Python
- Pylance
- Ruff

**前端开发:**
- Vue - Official (Volar)
- Prettier
- ESLint

**工具:**
- Docker
- GitLens
- REST Client
- SQLTools
- Error Lens

#### 4. 调试配置
- 🐍 **Backend: FastAPI** - 调试后端服务
- 🧪 **Backend: Pytest** - 调试测试
- 🎨 **Frontend: Chrome** - 调试前端
- 🚀 **Full Stack** - 同时调试前后端

#### 5. 任务配置
快捷键: `Cmd+Shift+P` → `Tasks: Run Task`

**后端任务:**
- 安装依赖
- 运行开发服务器
- 运行测试
- 数据库迁移

**前端任务:**
- 安装依赖
- 运行开发服务器
- 构建项目

**Docker 任务:**
- 启动所有服务
- 停止所有服务

**组合任务:**
- 🚀 启动全栈 (本地)

## 🚀 快速开始

### 方式 1: 使用自动化脚本（推荐）

```bash
./setup.sh
```

### 方式 2: 手动设置

**1. 打开工作区**
```bash
code info-manager.code-workspace
```

**2. 安装推荐扩展**
- VS Code 会自动提示安装推荐扩展
- 点击 "Install All" 安装所有推荐扩展

**3. 配置后端**
```bash
cd info-manager-backend/backend
uv sync
cp .env.example .env
# 编辑 .env 文件，设置数据库等配置
source .venv/bin/activate
alembic upgrade head
```

**4. 配置前端**
```bash
cd info-manager-front
npm install
cp .env.example .env
```

**5. 启动服务**

选择以下方式之一：

**使用 Docker (推荐):**
```bash
cd info-manager-backend
docker-compose up -d
```

**本地开发:**

终端 1 (后端):
```bash
cd info-manager-backend/backend
source .venv/bin/activate
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

终端 2 (前端):
```bash
cd info-manager-front
npm run dev
```

**使用 VS Code 任务:**
- 按 `Cmd+Shift+P`
- 选择 `Tasks: Run Task`
- 选择 `🚀 Start Full Stack (Local)`

## 📚 访问应用

- 🌐 **前端应用**: http://localhost:5173
- 🔌 **后端 API**: http://localhost:8000
- 📖 **API 文档**: http://localhost:8000/docs
- 📘 **API ReDoc**: http://localhost:8000/redoc

## 🛠️ 开发工具

### REST Client
使用 `api-tests.http` 文件测试 API：
1. 在 VS Code 中打开 `api-tests.http`
2. 点击请求上方的 "Send Request"
3. 查看响应

### 调试
1. 按 `F5` 或点击调试面板
2. 选择调试配置
3. 开始调试

### 任务运行器
1. `Cmd+Shift+P` → `Tasks: Run Task`
2. 选择要运行的任务

## 📖 下一步

1. **阅读文档**
   - [README.md](README.md) - 项目概览
   - [CONTRIBUTING.md](CONTRIBUTING.md) - 贡献指南
   - [TODO.md](TODO.md) - 项目清单

2. **配置环境变量**
   - 后端: `info-manager-backend/backend/.env`
   - 前端: `info-manager-front/.env`

3. **熟悉代码结构**
   - 浏览后端代码: `info-manager-backend/backend/app/`
   - 浏览前端代码: `info-manager-front/src/`

4. **开始开发**
   - 查看 TODO.md 了解待办事项
   - 选择一个功能开始实现
   - 编写测试
   - 提交代码

## 🎯 最佳实践

### 代码风格
- **Python**: 使用 Ruff 格式化，遵循 PEP 8
- **TypeScript/Vue**: 使用 Prettier 格式化

### 提交规范
使用语义化提交:
```
feat(api): 添加用户导出功能
fix(ui): 修复登录表单验证
docs: 更新 API 文档
```

### 测试
- 编写单元测试
- 运行测试: `pytest` (后端) / `npm test` (前端)
- 保持高测试覆盖率

### Git 工作流
1. 创建功能分支
2. 实现功能
3. 添加测试
4. 提交代码
5. 创建 Pull Request

## 💡 提示

- 使用 VS Code 的命令面板 (`Cmd+Shift+P`) 快速访问功能
- 利用工作区的多文件夹视图专注于前端或后端
- 使用调试器而不是 print/console.log
- 定期运行测试确保代码质量
- 查看 Error Lens 扩展显示的内联错误

## 🐛 问题排查

### 后端问题

**导入错误:**
```bash
export PYTHONPATH="${PWD}/app:${PYTHONPATH}"
```

**数据库连接失败:**
- 检查 PostgreSQL 是否运行
- 验证 `.env` 中的数据库配置

**迁移失败:**
```bash
alembic downgrade base
alembic upgrade head
```

### 前端问题

**依赖安装失败:**
```bash
rm -rf node_modules package-lock.json
npm install
```

**端口占用:**
```bash
lsof -ti:5173 | xargs kill -9
```

## 📞 获取帮助

- 查看项目文档
- 查看后端 README: `info-manager-backend/README.md`
- 提交 Issue
- 查看 TODO.md 了解项目进展

---

**祝您编码愉快！** 🚀
