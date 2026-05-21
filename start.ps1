$ErrorActionPreference = "Stop"
$ProjectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path

function Info { param([string]$m) Write-Host "[INFO] $m" -ForegroundColor Cyan }
function Ok { param([string]$m) Write-Host "[ OK ] $m" -ForegroundColor Green }
function Warn { param([string]$m) Write-Host "[WARN] $m" -ForegroundColor Yellow }
function Err { param([string]$m) Write-Host "[ERR ] $m" -ForegroundColor Red; exit 1 }

function Get-LocalIP {
    $ip = $null
    $vpnKeywords = @("vpn", "tun", "tap", "ppp", "virtual", "vmware", "vbox", "hyper-v", "wintun", "wireguard", "zerotier", "tailscale")

    # 1) Prefer wireless adapter IPv4 (Wi-Fi/WLAN), exclude VPN/virtual adapters.
    try {
        $wifiIp = Get-NetIPConfiguration -ErrorAction SilentlyContinue |
            Where-Object {
                $_.IPv4Address -and
                $_.NetAdapter -and
                $_.NetAdapter.Status -eq "Up" -and
                (
                    $_.InterfaceAlias -match "(?i)wi-?fi|wlan|wireless" -or
                    $_.NetAdapter.InterfaceDescription -match "(?i)wi-?fi|wlan|wireless"
                )
            } |
            Where-Object {
                $name = ("{0} {1}" -f $_.InterfaceAlias, $_.NetAdapter.InterfaceDescription).ToLowerInvariant()
                -not ($vpnKeywords | Where-Object { $name -like "*$_*" })
            } |
            Select-Object -First 1

        if ($wifiIp) {
            $ip = [string]$wifiIp.IPv4Address.IPAddress
            if (-not [string]::IsNullOrWhiteSpace($ip) -and $ip -notmatch '^169\.254\.') {
                return $ip
            }
        }
    } catch {}

    # 2) Fallback to any active non-virtual IPv4 adapter.
    try {
        $ip = [string](Get-NetIPConfiguration -ErrorAction SilentlyContinue |
            Where-Object {
                $_.IPv4Address -and
                $_.NetAdapter -and
                $_.NetAdapter.Status -eq "Up"
            } |
            Where-Object {
                $name = ("{0} {1}" -f $_.InterfaceAlias, $_.NetAdapter.InterfaceDescription).ToLowerInvariant()
                -not ($vpnKeywords | Where-Object { $name -like "*$_*" })
            } |
            Select-Object -First 1 -ExpandProperty IPv4Address |
            Select-Object -ExpandProperty IPAddress)
        if (-not [string]::IsNullOrWhiteSpace($ip)) { return $ip }
    } catch {}

    try {
        $ip = [string](([System.Net.Dns]::GetHostAddresses($env:COMPUTERNAME) |
            Where-Object { $_.AddressFamily -eq [System.Net.Sockets.AddressFamily]::InterNetwork } |
            Select-Object -First 1).IPAddressToString)
        if (-not [string]::IsNullOrWhiteSpace($ip)) { return $ip }
    } catch {}

    return "localhost"
}

function Test-ServiceReady {
    try {
        $r = Invoke-WebRequest -Uri "http://127.0.0.1:8000/api/health" -UseBasicParsing -TimeoutSec 2
        return $r.StatusCode -eq 200
    } catch {
        return $false
    }
}

function Get-Port8000Owner {
    try {
        $conn = Get-NetTCPConnection -State Listen -LocalPort 8000 -ErrorAction SilentlyContinue | Select-Object -First 1
        if (-not $conn) { return $null }
        $pid = [int]$conn.OwningProcess
        $proc = Get-CimInstance Win32_Process -Filter "ProcessId = $pid" -ErrorAction SilentlyContinue
        return @{
            Pid = $pid
            Name = if ($proc) { $proc.Name } else { "unknown" }
            CommandLine = if ($proc) { [string]$proc.CommandLine } else { "" }
        }
    } catch {
        return $null
    }
}

function Ensure-Env {
    $envFile = Join-Path $ProjectRoot ".env"
    $exampleFile = Join-Path $ProjectRoot "backend\.env.example"
    $localIp = Get-LocalIP

    if (-not (Test-Path $exampleFile)) {
        Err "Missing backend/.env.example"
    }

    if (-not (Test-Path $envFile)) {
        Warn ".env missing, creating from template."
        $secret = [Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))
        $content = Get-Content $exampleFile -Raw
        $content = $content `
            -replace "your-secret-key-change-in-production", $secret `
            -replace "http://localhost:5173", "http://$localIp"
        Set-Content -Path $envFile -Value $content -Encoding UTF8
        Ok ".env created."
    }

    $envContent = Get-Content $envFile -Raw
    if ($envContent -match 'DATABASE_URL=(postgresql\+asyncpg|mysql\+asyncmy)://') {
        Warn "External DB config found, switching to SQLite for local one-click run."
        $envContent = $envContent -replace "DATABASE_URL=[^\r\n]*", "DATABASE_URL=sqlite+aiosqlite:///./thinkweave.db"
        Set-Content -Path $envFile -Value $envContent -Encoding UTF8
        Ok "DATABASE_URL switched to SQLite."
    }

    Get-Content $envFile | ForEach-Object {
        if ($_ -match '^\s*([^#][^=]+)=(.*)$') {
            $k = $Matches[1].Trim()
            $v = $Matches[2].Trim()
            [System.Environment]::SetEnvironmentVariable($k, $v, "Process")
        }
    }

    if ($envContent -match 'AI_GATEWAY_API_KEY=(your-api-key|)\s*$') {
        Warn "AI_GATEWAY_API_KEY is empty or placeholder. AI chat features may fail."
    } else {
        Ok "AI_GATEWAY_API_KEY detected."
    }

    Copy-Item $envFile (Join-Path $ProjectRoot "backend\.env") -Force
}

function Ensure-FirewallRule {
    try {
        $rule = Get-NetFirewallRule -DisplayName "ThinkWeave-8000" -ErrorAction SilentlyContinue
        if (-not $rule) {
            New-NetFirewallRule -DisplayName "ThinkWeave-8000" -Direction Inbound -Protocol TCP -LocalPort 8000 -Action Allow -ErrorAction Stop | Out-Null
            Ok "Firewall rule added for TCP 8000."
        } else {
            Info "Firewall rule already exists."
        }
    } catch {
        Warn "Failed to configure firewall automatically (try running as Administrator)."
    }
}

function Start-ThinkWeave {
    $localIp = Get-LocalIP

    $owner = Get-Port8000Owner
    if ($owner) {
        $cmd = [string]$owner.CommandLine
        if ($cmd -match "ThinkWeave" -and $cmd -match "uvicorn" -and $cmd -match "app\.main:app") {
            if (Test-ServiceReady) {
                Ok "ThinkWeave is already running on port 8000 (PID: $($owner.Pid))."
                Write-Host ""
                Write-Host "Open: http://localhost:8000"
                Write-Host "LAN : http://${localIp}:8000"
                Write-Host ""
                return
            }
            Err "Port 8000 is occupied by stale ThinkWeave process. Run .\stop.ps1 first."
        }
        Err "Port 8000 is occupied by PID $($owner.Pid) ($($owner.Name))."
    }

    $pythonCmd = Get-Command python -ErrorAction SilentlyContinue
    if (-not $pythonCmd) { Err "Python 3.10+ is required." }

    $venvPath = Join-Path $ProjectRoot "backend\.venv"
    if (-not (Test-Path $venvPath)) {
        Info "Creating Python virtual environment..."
        & python -m venv $venvPath
    }

    $pip = Join-Path $venvPath "Scripts\pip.exe"
    $pythonExe = Join-Path $venvPath "Scripts\python.exe"
    if (-not (Test-Path $pip)) { Err "pip not found in backend/.venv" }
    if (-not (Test-Path $pythonExe)) { Err "python not found in backend/.venv" }

    Info "Installing backend dependencies..."
    & $pip install -r (Join-Path $ProjectRoot "backend\requirements.txt")

    Info "Starting ThinkWeave backend on 0.0.0.0:8000..."
    Start-Process -FilePath $pythonExe -ArgumentList "-m uvicorn app.main:app --host 0.0.0.0 --port 8000" -WorkingDirectory (Join-Path $ProjectRoot "backend") | Out-Null

    Info "Waiting for service readiness..."
    $ready = $false
    for ($i = 0; $i -lt 20; $i++) {
        Start-Sleep -Seconds 2
        if (Test-ServiceReady) { $ready = $true; break }
    }

    if (-not $ready) {
        Err "Service did not become ready in time."
    }

    Ok "ThinkWeave started successfully."
    Write-Host ""
    Write-Host "Open: http://localhost:8000" -ForegroundColor Green
    Write-Host "LAN : http://${localIp}:8000" -ForegroundColor Green
    Write-Host "Docs: http://${localIp}:8000/docs" -ForegroundColor Green
    Write-Host "Stop: .\stop.ps1" -ForegroundColor Green
    Write-Host ""
}

Write-Host ""
Write-Host "ThinkWeave one-click start (Windows)" -ForegroundColor Magenta
Write-Host ""

Set-Location $ProjectRoot
Ensure-Env
Ensure-FirewallRule
Start-ThinkWeave
