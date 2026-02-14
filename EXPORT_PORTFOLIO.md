# Organizatext - Documentación de Portfolio

Este documento resume el proyecto **Organizatext** para portafolio profesional.

---

## 🎯 Resumen Ejecutivo

**Organizatext** es una aplicación dual (web + desktop) para procesamiento y organización automatizada de documentos de texto mediante análisis NLP y RAG (Retrieval-Augmented Generation).

### Versión Web
- Aplicación web pública que procesa archivos `.txt` **100% offline** en el navegador
- Sin envío de datos a servidores (privacy-first)
- Extracción automática de metadatos: URLs, emails, keywords, entidades nombradas
- Exportación organizada en carpetas por categoría

### Versión Local (Desktop)
- Aplicación nativa Windows con soporte multi-formato (TXT, PDF, DOCX, MD)
- Sistema RAG completo con LLM local (Josiefied Qwen3-14B)
- Vector database (ChromaDB) para búsqueda semántica
- Orquestación de workflows con n8n
- Backend MCP (Model Context Protocol) en Go

---

## 🛠️ Stack Técnico

### Frontend Web
- **Next.js 16** (App Router)
- **Tailwind CSS** (diseño responsivo)
- **Web Workers** (procesamiento paralelo sin bloquear UI)
- **IndexedDB** (persistencia local vía localForage)
- **react-window** (virtualización de listas grandes)

### Backend Web
- **FastAPI** (Python) - API REST asíncrona
- **MongoDB** - Base de datos NoSQL
- **JWT** - Autenticación stateless
- **Web Crypto API** - Cifrado cliente-side (AES-GCM)

### Desktop (Local)
- **Wails v3** - Framework Go para apps desktop (WebView2)
- **Fiber** (Go) - Web framework ultra-rápido para MCP backend
- **Ollama** - Runtime LLM local
- **ChromaDB** - Vector database embebible
- **n8n** - Orquestador de workflows visual
- **sentence-transformers** - Embeddings locales

### DevOps
- **Docker Compose** - Orquestación de servicios locales
- **GitHub Actions** - CI/CD automatizado
- **Jenkins** - Integración continua empresarial
- **Vercel** - Deploy frontend (recomendado)
- **Render** - Deploy backend (tier gratuito)

---

## 🏗️ Arquitectura

### Flujo Web (Procesamiento Cliente)
```
Usuario → Next.js UI → Web Worker Pool (2) → IndexedDB
                    ↓ (solo si sync)
              Web Crypto (cifrado)
                    ↓
              FastAPI + MongoDB (metadata cifrada)
```

### Flujo Local (RAG Pipeline)
```
Usuario → React UI (Wails) → Fiber (Go MCP) → n8n Workflow
                                              ↓
                                    ChromaDB (vector search)
                                              ↓
                                    Ollama (LLM inference)
                                              ↓
                                    MCP Tools (save/read docs)
```

---

## 🔑 Características Destacadas

### Técnicas
1. **Privacy-by-Design**: procesamiento cliente-side, cifrado E2E opcional
2. **Concurrencia Optimizada**: Web Workers con pool limitado (evita saturación)
3. **Virtualización de UI**: manejo eficiente de 3000+ items sin re-renders costosos
4. **RAG Local**: inferencia LLM sin depender de APIs externas (latencia baja, privacidad total)
5. **MCP (Model Context Protocol)**: arquitectura extensible para herramientas LLM
6. **Cross-Platform Build**: Wails genera binarios nativos sin Electron (footprint reducido)

### UX
1. **Límites claros y educativos**: modales informativos que guían al usuario
2. **Dataset de ejemplo**: 10 archivos `.txt` pre-cargados para demo inmediata
3. **Exportación estructurada**: carpetas por categoría + metadata.json
4. **Detección PII**: alerta al usuario sobre información sensible

---

## 📊 Métricas del Proyecto

- **Líneas de código**: ~8,000 (estimado, excluyendo node_modules)
- **Lenguajes**: JavaScript/TypeScript (60%), Go (20%), Python (15%), Shell (5%)
- **Tamaño repo**: ~50 MB (sin modelos LLM)
- **Tamaño app compilada**: 
  - Web build: ~2 MB (gzipped)
  - Desktop binario: ~18 MB (excluyendo Ollama)
- **Modelo LLM**: ~9 GB (Qwen3-14B Q4)

---

## 🎓 Aprendizajes Clave

1. **Web Workers en producción**: manejo de concurrencia, transferencia de ArrayBuffers, pool pattern
2. **Cifrado cliente-side**: Web Crypto API, derivación de claves (PBKDF2), AES-GCM
3. **Go para APIs**: performance de Fiber vs frameworks tradicionales
4. **LLMs locales**: cuantización, context window management, prompt engineering
5. **Vector databases**: embeddings, similarity search, chunking strategies
6. **Desktop con Go**: Wails como alternativa ligera a Electron
7. **CI/CD híbrido**: GitHub Actions + Jenkins para diferentes entornos

---

## 🚀 Deploy y Disponibilidad

### Ambientes
- **Desarrollo**: localhost con Docker Compose
- **Staging**: Vercel (frontend) + Render (backend)
- **Producción**: (pendiente según necesidades del cliente)

### URLs Demo
- **Web**: [Pendiente deploy]
- **API Docs**: [Pendiente deploy]/docs (FastAPI auto-docs)
- **Repositorio**: https://github.com/Andr-Abr/organizatext

---

## 🧪 Testing

- **Frontend**: Jest + React Testing Library
- **Backend**: pytest (cobertura >80%)
- **Go**: testing nativo de Go
- **E2E**: (pendiente implementación con Playwright)

---

## 📈 Posibles Mejoras Futuras

1. **Soporte multi-idioma**: i18n completo (actualmente solo español)
2. **OCR integrado**: procesamiento de PDFs escaneados
3. **Plugin system**: extensibilidad para procesadores custom
4. **Sync P2P**: alternativa al backend centralizado (CRDT)
5. **Mobile app**: React Native con misma lógica de procesamiento
6. **Embeddings más ligeros**: alternativas a sentence-transformers
7. **Collaborative features**: edición multi-usuario en tiempo real

---

## 🤝 Colaboración

Este proyecto fue desarrollado como parte de [describir contexto: freelance, tesis, proyecto personal, etc.].

**Rol**: Desarrollador Full-Stack  
**Duración**: [Febrero 2026 - en progreso]  
**Equipo**: Individual / [listar colaboradores si aplica]

---

## 📸 Screenshots

[Pendiente: agregar capturas de pantalla de:]
- UI principal (drag & drop)
- Vista de resultados con etiquetas
- Modal de límites
- Exportación ZIP
- Dashboard local
- n8n workflow canvas

---

## 📄 Licencia

MIT License - Ver archivo `LICENSE` para detalles

---

## 📧 Contacto

- **GitHub**: [@Andr-Abr](https://github.com/Andr-Abr)
- **LinkedIn**: [Pendiente agregar]
- **Email**: [Pendiente agregar]

---

**Nota para reclutadores**: Este proyecto demuestra competencias en arquitectura full-stack, procesamiento distribuido, ML/AI local, DevOps, y diseño centrado en privacidad.