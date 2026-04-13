# ============================================================
#  ThinkWeave — 校园网一键启动脚本
#  用法：右键 → 用 PowerShell 运行  /  或终端: .\start.ps1
# ============================================================

$ErrorActionPreference = "Stop"
$ProjectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path

# ─── 彩色输出工具 ──────────────────────────────────────────
function Info  { param($m) Write-Host "  [INFO]  $m" -ForegroundColor Cyan }
function Ok    { param($m) Write-Host "  [ OK ]  $m" -ForegroundColor Green }
function Warn  { param($m) Write-Host "  [WARN]  $m" -ForegroundColor Yellow }
function Err   { param($m) Write-Host "  [ERR ]  $m" -ForegroundColor Red; exit 1 }

function Banner {
    Write-Host ""
    Write-Host "  ╔══════════════════════════════════╗" -ForegroundColor Magenta
    Write-Host "  ║   ThinkWeave  校园网一键启动     ║" -ForegroundColor Magenta
    Write-Host "  ╚══════════════════════════════════╝" -ForegroundColor Magenta
    Write-Host ""
}

# ─── 获取本机局域网 IP ─────────────────────────────────────
function Get-LocalIP {
    $ip = (Get-NetIPAddress -AddressFamily IPv4 |
           Where-Object { $_.IPAddress -notmatch '^127\.' -and $_.PrefixOrigin -ne 'WellKnown' } |
           Select-Object -First 1).IPAddress
    if (-not $ip) { $ip = "localhost" }
    return $ip
}

# ─── 生成 .env（首次运行）──────────────────────────────────
function Ensure-Env {
    $envFile = Join-Path $ProjectRoot ".env"
    if (-not (Test-Path $envFile)) {
        Warn ".env 文件不存在，正在从模板创建..."
        $localIp = Get-LocalIP
        $secret   = [Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Max 256 }))
        $template = Get-Content (Join-Path $ProjectRoot "backend\.env.example") -Raw
        $template = $template `
            -replace "your-secret-key-change-in-production", $secret `
            -replace "http://localhost:5173",                 "http://${localIp}"
        Set-Content $envFile $template -Encoding UTF8
        Ok ".env 已生成（默认 SQLite 数据库，零配置）"
    } else {
        # 自动修复旧版 PostgreSQL / MySQL 配置 → SQLite
        $current = Get-Content $envFile -Raw
        if ($current -match "DATABASE_URL=(postgresql\+asyncpg|mysql\+asyncmy)://") {
            Warn "检测到旧版外部数据库配置，自动切换为 SQLite（零依赖）..."
            $updated = $current -replace "DATABASE_URL=[^\r\n]*", "DATABASE_URL=sqlite+aiosqlite:///./thinkweave.db"
            Set-Content $envFile $updated -Encoding UTF8
            Ok ".env 已切换为 SQLite"
        }
    }
    # 把 .env 加载到当前进程
    Get-Content $envFile | ForEach-Object {
        if ($_ -match '^\s*([^#][^=]+)=(.*)$') {
            [System.Environment]::SetEnvironmentVariable($Matches[1].Trim(), $Matches[2].Trim(), "Process")
        }
    }

    # 检查 AI API Key 是否已配置
    $envContent = Get-Content $envFile -Raw
    if ($envContent -match "AI_GATEWAY_API_KEY=(your-api-key|)(\s|$)") {
        Warn "AI API Key 未配置，AI 聊天功能将无法使用！"
        $key = Read-Host "  请输入 AiHubMix API Key (sk-...，直接回车跳过)"
        if ($key -and $key.Trim()) {
            $envContent = $envContent -replace "AI_GATEWAY_API_KEY=[^\r\n]*", "AI_GATEWAY_API_KEY=$($key.Trim())"
            Set-Content $envFile $envContent -Encoding UTF8
            Ok "API Key 已保存到 .env"
            # 重新加载
            [System.Environment]::SetEnvironmentVariable("AI_GATEWAY_API_KEY", $key.Trim(), "Process")
        } else {
            Warn "已跳过。稍后请手动编辑 .env 文件中的 AI_GATEWAY_API_KEY。"
        }
    } else {
        Ok "AI API Key 已配置"
    }
}

function Get-Port8000Owner {
    $conn = Get-NetTCPConnection -State Listen -ErrorAction SilentlyContinue |
        Where-Object { $_.LocalPort -eq 8000 } |
        Select-Object -First 1
    if (-not $conn) { return $null }

    $procId = [int]$conn.OwningProcess
    $proc = Get-CimInstance Win32_Process -Filter "ProcessId = $procId" -ErrorAction SilentlyContinue
    if (-not $proc) { return @{ Pid = $procId; Name = "unknown"; CommandLine = "" } }

    return @{
        Pid = $procId
        Name = $proc.Name
        CommandLine = ($proc.CommandLine | Out-String).Trim()
    }
}

function Test-ServiceReady {
    try {
        $r = Invoke-WebRequest -Uri "http://127.0.0.1:8000/api/health" -UseBasicParsing -TimeoutSec 2
        return ($r.StatusCode -eq 200)
    } catch {
        return $false
    }
}

# ─── 原生启动 ──────────────────────────────────────────────
function Start-Native {
    $localIp = Get-LocalIP
    Info "使用 SQLite 本地数据库 + 静态 HTML 前端（零依赖，无需 Node.js）..."

    # 端口冲突预检查：避免 WinError 10013
    $owner = Get-Port8000Owner
    if ($owner) {
        $cmd = [string]$owner.CommandLine
        if ($cmd -match "ThinkWeave" -and $cmd -match "uvicorn" -and $cmd -match "app\.main:app") {
            if (Test-ServiceReady) {
                Ok "检测到 ThinkWeave 已在运行，跳过重复启动（PID: $($owner.Pid)）"
                Write-Host ""
                Write-Host "  访问地址：" -ForegroundColor Green
                Write-Host "    本机     http://localhost:8000" -ForegroundColor Green
                Write-Host "    校园网   http://${localIp}:8000" -ForegroundColor Green
                Write-Host ""
                return
            } else {
                Warn "检测到旧 ThinkWeave 进程占用 8000，但健康检查未通过。建议先执行 .\stop.ps1 后重试。"
                Err "端口 8000 当前不可用"
            }
        } else {
            Warn "端口 8000 已被其他进程占用（PID: $($owner.Pid), Name: $($owner.Name)）"
            Err "请先释放端口 8000 后重试，或修改启动脚本端口"
        }
    }

    # 检查 Python
    if (-not (Get-Command python -ErrorAction SilentlyContinue)) { Err "需要 Python 3.10+，请先安装" }

    # ── 后端 virtualenv ──────────────────
    $venvPath = Join-Path $ProjectRoot "backend\.venv"
    if (-not (Test-Path $venvPath)) {
        Info "创建 Python 虚拟环境..."
        python -m venv $venvPath
    }
    $pip = Join-Path $venvPath "Scripts\pip"
    $uvicorn = Join-Path $venvPath "Scripts\uvicorn"

    Info "安装后端依赖（首次较慢）..."
    & $pip install -r (Join-Path $ProjectRoot "backend\requirements.txt") -q

    # ── 拷贝 .env 到 backend/ 让 pydantic-settings 能找到 ──
    $rootEnv = Join-Path $ProjectRoot ".env"
    $backendEnv = Join-Path $ProjectRoot "backend\.env"
    Copy-Item $rootEnv $backendEnv -Force

    # ── 启动后端（独立窗口）── 同时托管 API + 前端静态页面 ──
    Info "启动 ThinkWeave 服务（端口 8000，同时托管 API 和前端页面）..."
    $backendCmd = "`"$uvicorn`" app.main:app --host 0.0.0.0 --port 8000"
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$ProjectRoot\backend'; $backendCmd" -WindowStyle Normal

    # 等待后端启动
    Info "等待服务就绪..."
    $ready = $false
    for ($i = 0; $i -lt 20; $i++) {
        Start-Sleep 2
        try {
            $r = Invoke-WebRequest -Uri "http://127.0.0.1:8000/api/health" -UseBasicParsing -TimeoutSec 2
            if ($r.StatusCode -eq 200) { $ready = $true; break }
        } catch {}
        Write-Host "." -NoNewline
    }
    Write-Host ""
    if ($ready) {
        Ok "服务已就绪！"
    } else {
        Warn "服务可能还在启动中，请稍候查看弹出的终端窗口..."
    }

    Ok "ThinkWeave 启动完成！"
    Write-Host ""
    Write-Host "  ┌─────────────────────────────────────────────────┐" -ForegroundColor Green
    Write-Host "  │  ThinkWeave 已成功启动                          │" -ForegroundColor Green
    Write-Host "  │                                                 │" -ForegroundColor Green
    Write-Host "  │  访问地址：                                     │" -ForegroundColor Green
    Write-Host "  │    本机     http://localhost:8000               │" -ForegroundColor Green
    Write-Host "  │    校园网   http://${localIp}:8000              │" -ForegroundColor Green
    Write-Host "  │                                                 │" -ForegroundColor Green
    Write-Host "  │  API 文档   http://${localIp}:8000/docs         │" -ForegroundColor Green
    Write-Host "  │  数据库     SQLite (backend/thinkweave.db)      │" -ForegroundColor Green
    Write-Host "  │  停止服务   .\stop.ps1                          │" -ForegroundColor Green
    Write-Host "  └─────────────────────────────────────────────────┘" -ForegroundColor Green
    Write-Host ""
}

# ─── 防火墙放行（可选）─────────────────────────────────────
function Open-Firewall {
    $rule = Get-NetFirewallRule -DisplayName "ThinkWeave" -ErrorAction SilentlyContinue
    if (-not $rule) {
        try {
            New-NetFirewallRule -DisplayName "ThinkWeave" -Direction Inbound -Protocol TCP -LocalPort 8000 -Action Allow -ErrorAction Stop | Out-Null
            Ok "防火墙规则：端口 8000 已放行（校园网可访问）"
        } catch {
            Warn "防火墙放行失败（可能需要管理员权限），校园网访问可能受限。"
        }
    } else {
        Info "防火墙规则已存在：ThinkWeave"
    }
}

# ─── 主流程 ───────────────────────────────────────────────
Banner
Ensure-Env

# 尝试放行防火墙（需要管理员权限，失败则跳过）
try {
    Open-Firewall
} catch {
    Warn "防火墙规则设置失败（可能需要管理员权限），跳过。"
}

Start-Native
