# Organizatext

> Sistema inteligente de procesamiento y categorización de documentos con IA local y en la nube

## 🌐 Demo en Vivo

- **App Web:** https://organizatext-web.vercel.app
- **API Backend:** https://organizatext.vercel.app/docs
- **Repositorio:** https://github.com/Andr-Abr/organizatext

## 🎯 Resumen Ejecutivo

**Organizatext** es una aplicación dual (web + desktop) para procesamiento y organización automatizada de documentos de texto mediante análisis NLP y RAG (Retrieval-Augmented Generation).

### Versión Web
- Aplicación web pública que procesa archivos `.txt` **100% offline** en el navegador
- Sin envío de datos a servidores (privacy-first)
- Extracción automática de metadatos: URLs, emails, keywords, entidades nombradas
- Exportación organizada en carpetas por categoría

### Versión Local (Desktop)
- Aplicación nativa Windows con soporte multi-formato (TXT, PDF, DOCX, MD)
- Sistema RAG completo con LLM local
- Vector database (LanceDB) para búsqueda semántica
- Orquestación de workflows con n8n
- Backend MCP (Model Context Protocol) en Go

## 🔑 Características Principales

### 📱 App Web (Next.js)
- Procesamiento NLP offline con Web Workers
- Extracción de: URLs, emails, números, keywords (RAKE), entidades (NER con compromise)
- Detección de PII (emails, teléfonos, URLs)
- Sistema de categorías dinámico
- Sincronización opcional de **metadata cifrada** (nunca el contenido de archivos) con MongoDB Atlas
- Dataset de ejemplo incluido en `/public/sample-data/`
- Exportación a ZIP organizado

**Límites públicos:**
- 50 MB total por sesión
- 10 MB por archivo
- Máximo 200 archivos por subida
- Virtualización de lista para manejar 3000+ items sin lag

### 🖥️ App Desktop Local (Wails + Go)
- RAG completo con Ollama + LanceDB
- Etiquetado automático con LLM local
- Búsqueda semántica vectorial
- 100% offline y privado

**Instalación Desktop App:**
- Puedes descargar la última versión desde la [página de lanzamientos (Releases)](https://github.com/Andr-Abr/organizatext/releases/tag/v1.0.0).

### 🔄 CI/CD (Jenkins)
- Pipeline automatizado
- Deploy automático a Vercel
- Polling de GitHub cada 5 min

## 📸 Capturas de Pantalla

### Web App
<img width="1889" height="807" alt="Web" src="https://github.com/user-attachments/assets/e5d98e65-c6fd-467b-b968-d0dc3f06c1b5" />


### Desktop App
<img width="1896" height="2152" alt="Local" src="https://github.com/user-attachments/assets/1d186028-40b3-4e89-8d22-7c059daad275" />

## 📊 Stack Tecnológico

**Frontend:**
- Next.js 16 (App Router)
- React 19
- Tailwind CSS (diseño responsivo)
- IndexedDB (localForage)
- Web Workers

**Backend:**
- FastAPI (Python)
- MongoDB Atlas
- JWT Authentication
- AES-GCM Encryption

**Desktop:**
- Wails v3 (Go + React)
- Fiber (Go)
- Ollama (LLM local)
- LanceDB (Vector DB)
- sentence-transformers

**DevOps:**
- Jenkins (CI/CD)
- Vercel (Deploy)
- n8n (Automatización)

## 📈 Roadmap

### ✅ Completado
- Web app offline
- Backend API REST
- App desktop Windows
- Deploy producción
- CI/CD Jenkins

### 🔄 En Desarrollo
- Tests unitarios (Jest + Pytest)
- Documentación API completa

### 📱 Futuro
- **i18n:** Soporte multi-idioma (ES/EN)
- **OCR:** Procesamiento de PDFs escaneados
- **Android App:** Kotlin nativo (ver abajo)

## 📱 Android App (Planificado)

#### **MODO BÁSICO**
Procesamiento NLP local sin conexión:

- 📄 Lectura de archivos .txt (Storage Access Framework)
- 🔍 Extracción de keywords, entidades, URLs, emails (OpenNLP)
- 📊 Categorización manual
- 💾 Persistencia local (Room Database)
- 📦 Exportar a ZIP
- 🎨 Material 3 UI (Jetpack Compose)
- 🌓 Dark/Light mode
- 📱 Arquitectura ARM 32-bit/64-bit híbrida

**Compatible con:** Android 8+ (API 26+)

---

#### **MODO ULTRA (EXPERIMENTAL)**
LLM local en dispositivo (solo 64-bit):

- 🤖 Integración llama.cpp (JNI/NDK)
- 📥 Usuario descarga modelo .gguf (Qwen3-2B, Gemma-2B)
- 🧠 Carga de modelo a RAM (requiere 8GB+)
- 💬 RAG básico con documentos locales
- ⚡ Detección automática de hardware
- 🔐 100% offline y privado

**Requisitos:**
- Android 13+ (64-bit)
- 8GB RAM mínimo
- Snapdragon 8 Gen+ o equivalente

## 📄 Licencia

MIT

## 👤 Autor

- GitHub: [@Andr-Abr](https://github.com/Andr-Abr)
- Email: 1218236@gmail.com
