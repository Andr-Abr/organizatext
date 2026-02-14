#!/bin/bash
# install_model.sh
# Script para instalar Josiefied Qwen3-14B Q4 en Linux/Mac

set -e

echo "============================================"
echo "  Organizatext - Instalador de Modelo LLM  "
echo "  Josiefied Qwen3-14B (Q4 cuantizado)      "
echo "============================================"
echo ""

# ============================================
# 1. Verificar que Ollama está instalado
# ============================================
echo "[1/4] Verificando instalación de Ollama..."

if ! command -v ollama &> /dev/null; then
    echo "✗ Error: Ollama no está instalado"
    echo ""
    echo "Por favor instala Ollama primero:"
    echo "curl -fsSL https://ollama.com/install.sh | sh"
    echo ""
    exit 1
fi

echo "✓ Ollama detectado: $(ollama --version)"

# ============================================
# 2. Verificar que Ollama está corriendo
# ============================================
echo "[2/4] Verificando servicio de Ollama..."

if ! curl -s http://127.0.0.1:11434/api/version > /dev/null 2>&1; then
    echo "✗ Ollama no está corriendo"
    echo "Iniciando Ollama..."
    ollama serve &
    sleep 3
    
    if ! curl -s http://127.0.0.1:11434/api/version > /dev/null 2>&1; then
        echo "✗ No se pudo iniciar Ollama"
        echo "Por favor ejecuta manualmente: ollama serve"
        exit 1
    fi
fi

echo "✓ Ollama está corriendo en localhost:11434"

# ============================================
# 3. Verificar si el modelo ya está descargado
# ============================================
echo "[3/4] Verificando si el modelo ya existe..."

if ollama list | grep -q "josiefied.*qwen3.*14b"; then
    echo "✓ El modelo ya está descargado"
    echo ""
    read -p "¿Deseas re-descargarlo? (s/N): " overwrite
    if [[ ! "$overwrite" =~ ^[sS]$ ]]; then
        echo "Instalación cancelada"
        exit 0
    fi
fi

# ============================================
# 4. Descargar el modelo (~9GB)
# ============================================
echo "[4/4] Descargando Josiefied Qwen3-14B Q4..."
echo "Tamaño aproximado: ~9 GB"
echo "Esto puede tardar 10-30 minutos dependiendo de tu conexión"
echo ""

ollama pull josiefied/qwen3:14b-q4_k_m

if [ $? -ne 0 ]; then
    echo ""
    echo "✗ Error al descargar el modelo"
    echo ""
    echo "Alternativas:"
    echo "1. Verifica el nombre exacto en: https://ollama.com/library"
    echo "2. Prueba con: ollama pull qwen2:14b-q4_k_m"
    echo ""
    exit 1
fi

# ============================================
# 5. Verificar la instalación
# ============================================
echo ""
echo "============================================"
echo "  ✓ Modelo instalado correctamente          "
echo "============================================"
echo ""

echo "Probando el modelo..."
ollama run josiefied/qwen3:14b-q4_k_m "Hola, responde en una sola línea: ¿Qué eres?"

echo ""
echo "Si viste una respuesta arriba, ¡todo funciona!"
echo ""
echo "Próximos pasos:"
echo "1. Ejecuta: ./scripts/start-local.sh"
echo "2. Abre el frontend local"
echo ""