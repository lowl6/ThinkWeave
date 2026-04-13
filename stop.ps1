# ============================================================
#  ThinkWeave — 停止服务
#  用法：.\stop.ps1
# ============================================================

Write-Host "  [INFO]  停止 ThinkWeave 服务..." -ForegroundColor Cyan

$stopped = 0
Get-Process -Name "python","uvicorn" -ErrorAction SilentlyContinue |
    Where-Object { $_.Path -like "*ThinkWeave*" -or $_.CommandLine -like "*ThinkWeave*" } |
    ForEach-Object { Stop-Process -Id $_.Id -Force; $stopped++ }

if ($stopped -gt 0) {
    Write-Host "  [ OK ]  已停止 $stopped 个进程" -ForegroundColor Green
} else {
    Write-Host "  [INFO]  未发现运行中的 ThinkWeave 进程" -ForegroundColor Yellow
}
