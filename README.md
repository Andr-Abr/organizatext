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

### Versión Mobile (Android)
- **Procesamiento de archivos .txt**: Extracción de keywords con RAKE + Regex
- **Modos Avanzados**: LLM local para análisis semántico avanzado
- **Categorización**: Asignación manual y automática de categorías
- **Chat**: Interfaz conversacional con documentos usando LLM
- **Exportación**: ZIP por categorías con metadata
- **Detección de PII**: Emails, teléfonos, documentos

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

## 📱 Android App

App nativa Kotlin + Jetpack Compose, 100% offline y privada.

**Descargar APK:** [Releases](https://github.com/Andr-Abr/organizatext/releases/tag/v1.0.0-android)

### MODO BÁSICO
Funciona en cualquier Android 8+ (ARM 32/64-bit):

- 📄 Carga de archivos .txt (Storage Access Framework, selección múltiple)
- 🔍 Extracción automática de keywords (RAKE) + detección de URLs, emails, teléfonos
- ⚠️ Detección de PII (datos personales)
- 📂 Categorías con persistencia (DataStore) + exportación ZIP por categoría
- ✏️ Edición manual de keywords por documento
- 🔎 Visor de texto con búsqueda, navegación entre resultados y scrollbar
- 💾 Persistencia local con Room Database
- 🎨 Material 3 UI con soporte dark/light mode automático

**Compatible con:** Android 8+ (API 26+), ARM 32-bit y 64-bit

---

### MODOS LLM (on-device)
LLM local en dispositivo vía MediaPipe LLM Inference API. Cuatro niveles según RAM disponible:

| Modo | Modelo | RAM mínima | Token HF |
|---|---|---|---|
| Compacto | Qwen 2.5 0.5B (~521MB) | 1 GB | No requerido |
| Ultra | Gemma 3 1B (~529MB) | 2 GB | Requerido |
| Mítico | Qwen 2.5 1.5B (~1.6GB) | 2.5 GB | No requerido |
| HAX | Gemma 4 E4B (~2.8GB) | 3.5 GB | Requerido |

- 🧠 Extracción de keywords semántica para documentos
- 💬 Chat con documentos seleccionados
- ⚡ Detección automática de hardware y modo recomendado
- 🔐 100% offline una vez descargado el modelo

---

## 📸 Capturas de Pantalla

### Web App
<img width="1889" height="807" alt="Web" src="https://github.com/user-attachments/assets/e5d98e65-c6fd-467b-b968-d0dc3f06c1b5" />


### Desktop App
<img width="1896" height="2152" alt="Local" src="https://github.com/user-attachments/assets/1d186028-40b3-4e89-8d22-7c059daad275" />


### Mobile App
<img width="6424" height="2163" alt="000" src="https://github.com/user-attachments/assets/772a03c0-fcb5-41d8-9ce7-39e427debe71" />


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

**Mobile:**
- Kotlin + Jetpack Compose + Material 3
- Room, Hilt, DataStore, Navigation Compose
- MediaPipe tasks-genai 0.10.27
- AGP 8.7.3, Kotlin 2.0.21

## 📈 Roadmap

### ✅ Completado
- Web app offline
- Backend API REST
- App desktop Windows
- Deploy producción
- CI/CD Jenkins
- App Mobile Android

### 🏗️ Arquitectura del proyecto
**Web App:**
- Arquitectura: JAMstack + Serverless
- Patrón: Client-side rendering + API REST

**App Local:**
- Arquitectura: Monolito modular (Desktop app standalone)
- Patrón: Cliente-servidor local (React frontend + Go backend)

**App Mobile:**
- Arquitectura: Clean Architecture con MVVM (Model-View-ViewModel)
- Patrón: Unidirectional Data Flow (UDF)

### 🔄 En Desarrollo
- **i18n:** Soporte multi-idioma (ES/EN)
- **OCR:** Procesamiento de PDFs escaneados

## 📄 Licencia

MIT

## 👤 Autor

- GitHub: [@Andr-Abr](https://github.com/Andr-Abr)
- Email: 1218236@gmail.com
