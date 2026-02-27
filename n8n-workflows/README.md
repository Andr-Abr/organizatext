# Workflows n8n - Organizatext

## Auto-categorización de documentos

**Archivo:** `Auto-categorización de documentos.json`

### ¿Qué hace?

Categoriza automáticamente documentos basándose en sus tags (keywords) mediante análisis de similitud con palabras clave predefinidas.

### Flujo:

1. **Manual Trigger** → Activa el workflow manualmente
2. **Obtener Documentos** → GET a `http://127.0.0.1:8001/api/v1/documents`
3. **Analizar Keywords** → Compara tags con categorías predefinidas
4. **Actualizar Categoría** → PUT a `/documents/{id}/metadata`

### Categorías soportadas:

- **Finanzas:** finanzas, dinero, inversión, banco, crédito, ahorro, bitcoin, crypto
- **Proyectos:** proyecto, desarrollo, implementación, plan, roadmap
- **Ideas:** idea, concepto, brainstorm, propuesta, innovación
- **Investigación:** investigación, estudio, análisis, research, paper
- **Personal:** personal, salud, familia, viaje, hobby
- **Trabajo:** trabajo, reunión, cliente, reporte, deadline

### Requisitos:

1. **Backend corriendo** en `http://127.0.0.1:8001`
2. **Documentos con tags** (usar botón "Etiquetar Textos" en la app)
3. **n8n** instalado y corriendo

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
   - Seleccionar `auto-categorization.json`
3. Ejecutar el backend: `cd C:\Organizatext-App && .\organizatext-desktop.exe`
4. En n8n, click en **"Test workflow"**
5. Verificar en la app que las categorías se actualizaron

### Troubleshooting:

**Error: ECONNREFUSED ::1:8001**
- Cambiar `localhost` por `127.0.0.1` en los nodos HTTP Request

**Documentos no se categorizan:**
- Verificar que tengan tags (etiquetas)
- Usar el botón "Etiquetar Textos" en la app primero

**Workflow no se activa:**
- Verificar que el backend esté corriendo
- Revisar logs en la terminal de n8n