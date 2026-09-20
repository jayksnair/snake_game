# Nokia Snake — Frontend launcher (Vite dev server)
$ErrorActionPreference = "Stop"
$here = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location "$here\frontend"

Write-Host "Installing/verifying npm dependencies..." -ForegroundColor Cyan
npm install --quiet

Write-Host ""
Write-Host "Starting frontend on http://localhost:5173" -ForegroundColor Green
Write-Host "  Press Ctrl+C to stop" -ForegroundColor DarkGray
Write-Host ""

npm run dev
