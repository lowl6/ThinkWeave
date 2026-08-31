#!/bin/bash
# ============================================================
#  ThinkWeave — 一键启动（Linux / macOS / WSL）
#  用法：chmod +x start.sh && ./start.sh
#  与 start.ps1 对齐：SQLite + FastAPI 托管 frontend/public
# ============================================================

set -e
PROJECT_ROOT="$(cd "$(dirname "$0")" && pwd)"
cd "$PROJECT_ROOT"

info()  { echo -e "\033[36m  [INFO]  $*\033[0m"; }
ok()    { echo -e "\033[32m  [ OK ]  $*\033[0m"; }
warn()  { echo -e "\033[33m  [WARN]  $*\033[0m"; }
err()   { echo -e "\033[31m  [ERR ]  $*\033[0m"; exit 1; }

echo ""
echo -e "\033[35m  ╔══════════════════════════════════╗"
echo -e "  ║   ThinkWeave  一键启动           ║"
echo -e "  ╚══════════════════════════════════╝\033[0m"
echo ""

LOCAL_IP=$(hostname -I 2>/dev/null | awk '{print $1}' || true)
if [ -z "$LOCAL_IP" ]; then
    LOCAL_IP=$(ipconfig getifaddr en0 2>/dev/null || echo "localhost")
fi
info "本机 IP：$LOCAL_IP"

if [ ! -f ".env" ]; then
    warn ".env 不存在，从模板创建..."
    SECRET=$(head -c 32 /dev/urandom | base64 | tr -d '/+=' | head -c 32)
    sed \
        -e "s|your-secret-key-change-in-production|$SECRET|" \
        -e "s|http://localhost:5173|http://$LOCAL_IP|" \
        backend/.env.example > .env
    ok ".env 已生成，请检查 AI API Key 配置"
fi

# 一键脚本强制 SQLite，保证零依赖可跑
if grep -Eq '^DATABASE_URL=(postgresql\+asyncpg|mysql\+asyncmy)://' .env 2>/dev/null; then
    warn "检测到外部数据库配置，一键启动改为 SQLite"
    if [[ "$(uname)" == "Darwin" ]]; then
        sed -i '' 's|^DATABASE_URL=.*|DATABASE_URL=sqlite+aiosqlite:///./thinkweave.db|' .env
    else
        sed -i 's|^DATABASE_URL=.*|DATABASE_URL=sqlite+aiosqlite:///./thinkweave.db|' .env
    fi
fi

cp .env backend/.env

if grep -Eq '^AI_GATEWAY_API_KEY=(your-api-key)?[[:space:]]*$' .env; then
    warn "AI_GATEWAY_API_KEY 为空或占位，AI 对话功能可能不可用"
else
    ok "已检测到 AI_GATEWAY_API_KEY"
fi

command -v python3 &>/dev/null || err "需要 Python 3.10+"

if [ ! -d "backend/.venv" ]; then
    info "创建 Python 虚拟环境..."
    python3 -m venv backend/.venv
fi

# shellcheck disable=SC1091
source backend/.venv/bin/activate
info "安装后端依赖..."
pip install -r backend/requirements.txt -q

if lsof -iTCP:8000 -sTCP:LISTEN >/dev/null 2>&1; then
    err "端口 8000 已被占用，请先结束占用进程后再启动"
fi

info "启动 ThinkWeave（0.0.0.0:8000）..."
(cd backend && python -m uvicorn app.main:app --host 0.0.0.0 --port 8000) > backend.log 2>&1 &
BACKEND_PID=$!

info "等待服务就绪..."
ready=0
for i in $(seq 1 20); do
    if curl -sf http://127.0.0.1:8000/api/health >/dev/null 2>&1; then
        ready=1
        break
    fi
    sleep 2
done

if [ "$ready" -ne 1 ]; then
    kill "$BACKEND_PID" 2>/dev/null || true
    err "服务未在时限内就绪，请查看 backend.log"
fi

ok "ThinkWeave 已启动  (PID=$BACKEND_PID)"
echo ""
echo -e "\033[32m  本机：  http://localhost:8000"
echo -e "  局域网：http://$LOCAL_IP:8000"
echo -e "  文档：  http://$LOCAL_IP:8000/docs\033[0m"
echo ""
echo "  停止：kill $BACKEND_PID   或   kill \$(lsof -t -i:8000)"
echo "  日志：backend.log"
echo ""
