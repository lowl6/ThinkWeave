#!/bin/bash
# ============================================================
#  ThinkWeave — 校园网一键启动（Linux / macOS / WSL）
#  用法：chmod +x start.sh && ./start.sh
# ============================================================

set -e
PROJECT_ROOT="$(cd "$(dirname "$0")" && pwd)"
cd "$PROJECT_ROOT"

# ─── 彩色输出 ──────────────────────────────────────────────
info()  { echo -e "\033[36m  [INFO]  $*\033[0m"; }
ok()    { echo -e "\033[32m  [ OK ]  $*\033[0m"; }
warn()  { echo -e "\033[33m  [WARN]  $*\033[0m"; }
err()   { echo -e "\033[31m  [ERR ]  $*\033[0m"; exit 1; }

echo ""
echo -e "\033[35m  ╔══════════════════════════════════╗"
echo -e "  ║   ThinkWeave  校园网一键启动     ║"
echo -e "  ╚══════════════════════════════════╝\033[0m"
echo ""

# ─── 获取本机 IP ───────────────────────────────────────────
LOCAL_IP=$(hostname -I 2>/dev/null | awk '{print $1}' || echo "localhost")
info "本机 IP：$LOCAL_IP"

# ─── 生成 .env ─────────────────────────────────────────────
if [ ! -f ".env" ]; then
    warn ".env 不存在，从模板创建..."
    SECRET=$(head -c 32 /dev/urandom | base64 | tr -d '/+=' | head -c 32)
    sed \
        -e "s|your-secret-key-change-in-production|$SECRET|" \
        -e "s|http://localhost:5173|http://$LOCAL_IP|" \
        backend/.env.example > .env
    ok ".env 已生成，请检查 AI API Key 配置"
fi

# ─── Docker 模式 ───────────────────────────────────────────
if command -v docker &>/dev/null && docker info &>/dev/null 2>&1; then
    info "使用 Docker Compose 启动..."
    export HOST_IP="$LOCAL_IP"
    docker compose up --build -d
    
    # 等待后端就绪
    info "等待后端就绪..."
    for i in $(seq 1 30); do
        if curl -sf http://localhost:8000/api/health >/dev/null 2>&1; then break; fi
        sleep 2; printf "."
    done; echo ""

    ok "所有服务已启动！"
    echo ""
    echo -e "\033[32m  ┌─────────────────────────────────────────────┐"
    echo    "  │  前端：       http://$LOCAL_IP              │"
    echo    "  │  API 文档：   http://$LOCAL_IP:8000/docs    │"
    echo -e "  └─────────────────────────────────────────────┘\033[0m"
    echo ""
    echo "  停止服务：docker compose down"
    exit 0
fi

# ─── 原生模式 ──────────────────────────────────────────────
warn "未检测到 Docker，使用原生模式..."

command -v python3 &>/dev/null || err "需要 Python 3.11+"
command -v node &>/dev/null    || err "需要 Node.js 18+"

# 后端
if [ ! -d "backend/.venv" ]; then
    info "创建 Python 虚拟环境..."
    python3 -m venv backend/.venv
fi
source backend/.venv/bin/activate
info "安装后端依赖..."
pip install -r backend/requirements.txt -q

# 前端
if [ ! -d "frontend/node_modules" ]; then
    info "安装前端依赖..."
    (cd frontend && npm install --silent)
fi

# 启动
info "启动后端（日志：backend.log）..."
(cd backend && uvicorn app.main:app --host 0.0.0.0 --port 8000) > backend.log 2>&1 &
BACKEND_PID=$!

info "启动前端（日志：frontend.log）..."
(cd frontend && npm run dev -- --host 0.0.0.0) > frontend.log 2>&1 &
FRONTEND_PID=$!

sleep 3
ok "服务已启动  (backend PID=$BACKEND_PID  frontend PID=$FRONTEND_PID)"
echo ""
echo -e "\033[32m  前端：     http://$LOCAL_IP:5173"
echo -e "  后端 API：  http://$LOCAL_IP:8000/docs\033[0m"
echo ""
warn "原生模式请确保 PostgreSQL 与 Redis 已运行！"
echo "  停止服务：kill $BACKEND_PID $FRONTEND_PID"
