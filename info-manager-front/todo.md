# 信息管理系统前端开发计划

## 项目概述

基于 Vue 3 组合式 API 和 TDesign Vue UI 组件库，对接 FastAPI 后端，实现一个完整的信息管理系统。

## 后端 API 分析

根据 API 文档，系统包含以下主要模块：

### 1. 认证模块 (Authentication)

- `POST /api/v1/login/access-token` - 用户登录获取访问令牌
- `POST /api/v1/login/test-token` - 测试令牌有效性
- `POST /api/v1/password-recovery/{email}` - 密码恢复
- `POST /api/v1/reset-password/` - 重置密码

### 2. 用户管理模块 (Users)

- `POST /api/v1/users/signup` - 用户注册
- `GET /api/v1/users/` - 获取用户列表（需要管理员权限）
- `GET /api/v1/users/me` - 获取当前用户信息
- `PATCH /api/v1/users/me` - 更新当前用户信息
- `PATCH /api/v1/users/me/password` - 修改密码
- `DELETE /api/v1/users/me` - 删除当前用户账号

### 3. 信息条目管理模块 (Items)

- `GET /api/v1/items/` - 获取条目列表（分页）
- `POST /api/v1/items/` - 创建新条目
- `GET /api/v1/items/{id}` - 获取单个条目详情
- `PUT /api/v1/items/{id}` - 更新条目
- `DELETE /api/v1/items/{id}` - 删除条目

条目数据结构：

- title: 标题（必填，最多 255 字符）
- description: 描述（可选，最多 255 字符）
- context: 长文内容（可选，支持长文章）
- id: UUID
- owner_id: 所有者 ID

## 开发任务列表

### 第一阶段：项目基础搭建

- [x] 1. **安装依赖包**

  - [x] 安装 TDesign Vue: `npm install tdesign-vue-next`
  - [x] 安装 Vue Router: `npm install vue-router`
  - [x] 安装 Pinia 状态管理: `npm install pinia`
  - [x] 安装 Axios: `npm install axios`
  - [x] 安装 TypeScript 类型: `npm install @types/node -D`

- [x] 2. **配置项目基础结构**

  - [x] 配置 TDesign Vue 组件库
  - [x] 设置路由系统
  - [x] 配置状态管理（Pinia）
  - [x] 配置 Axios 请求拦截器
  - [x] 设置环境变量配置

### 第二阶段：核心功能开发

#### 2.1 认证系统

- [x] 3. **创建认证相关页面和组件**

  - [x] 登录页面 (`/login`)
  - [x] 注册页面 (`/signup`)
  - [x] 忘记密码页面 (`/forgot-password`)
  - [x] 重置密码页面 (`/reset-password`)
  - [x] 统一认证页面视觉与交互风格

- [x] 4. **实现认证逻辑**

  - [x] 创建 auth store（Pinia）
  - [x] 实现登录/登出功能
  - [x] Token 管理（localStorage）
  - [x] 路由守卫实现
  - [x] 自动刷新 Token 机制

#### 2.2 布局和导航

- [x] 5. **创建应用布局**

  - [x] 主布局组件（侧边栏、顶部导航栏）
  - [x] 用户信息下拉菜单
  - [x] 响应式设计适配
  - [x] 风格与认证页面保持一致

#### 2.3 用户管理

- [x] 6. **个人中心**

  - [x] 个人信息展示页面 (`/profile`)
  - [x] 个人信息编辑功能
  - [x] 修改密码功能
  - [x] 账号注销功能

- [x] 7. **用户管理（管理员功能）**
  - 用户列表页面 (`/admin/users`)
  - 用户详情查看
  - 用户管理操作

#### 2.4 信息条目管理（核心功能）

- [ ] 8. **条目列表页面** (`/items`)

  - 表格展示（使用 TDesign Table）
  - 分页功能
  - 搜索过滤
  - 排序功能
  - 批量操作

- [ ] 9. **条目创建/编辑**

  - 创建条目对话框/页面
  - 编辑条目功能
  - 富文本编辑器（for context 字段）
  - 表单验证

- [ ] 10. **条目详情页面** (`/items/:id`)
  - 详情展示
  - 快速编辑
  - 删除确认

### 第三阶段：优化和增强

- [ ] 11. **用户体验优化**

  - Loading 状态处理
  - 错误处理和提示
  - 空状态设计
  - 操作成功/失败反馈

- [ ] 12. **性能优化**

  - 路由懒加载
  - 组件按需加载
  - 请求缓存
  - 防抖和节流

- [ ] 13. **其他功能**
  - 深色模式支持
  - 国际化（中英文）
  - 数据导出功能
  - 快捷键支持

## 项目文件结构设计

```
src/
├── api/                    # API接口层
│   ├── auth.ts            # 认证相关接口
│   ├── user.ts            # 用户相关接口
│   ├── item.ts            # 条目相关接口
│   └── index.ts           # Axios实例配置
├── assets/                 # 静态资源
├── components/            # 公共组件
│   ├── common/            # 通用组件
│   └── business/          # 业务组件
├── layouts/               # 布局组件
│   ├── MainLayout.vue     # 主布局
│   └── AuthLayout.vue     # 认证页面布局
├── router/                # 路由配置
│   └── index.ts
├── stores/                # Pinia状态管理
│   ├── auth.ts           # 认证状态
│   ├── user.ts           # 用户状态
│   └── item.ts           # 条目状态
├── types/                 # TypeScript类型定义
│   ├── api.ts            # API响应类型
│   └── models.ts         # 数据模型类型
├── utils/                 # 工具函数
│   ├── request.ts        # 请求工具
│   └── storage.ts        # 本地存储工具
├── views/                 # 页面组件
│   ├── auth/             # 认证相关页面
│   │   ├── LoginView.vue
│   │   ├── SignupView.vue
│   │   └── ForgotPassword.vue
│   ├── user/             # 用户相关页面
│   │   ├── ProfileView.vue
│   │   └── UsersManagement.vue
│   └── item/             # 条目相关页面
│       ├── ItemList.vue
│       ├── ItemDetail.vue
│       └── ItemEdit.vue
├── App.vue
└── main.ts
```

## 技术栈说明

- **Vue 3**: 使用 Composition API（组合式 API）
- **TDesign Vue Next**: 腾讯企业级 UI 组件库
- **Vue Router**: 路由管理
- **Pinia**: 状态管理
- **Axios**: HTTP 请求库
- **TypeScript**: 类型安全
- **Vite**: 构建工具

## 开发规范

1. **组件命名**: 使用 PascalCase，如 `ItemList.vue`
2. **组合式 API**: 统一使用 `<script setup lang="ts">`
3. **类型定义**: 所有 API 响应和数据模型都要有 TypeScript 类型
4. **错误处理**: 统一的错误处理和用户提示
5. **代码风格**: 遵循 Vue 3 官方风格指南

## 优先级说明

1. **P0 - 必须完成**：认证系统、条目 CRUD 功能
2. **P1 - 重要功能**：用户个人中心、分页、搜索
3. **P2 - 增强功能**：批量操作、富文本编辑器、数据导出
4. **P3 - 优化项**：深色模式、国际化、快捷键

## 下一步行动

1. 先安装所需依赖包
2. 搭建项目基础结构
3. 实现认证系统
4. 开发条目管理核心功能
5. 逐步完善其他功能模块

## 注意事项

- 确保前端 API 调用与后端接口完全对应
- 做好错误处理和用户友好的提示
- 注意性能优化，特别是条目列表的渲染
- 保持代码的可维护性和可扩展性
