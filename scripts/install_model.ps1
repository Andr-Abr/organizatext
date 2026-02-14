# install_model.ps1
# Script para instalar Josiefied Qwen3-14B Q4 en Windows

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  Organizatext - Instalador de Modelo LLM  " -ForegroundColor Cyan
Write-Host "  Josiefied Qwen3-14B (Q4 cuantizado)      " -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# ============================================
# 1. Verificar que Ollama está instalado
# ============================================
Write-Host "[1/4] Verificando instalación de Ollama..." -ForegroundColor Yellow

try {
    $ollamaVersion = & ollama --version 2>&1
    Write-Host "✓ Ollama detectado: $ollamaVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ Error: Ollama no está instalado" -ForegroundColor Red
    Write-Host ""
    Write-Host "Por favor instala Ollama primero:" -ForegroundColor Yellow
    Write-Host "1. Descarga de: https://ollama.com/download" -ForegroundColor White
    Write-Host "2. Ejecuta el instalador (Next -> Next -> Finish)" -ForegroundColor White
    Write-Host "3. Reinicia PowerShell" -ForegroundColor White
    Write-Host "4. Ejecuta este script nuevamente" -ForegroundColor White
    Write-Host ""
    pause
    exit 1
}

# ============================================
# 2. Verificar que Ollama está corriendo
# ============================================
Write-Host "[2/4] Verificando servicio de Ollama..." -ForegroundColor Yellow

try {
    $response = Invoke-WebRequest -Uri "http://127.0.0.1:11434/api/version" -UseBasicParsing -TimeoutSec 5
    Write-Host "✓ Ollama está corriendo en localhost:11434" -ForegroundColor Green
} catch {
    Write-Host "✗ Ollama no está corriendo" -ForegroundColor Red
    Write-Host ""
    Write-Host "Iniciando Ollama..." -ForegroundColor Yellow
    Start-Process "ollama" -ArgumentList "serve" -WindowStyle Hidden
    Start-Sleep -Seconds 3
    
    try {
        $response = Invoke-WebRequest -Uri "http://127.0.0.1:11434/api/version" -UseBasicParsing -TimeoutSec 5
        Write-Host "✓ Ollama iniciado correctamente" -ForegroundColor Green
    } catch {
        Write-Host "✗ No se pudo iniciar Ollama automáticamente" -ForegroundColor Red
        Write-Host "Por favor ejecuta manualmente: ollama serve" -ForegroundColor Yellow
        pause
        exit 1
    }
}

# ============================================
# 3. Verificar si el modelo ya está descargado
# ============================================
Write-Host "[3/4] Verificando si el modelo ya existe..." -ForegroundColor Yellow

$existingModels = & ollama list 2>&1
if ($existingModels -match "josiefied.*qwen3.*14b") {
    Write-Host "✓ El modelo ya está descargado" -ForegroundColor Green
    Write-Host ""
    $overwrite = Read-Host "¿Deseas re-descargarlo? (s/N)"
    if ($overwrite -ne "s" -and $overwrite -ne "S") {
        Write-Host "Instalación cancelada" -ForegroundColor Yellow
        pause
        exit 0
    }
}

# ============================================
# 4. Descargar el modelo (~9GB)
# ============================================
Write-Host "[4/4] Descargando Josiefied Qwen3-14B Q4..." -ForegroundColor Yellow
Write-Host "Tamaño aproximado: ~9 GB" -ForegroundColor Cyan
Write-Host "Esto puede tardar 10-30 minutos dependiendo de tu conexión" -ForegroundColor Cyan
Write-Host ""

# Nota: El nombre exacto puede variar, verifica en https://ollama.com/library
# Si josiefied/qwen3:14b-q4_k_m no existe, usa alternativas como:
# - qwen:14b-q4_k_m
# - qwen2:14b-q4_k_m

Write-Host "Intentando: ollama pull josiefied/qwen3:14b-q4_k_m" -ForegroundColor White
& ollama pull josiefied/qwen3:14b-q4_k_m

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "✗ Error al descargar el modelo" -ForegroundColor Red
    Write-Host ""
    Write-Host "Alternativas:" -ForegroundColor Yellow
    Write-Host "1. Verifica el nombre exacto en: https://ollama.com/library" -ForegroundColor White
    Write-Host "2. Prueba con: ollama pull qwen2:14b-q4_k_m" -ForegroundColor White
    Write-Host "3. Contacta soporte del proyecto" -ForegroundColor White
    Write-Host ""
    pause
    exit 1
}

# ============================================
# 5. Verificar la instalación
# ============================================
Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  ✓ Modelo instalado correctamente          " -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Probando el modelo..." -ForegroundColor Yellow
$testPrompt = "Hola, responde en una sola línea: ¿Qué eres?"
Write-Host "Prompt de prueba: $testPrompt" -ForegroundColor White
Write-Host ""

& ollama run josiefied/qwen3:14b-q4_k_m "$testPrompt"

Write-Host ""
Write-Host "Si viste una respuesta arriba, ¡todo funciona!" -ForegroundColor Green
Write-Host ""
Write-Host "Próximos pasos:" -ForegroundColor Yellow
Write-Host "1. Ejecuta: .\scripts\start-local.ps1" -ForegroundColor White
Write-Host "2. Abre el frontend local" -ForegroundColor White
Write-Host ""
pause