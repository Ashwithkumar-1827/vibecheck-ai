# =========================================================================
# VibeCheck AI - Automated Startup & Environment Launcher
# =========================================================================
# Run this script to boot up the entire platform:
#   .\start.ps1
# =========================================================================

Clear-Host
Write-Output "========================================================================="
Write-Output "✨ VibeCheck AI: Autonomous autonomic hotfix CI/CD Platform ✨"
Write-Output "========================================================================="
Write-Output ""

# 1. Verify Node.js presence
Write-Output "[*] Verifying Node.js environment..."
if (Get-Command node -ErrorAction SilentlyContinue) {
    $nodeVer = node -v
    Write-Output "    -> Success: Found Node.js ($nodeVer)"
} else {
    Write-Warning "[-] Error: Node.js was not found on your system."
    Write-Warning "    Please install Node.js (LTS version recommended) from https://nodejs.org/"
    Exit
}

# 2. Check and copy environment variables
Write-Output "[*] Checking environment configurations..."
$envPath = Join-Path $PSScriptRoot ".env"
$envTemplatePath = Join-Path $PSScriptRoot ".env.template"

if (-not (Test-Path $envPath)) {
    if (Test-Path $envTemplatePath) {
        Copy-Item $envTemplatePath $envPath
        Write-Output "    -> Created '.env' config file from '.env.template'"
        Write-Output "    -> Note: Set your 'OPENAI_API_KEY' inside '.env' for real OpenAI API diagnostics!"
    } else {
        Write-Warning "[-] Warning: Template config '.env.template' was not found."
    }
} else {
    Write-Output "    -> Found existing '.env' configuration"
}

# 3. Check for Python & pytest
Write-Output "[*] Detecting pipeline testing dependencies (Python/pytest)..."
$pythonActive = $false
$pytestActive = $false

if (Get-Command python -ErrorAction SilentlyContinue) {
    $pyVer = python --version
    $pythonActive = $true
    
    # Check if pytest is available
    $pytestCheck = python -c "import pytest" 2>$null
    if ($LASTEXITCODE -eq 0) {
        $pytestActive = $true
        Write-Output "    -> Found Python & pytest ($pyVer) - ACTIVE pipeline runner mode."
    } else {
        Write-Output "    -> Found Python ($pyVer), but 'pytest' is not installed."
        Write-Output "    -> Fallback: VibeCheck dynamic simulated pipeline will run."
    }
} else {
    Write-Output "    -> Python was not found."
    Write-Output "    -> Fallback: VibeCheck dynamic simulated pipeline will run."
}

if (-not $pytestActive) {
    Write-Output "    -> VibeCheck AI Dynamic Offline Simulator is ACTIVE. (No python required!)"
}

# 4. Install Node dependencies
Write-Output "[*] Installing project dependencies (NPM)..."
npm install --no-audit --no-fund
if ($LASTEXITCODE -ne 0) {
    Write-Error "[-] Error: NPM installation failed."
    Exit
}
Write-Output "    -> Project packages installed successfully."

# 5. Boot up Next.js Server
Write-Output ""
Write-Output "========================================================================="
Write-Output "🚀 Starting VibeCheck AI Web Platform..."
Write-Output "   Dashboard url: http://localhost:3000"
Write-Output "   Quit server:   Press [Ctrl + C]"
Write-Output "========================================================================="
Write-Output ""

# Launch the default web browser to the dashboard
Start-Process "http://localhost:3000"

# Start the development server
npm run dev
