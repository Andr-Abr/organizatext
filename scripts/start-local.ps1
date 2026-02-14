# start-local.ps1
# Script para iniciar todos los servicios locales en Windows

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  Organizatext - Iniciar Servicios Locales " -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

$projectRoot = Split-Path -Parent $PSScriptRoot

# ============================================
# 1. Verificar Docker
# ============================================
Write-Host "[1/5] Verificando Docker..." -ForegroundColor Yellow

try {
    $dockerVersion = & docker --version 2>&1
    Write-Host "✓ Docker detectado: $dockerVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ Docker no está instalado o no está corriendo" -ForegroundColor Red
    Write-Host "Por favor inicia Docker Desktop" -ForegroundColor Yellow
    pause
    exit 1
}

# ============================================
# 2. Verificar Ollama
# ============================================
Write-Host "[2/5] Verificando Ollama..." -ForegroundColor Yellow

try {
    $response = Invoke-WebRequest -Uri "http://127.0.0.1:11434/api/version" -UseBasicParsing -TimeoutSec 5
    Write-Host "✓ Ollama está corriendo" -ForegroundColor Green
} catch {
    Write-Host "⚠ Ollama no está corriendo" -ForegroundColor Yellow
    Write-Host "Iniciando Ollama..." -ForegroundColor Yellow
    Start-Process "ollama" -ArgumentList "serve" -WindowStyle Hidden
    Start-Sleep -Seconds 3
}

# ============================================
# 3. Verificar modelo LLM
# ============================================
Write-Host "[3/5] Verificando modelo LLM..." -ForegroundColor Yellow

$models = & ollama list 2>&1
if ($models -match "josiefied.*qwen3.*14b" -or $models -match "qwen.*14b") {
    Write-Host "✓ Modelo LLM encontrado" -ForegroundColor Green
} else {
    Write-Host "✗ Modelo LLM no encontrado" -ForegroundColor Red
    Write-Host "Por favor ejecuta: .\scripts\install_model.ps1" -ForegroundColor Yellow
    pause
    exit 1
}

# ============================================
# 4. Levantar servicios con Docker Compose
# ============================================
Write-Host "[4/5] Levantando servicios (MongoDB, ChromaDB, n8n, Fiber)..." -ForegroundColor Yellow

Set-Location $projectRoot
& docker-compose up -d

if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ Error al levantar servicios" -ForegroundColor Red
    pause
    exit 1
}

Write-Host "✓ Servicios levantados correctamente" -ForegroundColor Green

# ============================================
# 5. Esperar a que los servicios estén listos
# ============================================
Write-Host "[5/5] Esperando a que los servicios estén listos..." -ForegroundColor Yellow

Start-Sleep -Seconds 5

# Verificar n8n
$n8nReady = $false
for ($i = 1; $i -le 10; $i++) {
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:5678" -UseBasicParsing -TimeoutSec 2
        $n8nReady = $true
        break
    } catch {
        Write-Host "  Esperando n8n... ($i/10)" -ForegroundColor Gray
        Start-Sleep -Seconds 3
    }
}

if ($n8nReady) {
    Write-Host "✓ n8n está listo" -ForegroundColor Green
} else {
    Write-Host "⚠ n8n está tardando en iniciar (normal la primera vez)" -ForegroundColor Yellow
}

# Verificar ChromaDB
try {
    $response = Invoke-WebRequest -Uri "http://localhost:8000/api/v1/heartbeat" -UseBasicParsing -TimeoutSec 2
    Write-Host "✓ ChromaDB está listo" -ForegroundColor Green
} catch {
    Write-Host "⚠ ChromaDB está iniciando..." -ForegroundColor Yellow
}

# Verificar Fiber
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3001/health" -UseBasicParsing -TimeoutSec 2
    Write-Host "✓ Fiber (MCP) está listo" -ForegroundColor Green
} catch {
    Write-Host "⚠ Fiber está iniciando..." -ForegroundColor Yellow
}

# ============================================
# Resumen
# ============================================
Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  ✓ Todos los servicios están corriendo     " -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "URLs de acceso:" -ForegroundColor Yellow
Write-Host "  • n8n:       http://localhost:5678" -ForegroundColor White
Write-Host "    (usuario: admin, password: admin123)" -ForegroundColor Gray
Write-Host "  • ChromaDB:  http://localhost:8000" -ForegroundColor White
Write-Host "  • Fiber MCP: http://localhost:3001" -ForegroundColor White
Write-Host "  • MongoDB:   mongodb://localhost:27017" -ForegroundColor White
Write-Host "  • Ollama:    http://localhost:11434" -ForegroundColor White
Write-Host ""
Write-Host "Próximos pasos:" -ForegroundColor Yellow
Write-Host "1. Configura el workflow en n8n (importa n8n-workflows/rag-workflow.json)" -ForegroundColor White
Write-Host "2. Ejecuta el frontend local: cd local\frontend && npm start" -ForegroundColor White
Write-Host ""
Write-Host "Para detener los servicios: docker-compose down" -ForegroundColor Yellow
Write-Host ""
pause