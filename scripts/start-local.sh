#!/bin/bash
# start-local.sh
# Script para iniciar todos los servicios locales en Linux/Mac

set -e

echo "============================================"
echo "  Organizatext - Iniciar Servicios Locales "
echo "============================================"
echo ""

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

# ============================================
# 1. Verificar Docker
# ============================================
echo "[1/5] Verificando Docker..."

if ! command -v docker &> /dev/null; then
    echo "✗ Docker no está instalado"
    exit 1
fi

echo "✓ Docker detectado: $(docker --version)"

# ============================================
# 2. Verificar Ollama
# ============================================
echo "[2/5] Verificando Ollama..."

if ! curl -s http://127.0.0.1:11434/api/version > /dev/null 2>&1; then
    echo "⚠ Ollama no está corriendo"
    echo "Iniciando Ollama..."
    ollama serve &
    sleep 3
fi

echo "✓ Ollama está corriendo"

# ============================================
# 3. Verificar modelo LLM
# ============================================
echo "[3/5] Verificando modelo LLM..."

if ollama list | grep -q "josiefied.*qwen3.*14b\|qwen.*14b"; then
    echo "✓ Modelo LLM encontrado"
else
    echo "✗ Modelo LLM no encontrado"
    echo "Por favor ejecuta: ./scripts/install_model.sh"
    exit 1
fi

# ============================================
# 4. Levantar servicios con Docker Compose
# ============================================
echo "[4/5] Levantando servicios (MongoDB, ChromaDB, n8n, Fiber)..."

cd "$PROJECT_ROOT"
docker-compose up -d

echo "✓ Servicios levantados correctamente"

# ============================================
# 5. Esperar a que los servicios estén listos
# ============================================
echo "[5/5] Esperando a que los servicios estén listos..."

sleep 5

# Verificar n8n
for i in {1..10}; do
    if curl -s http://localhost:5678 > /dev/null 2>&1; then
        echo "✓ n8n está listo"
        break
    fi
    echo "  Esperando n8n... ($i/10)"
    sleep 3
done

# Verificar ChromaDB
if curl -s http://localhost:8000/api/v1/heartbeat > /dev/null 2>&1; then
    echo "✓ ChromaDB está listo"
fi

# Verificar Fiber
if curl -s http://localhost:3001/health > /dev/null 2>&1; then
    echo "✓ Fiber (MCP) está listo"
fi

# ============================================
# Resumen
# ============================================
echo ""
echo "============================================"
echo "  ✓ Todos los servicios están corriendo     "
echo "============================================"
echo ""
echo "URLs de acceso:"
echo "  • n8n:       http://localhost:5678"
echo "    (usuario: admin, password: admin123)"
echo "  • ChromaDB:  http://localhost:8000"
echo "  • Fiber MCP: http://localhost:3001"
echo "  • MongoDB:   mongodb://localhost:27017"
echo "  • Ollama:    http://localhost:11434"
echo ""
echo "Próximos pasos:"
echo "1. Configura el workflow en n8n (importa n8n-workflows/rag-workflow.json)"
echo "2. Ejecuta el frontend local: cd local/frontend && npm start"
echo ""
echo "Para detener los servicios: docker-compose down"
echo ""