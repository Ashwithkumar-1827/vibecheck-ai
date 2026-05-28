# Docker Setup Script for VibeCheck AI
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "   VIBECHECK AI - DOCKER INFRASTRUCTURE   " -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan

# 1. Check if Docker is installed and running
Write-Host "[1/3] Checking Docker daemon status..." -ForegroundColor Yellow
& docker info >$null 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Error "Docker daemon is not running. Please start Docker Desktop and try again."
    Exit 1
}
Write-Host "Docker daemon is active and running!" -ForegroundColor Green

# 2. Build vibecheck-node image
Write-Host "[2/3] Building vibecheck-node base image..." -ForegroundColor Yellow
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
if ([string]::IsNullOrEmpty($scriptDir)) {
    $scriptDir = "."
}
docker build -t vibecheck-node -f "$scriptDir\Dockerfile.node" "$scriptDir"
if ($LASTEXITCODE -ne 0) {
    Write-Error "Failed to build vibecheck-node base image."
    Exit 1
}
Write-Host "vibecheck-node base image built successfully!" -ForegroundColor Green

# 3. Build vibecheck-python image
Write-Host "[3/3] Building vibecheck-python base image..." -ForegroundColor Yellow
docker build -t vibecheck-python -f "$scriptDir\Dockerfile.python" "$scriptDir"
if ($LASTEXITCODE -ne 0) {
    Write-Error "Failed to build vibecheck-python base image."
    Exit 1
}
Write-Host "vibecheck-python base image built successfully!" -ForegroundColor Green

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "   DOCKER INFRASTRUCTURE SETUP COMPLETED!  " -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Cyan
