#!/bin/bash

# Info Manager 开发环境启动脚本

set -e

echo "🚀 启动 Info Manager 开发环境..."

# 颜色定义
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# 检查依赖
check_dependencies() {
    echo -e "${BLUE}📋 检查依赖...${NC}"

    if ! command -v python3 &> /dev/null; then
        echo -e "${RED}❌ Python 3 未安装${NC}"
        exit 1
    fi

    if ! command -v node &> /dev/null; then
        echo -e "${RED}❌ Node.js 未安装${NC}"
        exit 1
    fi

    if ! command -v uv &> /dev/null; then
        echo -e "${RED}⚠️  uv 未安装，尝试安装...${NC}"
        curl -LsSf https://astral.sh/uv/install.sh | sh
    fi

    echo -e "${GREEN}✅ 依赖检查完成${NC}"
}

# 后端设置
setup_backend() {
    echo -e "${BLUE}🐍 设置后端...${NC}"
    cd info-manager-backend/backend

    # 创建虚拟环境和安装依赖
    if [ ! -d ".venv" ]; then
        echo "创建 Python 虚拟环境..."
        uv sync
    fi

    # 检查 .env 文件
    if [ ! -f ".env" ]; then
        echo "创建 .env 文件..."
        cp .env.example .env
        echo -e "${RED}⚠️  请编辑 .env 文件并设置正确的配置${NC}"
    fi

    cd ../..
    echo -e "${GREEN}✅ 后端设置完成${NC}"
}

# 前端设置
setup_frontend() {
    echo -e "${BLUE}🎨 设置前端...${NC}"
    cd info-manager-front

    # 安装依赖
    if [ ! -d "node_modules" ]; then
        echo "安装 Node.js 依赖..."
        npm install
    fi

    # 检查 .env 文件
    if [ ! -f ".env" ]; then
        echo "创建 .env 文件..."
        cp .env.example .env
    fi

    cd ..
    echo -e "${GREEN}✅ 前端设置完成${NC}"
}

# 启动服务
start_services() {
    echo -e "${BLUE}🚀 启动服务...${NC}"

    # 询问启动方式
    echo "选择启动方式:"
    echo "1) Docker (推荐)"
    echo "2) 本地开发"
    read -p "请选择 (1/2): " choice

    case $choice in
        1)
            echo "使用 Docker 启动..."
            cd info-manager-backend
            docker-compose up -d
            cd ..
            echo -e "${GREEN}✅ Docker 服务已启动${NC}"
            echo "后端 API: http://localhost:8000/docs"
            ;;
        2)
            echo "启动本地开发服务器..."
            echo "请在不同的终端窗口中运行以下命令:"
            echo ""
            echo "  终端 1 (后端):"
            echo "  cd info-manager-backend/backend"
            echo "  source .venv/bin/activate"
            echo "  uvicorn app.main:app --reload --host 0.0.0.0 --port 8000"
            echo ""
            echo "  终端 2 (前端):"
            echo "  cd info-manager-front"
            echo "  npm run dev"
            ;;
        *)
            echo -e "${RED}无效选择${NC}"
            exit 1
            ;;
    esac
}

# 主函数
main() {
    check_dependencies
    setup_backend
    setup_frontend
    start_services

    echo ""
    echo -e "${GREEN}🎉 环境配置完成！${NC}"
    echo ""
    echo "📚 有用的链接:"
    echo "  - 后端 API 文档: http://localhost:8000/docs"
    echo "  - 前端应用: http://localhost:5173"
    echo ""
}

# 运行主函数
main
