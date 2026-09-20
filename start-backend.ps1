# Nokia Snake - Backend launcher (FastAPI + uvicorn inside venv)
$ErrorActionPreference = "Stop"
$here = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location "$here\backend"

if (-not (Test-Path ".venv\Scripts\python.exe")) {
    Write-Host "Creating virtual environment..." -ForegroundColor Cyan
    python -m venv .venv
}

Write-Host "Installing/verifying dependencies..." -ForegroundColor Cyan
.venv\Scripts\python.exe -m pip install -r requirements.txt --quiet

# Load .env into the current shell session so uvicorn inherits the vars
if (Test-Path ".env") {
    Write-Host "Loading environment from .env..." -ForegroundColor Cyan
    Get-Content ".env" | ForEach-Object {
        if ($_ -match '^\s*([^#][^=]+)=(.*)$') {
            $key   = $Matches[1].Trim()
            $value = $Matches[2].Trim()
            [System.Environment]::SetEnvironmentVariable($key, $value, 'Process')
        }
    }
    $dbLabel = if ($env:TURSO_URL) { "Turso ($env:TURSO_URL)" } else { "Local SQLite (snake.db)" }
    Write-Host "  Database: $dbLabel" -ForegroundColor DarkGray
} else {
    Write-Host "  No .env found - using local SQLite (snake.db)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Starting backend on http://localhost:8000" -ForegroundColor Green
Write-Host "  Docs: http://localhost:8000/docs" -ForegroundColor DarkGray
Write-Host "  Press Ctrl+C to stop" -ForegroundColor DarkGray
Write-Host ""

.venv\Scripts\python.exe -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
