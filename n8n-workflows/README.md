# Workflows n8n - Organizatext

## Auto-categorización de documentos

**Archivo:** `Auto-categorización de documentos.json`

### ¿Qué hace?

Categoriza automáticamente documentos usando un servidor MCP local y un modelo Qwen corriendo en Ollama. El modelo analiza el contenido y las etiquetas de cada documento y le asigna la categoría más apropiada de las ya existentes en la app.

### Flujo:

1. **Manual Trigger** → Activa el workflow manualmente
2. **MCP: get_documents** → POST a `http://127.0.0.1:8001/mcp/tools/call` para obtener documentos y categorías existentes
3. **Construir Prompt** → Prepara el prompt con los documentos y las categorías disponibles
4. **Llamar a Qwen** → Envía el prompt al modelo Qwen vía Ollama (`http://127.0.0.1:11434/api/generate`)
5. **Parsear Respuesta** → Extrae y valida las decisiones de categorización del JSON devuelto
6. **MCP: update_category** → POST a `http://127.0.0.1:8001/mcp/tools/call` para actualizar la categoría de cada documento

### Requisitos:
1. **Backend corriendo** en `http://127.0.0.1:8001` (con servidor MCP habilitado)
2. **Ollama corriendo** en `http://127.0.0.1:11434` con el modelo `Qwen` descargado
3. **Documentos con tags** (usar botón "Etiquetar Textos" en la app)
4. **n8n** instalado y corriendo

### Instalación:
```bash
# Instalar n8n globalmente
npm install -g n8n

# Iniciar n8n
n8n start

# Acceder a http://localhost:5678
```

### Uso:

1. Abrir n8n en `http://localhost:5678`
2. **Import workflow:**
   - Click en **⋮** → **Import from File**
      - Seleccionar `Auto-categorización MCP + Qwen.json`
3. Ejecutar el backend: `cd C:\Organizatext-App && .\organizatext-desktop.exe`
4. En n8n, click en **"Test workflow"**
5. Verificar en la app que las categorías se actualizaron

### Troubleshooting:

**Error: ECONNREFUSED ::1:8001**
- Cambiar `localhost` por `127.0.0.1` en los nodos HTTP Request

**Error: ECONNREFUSED ::1:11434**
- Verificar que Ollama esté corriendo y el modelo Qwen esté descargado

**Documentos no se categorizan:**
- Verificar que tengan tags (etiquetas)
- Usar el botón "Etiquetar Textos" en la app primero

**Workflow no se activa:**
- Verificar que el backend esté corriendo
- Revisar logs en la terminal de n8n