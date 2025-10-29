# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

这是一个基于 Vue 3 + TypeScript + Vite 的前端项目，使用 rolldown-vite 作为构建工具。项目与后端 `info-manager-backend` 位于同一代码库中，通过 VS Code workspace 配置进行管理。

## 常用开发命令

- `npm run dev` - 启动开发服务器
- `npm run build` - 构建生产版本（先运行 TypeScript 检查再构建）
- `npm run preview` - 预览生产构建
- `npm run lint` - ESLint 检查并自动修复代码
- `npm run format` - Prettier 格式化代码（仅 src/ 目录）

## 项目架构

### 技术栈
- **框架**: Vue 3 with Composition API (`<script setup>` 语法)
- **类型系统**: TypeScript（严格模式，包含未使用变量检查）
- **构建工具**: Vite（使用 rolldown-vite 7.1.14）
- **代码规范**: ESLint + Prettier

### 目录结构
- `src/main.ts` - 应用入口点
- `src/App.vue` - 根组件
- `src/components/` - Vue 组件
- `src/assets/` - 静态资源
- `src/style.css` - 全局样式

### 环境变量配置
项目支持环境变量配置，参考 `.env.example`：
- `VITE_API_URL` - 后端 API 地址（默认：http://localhost:8000）
- `VITE_APP_TITLE` - 应用标题
- `VITE_DEV_MODE` - 开发模式开关

## 代码规范

### TypeScript 配置
- 启用严格模式和所有严格检查选项
- 包含未使用局部变量和参数检查
- 支持 Vite 客户端类型

### ESLint 规则
- 使用 Vue 3 推荐配置
- 禁用多词组件名称限制
- 生产环境警告 console 和 debugger

### Prettier 配置
- 不使用分号
- 使用单引号
- 2 空格缩进
- 行宽 100 字符
- 避免箭头函数参数括号（单个参数时）

## 项目特点

1. **极简配置**: 最小化的 Vite 配置，专注于 Vue 3 开发
2. **类型安全**: 严格的 TypeScript 配置确保代码质量
3. **现代化**: 使用最新的 Vue 3 Composition API 和 `<script setup>` 语法
4. **代码质量**: 集成 ESLint 和 Prettier 确保代码风格一致