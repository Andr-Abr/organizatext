# Organizatext — Web + Local (Windows)

**Web**: procesa **.txt** en navegador, 100% offline por defecto.  
**Local**: complemento pro para Windows que acepta TXT/PDF/MD/DOCX, indexa localmente y usa Josiefied Qwen3-14B (Q4) vía Ollama nativo para RAG.

---

## 📋 Tabla de Contenidos

1. [Acerca del Proyecto](#acerca-del-proyecto)
2. [Quick Start (Usuario No Técnico)](#quick-start-usuario-no-técnico)
3. [Privacidad y Seguridad](#privacidad-y-seguridad)
4. [Límites de Uso](#límites-de-uso)
5. [Instalación y Deploy](#instalación-y-deploy)
6. [Decisiones Técnicas](#decisiones-técnicas)
7. [Empaquetado Wails](#empaquetado-wails)

---

## 🎯 Acerca del Proyecto

### Versión Web (Pública)
- **100% offline** por defecto: tus archivos `.txt` **NUNCA** salen del navegador
- Procesamiento en cliente con Web Workers (concurrencia: 2 archivos simultáneos)
- Extracción de: URLs, emails, números, keywords (RAKE), entidades (NER con compromise)
- Detección básica de PII (Información Personal Identificable)
- Exportación a ZIP con carpetas organizadas por categoría
- Sincronización opcional de **metadata cifrada** (nunca el contenido de archivos)
- Dataset de ejemplo incluido en `/public/sample-data/`

**Límites públicos:**
- 50 MB total por sesión
- 10 MB por archivo
- Máximo 200 archivos por subida
- Virtualización de lista para manejar 3000+ items sin lag

### Versión Local (Windows - Complementaria/Pro)
- Soporta **TXT, PDF, MD, DOCX**
- LLM local: **Josiefied Qwen3-14B (Q4)** vía Ollama nativo (~9GB)
- Vector DB local: ChromaDB
- RAG: indexación + búsqueda semántica
- Orquestación con n8n
- Backend MCP en Go (Fiber)
- **No requiere conexión a internet** para funcionar

---

## 🚀 Quick Start (Usuario No Técnico)

### Versión Web (Simple)

1. **Ejecutar localmente:**
```bash
   cd web
   npm install
   npm run dev
```
   Abre http://localhost:3000

2. **Usar:**
   - Arrastra archivos `.txt` (máx 50 MB total, 10 MB por archivo)
   - Click en "Procesar"
   - Revisa las etiquetas detectadas
   - Asigna categorías
   - Exporta como ZIP

3. **Deploy en Vercel (gratis):**
   - Conecta tu repo de GitHub en https://vercel.com
   - Vercel detecta automáticamente Next.js
   - Click en "Deploy"

### Versión Local (Avanzada - Windows)

**Requisitos previos:**
- Windows 10/11
- 16 GB RAM mínimo (32 GB recomendado)
- GPU NVIDIA con 8GB+ VRAM (opcional pero recomendado)
- Ollama instalado: https://ollama.com/download

**Instalación rápida:**

1. **Instalar modelo LLM:**
```powershell
   .\scripts\install_model.ps1
```

2. **Levantar servicios locales:**
```powershell
   .\scripts\start-local.ps1
```
   Esto arranca: n8n, Fiber (MCP API), ChromaDB, MongoDB

3. **Ejecutar frontend local:**
```powershell
   cd local\frontend
   npm install
   npm start
```

---

## 🔒 Privacidad y Seguridad

### Versión Web
- **Por defecto**: archivos `.txt` **NUNCA** salen del navegador
- Procesamiento 100% en cliente (Web Workers)
- Almacenamiento local: IndexedDB (localForage)

### Sincronización Opcional
Si activas sincronización:
1. Tu password **deriva una clave** (PBKDF2)
2. La metadata se **cifra** (AES-GCM) en el cliente
3. Solo el **ciphertext** se envía al backend
4. El backend almacena metadata cifrada sin poder descifrarla
5. Solo tú puedes descifrar con tu password

**El backend NUNCA recibe ni almacena el contenido de tus archivos `.txt`**

### Versión Local
- Todos los datos permanecen en tu máquina
- LLM ejecuta localmente (sin enviar datos a APIs externas)
- Vector DB local (ChromaDB)
- Sin telemetría ni tracking

---

## ⚠️ Límites de Uso

### Versión Web Pública

**Banner visible en la UI:**
> Límite de uso: máximo **50 MB total**, **10 MB por archivo**, hasta **200 archivos**. Para procesar más, y otros formatos (pdf, word, md) ejecuta la app localmente (ver README).

**Si superas los límites, verás este modal:**
```
Has intentado subir archivos que superan los límites:
- 50 MB total, 10 MB por archivo, hasta 200 archivos

Elige una opción:
1) Seleccionar un subconjunto de archivos (recomendada)
2) Usar el dataset de ejemplo incluido en el repo (`sample-data/`)
3) Ejecutar la app localmente (ver README)
```

**Opciones:**
- **Seleccionar archivos**: elige menos archivos o archivos más pequeños
- **Usar sample-data**: carga el dataset de ejemplo (10 archivos .txt incluidos)
- **Cómo ejecutar localmente**: guía de instalación para versión Windows

### Versión Local (Sin Límites)
- Procesa archivos de cualquier tamaño
- Sin límite de archivos totales
- Soporta PDF, DOCX, MD, TXT

---

## 🛠️ Instalación y Deploy

### Backend Web (FastAPI + MongoDB)

**Deploy en Render (gratis) + MongoDB Atlas:**

1. **MongoDB Atlas (M0 Free):**
   - Crea cuenta en https://www.mongodb.com/cloud/atlas
   - Crea cluster (M0 Free tier)
   - En "Security" → "Database Access": crea usuario
   - En "Security" → "Network Access": permite `0.0.0.0/0`
   - Copia tu connection string: `mongodb+srv://user:pass@cluster.mongodb.net/organizatext`

2. **Render:**
   - Conecta tu repo en https://render.com
   - Crea "New Web Service"
   - Root Directory: `backend`
   - Build Command: `pip install -r requirements.txt`
   - Start Command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
   - Variables de entorno:
```
     MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/organizatext
     JWT_SECRET=tu-secret-aleatorio-largo
```

### Frontend Web (Next.js)

**Deploy en Vercel:**

1. Conecta tu repo en https://vercel.com
2. Vercel detecta automáticamente Next.js
3. Root Directory: `web`
4. Variables de entorno:
```
   NEXT_PUBLIC_API_URL=https://tu-backend.onrender.com
```
5. Click en "Deploy"

### Local (Docker Compose)
```bash
# En la raíz del proyecto
docker-compose up -d
```

Esto levanta:
- n8n: http://localhost:5678
- Fiber (MCP API): http://localhost:3001
- ChromaDB: http://localhost:8000
- MongoDB: localhost:27017

**Sin Docker (manual):**

Ver archivos `start-local.ps1` (Windows) o `start-local.sh` (Linux/Mac)

---

## 🧠 Decisiones Técnicas

### Modelo LLM: Josiefied Qwen3-14B (Q4)

**¿Por qué este modelo?**
- **Tamaño**: ~9GB (Q4 cuantizado) — cabe en GPUs de 8GB VRAM
- **Rendimiento**: equilibrio entre capacidad y velocidad
- **Multilingüe**: soporta español nativo
- **Context window**: 4k tokens configurado en Ollama
- **Licencia**: Apache 2.0 (uso comercial permitido)

**Alternativas consideradas:**
- Llama 3.1 8B: menor capacidad de razonamiento
- Mistral 7B: peor en español
- Qwen 7B: menos parámetros, menos precisión

### ¿Por qué NO dockerizar Ollama?

**Razones técnicas:**
1. **GPU passthrough complejo**: Docker Desktop en Windows tiene limitaciones con CUDA
2. **Performance overhead**: virtualización reduce velocidad de inferencia 15-30%
3. **Gestión de modelos**: más simple descargar modelos con `ollama pull` nativo
4. **VRAM compartida**: Ollama nativo administra mejor memoria GPU
5. **Simplicidad**: instalador nativo de Ollama es trivial (1 click)

**Instalación nativa (recomendada):**
```powershell
# Descargar de https://ollama.com/download
# Instalar (Next → Next → Finish)
ollama pull josiefied/qwen3:14b-q4_k_m
```

### Stack Técnico

**Frontend Web:**
- **Next.js 16**: SSR + App Router para mejor SEO
- **Tailwind CSS**: utilidades rápidas sin CSS custom
- **Web Workers**: procesamiento paralelo sin bloquear UI
- **IndexedDB**: persistencia local robusta (via localForage)
- **react-window**: virtualización para listas grandes

**Backend Web:**
- **FastAPI**: async nativo, auto-docs con OpenAPI
- **MongoDB**: esquema flexible para metadata variada
- **JWT**: autenticación stateless

**Local:**
- **Fiber (Go)**: extremadamente rápido para APIs
- **n8n**: orquestación visual de workflows
- **ChromaDB**: vector DB simple y eficiente
- **Wails**: empaquetado nativo sin Electron (binarios más pequeños)

### Asunciones del Proyecto

- **OS principal**: Windows 10/11 (scripts .ps1 incluidos)
- **Node.js**: >=18 (para Web Workers y módulos ES)
- **Python**: >=3.10 (para FastAPI y sentence-transformers)
- **Go**: >=1.20 (para Fiber)
- **Docker Desktop**: para usuarios que prefieren containers
- **GPU NVIDIA**: opcional pero recomendado (modo CPU funciona, más lento)
- **CUDA Toolkit**: si tienes GPU NVIDIA, instalar para mejor rendimiento

### Limitaciones Conocidas

1. **Hosting gratuito**: Render free tier duerme instancias inactivas (arranque lento ~30s)
2. **Modelos grandes**: no incluidos en repo (usuario debe descargar con scripts)
3. **Embeddings**: requieren ~2GB RAM adicionales (sentence-transformers)
4. **Context window**: limitado a 4k tokens en Ollama (ajustable en config)

---

## 📦 Empaquetado Wails

### Requisitos

- Wails v3 instalado: https://wails.io/docs/gettingstarted/installation
- WebView2 Runtime (incluido en Windows 11)
- Visual Studio Build Tools (para compilación)

### Compilar binario Windows
```powershell
cd local\frontend
wails build
```

Genera: `local\frontend\build\bin\organizatext-local.exe`

### Distribución

**Opción 1: Instalador Wails**
```powershell
wails build -nsis
```

**Opción 2: ZIP portátil**
```powershell
wails build
cd build\bin
Compress-Archive -Path .\* -DestinationPath organizatext-local-v1.0.0-windows.zip
```

### Notas de Empaquetado

- **Tamaño**: ~15-20 MB (sin incluir modelo LLM)
- **Runtime**: WebView2 (pre-instalado en Windows 11)
- **Dependencias externas**: Ollama debe estar instalado separadamente
- **Firma de código**: recomendado para distribución pública (evita warnings de SmartScreen)

---

## 🧪 Testing

### Web (Frontend)
```bash
cd web
npm test
```

### Backend (FastAPI)
```bash
cd backend
pytest
```

### Local (Fiber/Go)
```bash
cd local\backend
go test ./...
```

---

## 📊 Diagrama de Arquitectura
```
┌─────────────────────────────────────────────────────────────┐
│                       VERSIÓN WEB                            │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  NAVEGADOR (Cliente)                                  │  │
│  │  ┌────────────┐  ┌──────────┐  ┌──────────────────┐ │  │
│  │  │  Next.js   │  │  Web     │  │  IndexedDB       │ │  │
│  │  │  UI        │→ │  Workers │→ │  (localForage)   │ │  │
│  │  └────────────┘  └──────────┘  └──────────────────┘ │  │
│  │        ↓ (solo si sync activado)                     │  │
│  │  ┌────────────────────────────────────────┐          │  │
│  │  │  Web Crypto API (AES-GCM)              │          │  │
│  │  │  Cifrado de metadata                   │          │  │
│  │  └────────────────────────────────────────┘          │  │
│  └──────────────────┬───────────────────────────────────┘  │
│                     ↓ HTTPS (metadata cifrada)             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  BACKEND (FastAPI)                                    │  │
│  │  ┌────────────┐  ┌────────────┐                      │  │
│  │  │  Auth      │  │  MongoDB   │                      │  │
│  │  │  (JWT)     │→ │  (metadata │                      │  │
│  │  │            │  │   cifrada) │                      │  │
│  │  └────────────┘  └────────────┘                      │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                     VERSIÓN LOCAL (Windows)                  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  FRONTEND (React + Wails)                             │  │
│  └────────────┬─────────────────────────────────────────┘  │
│               ↓ HTTP                                        │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  BACKEND MCP (Fiber/Go)                               │  │
│  │  ┌──────────────┐  ┌──────────────┐                  │  │
│  │  │  /health     │  │  /mcp/*      │                  │  │
│  │  │  /chat       │→ │  tools       │                  │  │
│  │  └──────────────┘  └──────────────┘                  │  │
│  └───────────┬──────────────────┬───────────────────────┘  │
│              ↓                  ↓                           │
│  ┌──────────────────┐  ┌──────────────────┐               │
│  │  n8n Workflow    │  │  ChromaDB        │               │
│  │  (RAG pipeline)  │→ │  (vector store)  │               │
│  └──────────┬───────┘  └──────────────────┘               │
│             ↓                                               │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Ollama (nativo)                                      │  │
│  │  Josiefied Qwen3-14B Q4                               │  │
│  │  localhost:11434                                      │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## 🤝 Contribuir

1. Fork del proyecto
2. Crea tu feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la branch (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

---

## 📄 Licencia

MIT License - ver archivo `LICENSE` para detalles

---

## 📧 Contacto

GitHub: [@Andr-Abr](https://github.com/Andr-Abr)

---

## 🙏 Agradecimientos

- [Ollama](https://ollama.com) - Runtime LLM local
- [ChromaDB](https://www.trychroma.com/) - Vector database
- [n8n](https://n8n.io/) - Workflow automation
- [Wails](https://wails.io/) - Empaquetado Go + WebView2
- Comunidad de Josiefied Qwen3