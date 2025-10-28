# 贡献指南

感谢您对 Info Manager 项目感兴趣！

## 开发流程

### 1. 克隆仓库

```bash
git clone <repository-url>
cd info-manager
```

### 2. 设置开发环境

```bash
# 运行设置脚本
chmod +x setup.sh
./setup.sh
```

或手动设置：

**后端:**
```bash
cd info-manager-backend/backend
uv sync
source .venv/bin/activate
cp .env.example .env
# 编辑 .env 文件
alembic upgrade head
```

**前端:**
```bash
cd info-manager-front
npm install
cp .env.example .env
```

### 3. 代码规范

#### Python (后端)

- 使用 **Ruff** 进行代码格式化和检查
- 使用 **MyPy** 进行类型检查
- 遵循 PEP 8 规范
- 最大行长度: 88 字符

```bash
# 格式化代码
ruff format .

# 检查代码
ruff check .

# 类型检查
mypy .
```

#### TypeScript/Vue (前端)

- 使用 **Prettier** 进行代码格式化
- 使用 **ESLint** 进行代码检查
- 使用 TypeScript 严格模式
- 最大行长度: 100 字符

```bash
# 格式化代码
npm run format  # (需要添加到 package.json)

# 检查代码
npm run lint  # (需要添加到 package.json)
```

### 4. 提交规范

使用语义化提交信息:

```
<type>(<scope>): <subject>

<body>

<footer>
```

**类型 (type):**
- `feat`: 新功能
- `fix`: 错误修复
- `docs`: 文档更改
- `style`: 代码格式（不影响代码运行）
- `refactor`: 重构
- `test`: 测试相关
- `chore`: 构建过程或辅助工具的变动

**示例:**
```
feat(api): 添加用户导出功能

- 添加 CSV 导出端点
- 添加权限检查
- 添加单元测试

Closes #123
```

### 5. 测试

#### 后端测试

```bash
cd info-manager-backend/backend
source .venv/bin/activate
pytest app/tests -v
pytest --cov=app app/tests  # 带覆盖率
```

#### 前端测试

```bash
cd info-manager-front
npm run test  # (需要添加测试框架)
```

### 6. Pull Request 流程

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'feat: add amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 开启 Pull Request

**PR 检查清单:**
- [ ] 代码通过所有测试
- [ ] 代码符合规范 (Ruff/Prettier)
- [ ] 添加了必要的测试
- [ ] 更新了相关文档
- [ ] 提交信息遵循规范
- [ ] 没有合并冲突

### 7. 开发技巧

#### 使用 VS Code 工作区

```bash
code info-manager.code-workspace
```

#### 使用任务运行器

按 `Cmd+Shift+P` (macOS) 或 `Ctrl+Shift+P` (Windows/Linux)
选择 `Tasks: Run Task`

#### 调试

- 后端: 使用 "🐍 Backend: FastAPI" 启动配置
- 前端: 使用 "🎨 Frontend: Chrome" 启动配置
- 全栈: 使用 "🚀 Full Stack" 组合配置

### 8. 目录结构约定

#### 后端

```
backend/app/
├── api/
│   └── routes/        # API 路由
├── core/              # 核心配置
├── crud.py           # CRUD 操作
├── models.py         # 数据模型
├── tests/            # 测试文件
└── main.py           # 应用入口
```

#### 前端

```
src/
├── components/       # Vue 组件
├── views/           # 页面视图
├── router/          # 路由配置
├── store/           # 状态管理
├── api/             # API 调用
├── types/           # TypeScript 类型
└── utils/           # 工具函数
```

### 9. 常见问题

#### 后端问题

**数据库迁移失败:**
```bash
# 重置数据库
alembic downgrade base
alembic upgrade head
```

**导入错误:**
确保 PYTHONPATH 正确设置：
```bash
export PYTHONPATH="${PWD}/app:${PYTHONPATH}"
```

#### 前端问题

**依赖安装失败:**
```bash
rm -rf node_modules package-lock.json
npm install
```

### 10. 获取帮助

- 查看 [README.md](README.md)
- 查看 [后端文档](info-manager-backend/README.md)
- 提交 Issue
- 加入讨论

## 许可证

通过贡献，您同意您的贡献将按照与项目相同的许可证进行许可。
