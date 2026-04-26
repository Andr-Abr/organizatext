# Organizatext Android

App Android nativa para procesamiento y organización de archivos `.txt` con NLP local y LLM on-device.

100% offline · Privacy-first · Material 3

---

## Requisitos para compilar

- Android Studio Panda 2 (2025.3.2) o superior
- JDK 11
- Android SDK API 26-35
- Cuenta en [Hugging Face](https://huggingface.co) (solo para modelos Gemma)

## Instalación

### Opción A — APK directo
Descargá el APK desde [Releases](https://github.com/Andr-Abr/organizatext/releases/tag/v1.0.0-android) e instalalo habilitando "Fuentes desconocidas" en tu dispositivo.

### Opción B — Compilar desde fuente
```bash
git clone https://github.com/Andr-Abr/organizatext.git
cd organizatext/Android
```
Abrí la carpeta `Android` en Android Studio → **Build → Make Project** → **Run**.

---

## Uso — Modo Básico

1. Tocá **+ Cargar .txt** para seleccionar uno o varios archivos
2. La app extrae automáticamente keywords, URLs, emails y detecta PII
3. Asigná categorías desde cada tarjeta de documento
4. Creá categorías personalizadas desde el ícono de categorías (toolbar)
5. Exportá una categoría a ZIP con el ícono de descarga en la pantalla de categorías
6. Editá las keywords de cualquier documento con el ícono de lápiz
7. Seleccioná documentos en Categorías para chatear con ellos

---

## Uso — Modos LLM

La app detecta automáticamente el hardware y muestra los modos disponibles en **Ajustes**.

### Modelos disponibles

| Modo | Modelo | Tamaño | RAM mínima | Token HF |
|---|---|---|---|---|
| Compacto | Qwen 2.5 0.5B | ~521 MB | 1 GB libre | No |
| Ultra | Gemma 3 1B | ~529 MB | 2 GB libre | Sí |
| Mítico | Qwen 2.5 1.5B | ~1.6 GB | 2.5 GB libre | No |
| HAX | Gemma 4 E4B | ~2.8 GB | 3.5 GB libre | Sí |

### Para modelos Qwen (sin token)

1. En **Ajustes** tocá el ícono de descarga junto al modelo
2. Esperá la descarga
3. Tocá **Cargar modelo**

### Para modelos Gemma (requieren token HF)

#### Paso 1: Crear cuenta en Hugging Face
1. Entrá a [huggingface.co](https://huggingface.co) y creá una cuenta gratuita
2. Verificá tu email

#### Paso 2: Aceptar licencias
- Gemma 3 1B: [litert-community/Gemma3-1B-IT](https://huggingface.co/litert-community/Gemma3-1B-IT)
- Gemma 4 E4B: [litert-community/gemma-4-E4B-it-litert-lm](https://huggingface.co/litert-community/gemma-4-E4B-it-litert-lm)

Leé y aceptá los términos de uso en cada página.

#### Paso 3: Generar token de acceso
1. En Hugging Face andá a **Settings → Access Tokens**
2. Tocá **New token**
3. Poné cualquier nombre, elegí tipo **Read**
4. Copiá el token (empieza con `hf_...`)

#### Paso 4: Configurar en la app
1. En **Ajustes** tocá **Configurar** junto a "Token de Hugging Face"
2. Pegá tu token y guardá
3. Tocá el ícono de descarga junto al modelo Gemma que querés
4. Esperá la descarga (WiFi recomendado)
5. Tocá **Cargar modelo**

### Usar el LLM

Una vez cargado, el modelo se aplica automáticamente al procesar documentos de más de 10 palabras. Para chatear con documentos, seleccioná uno o varios en la pantalla de Categorías y tocá el ícono de chat.

**Nota:** el modelo permanece en memoria mientras la app está abierta. Podés liberarlo desde Ajustes con **Liberar de memoria**.

---

## Requisitos del dispositivo

| | Modo Básico | Compacto | Ultra | Mítico | HAX |
|---|---|---|---|---|---|
| Android | 8+ | 10+ | 10+ | 10+ | 10+ |
| Arquitectura | 32/64-bit | 32/64-bit | 32/64-bit | 64-bit | 64-bit |
| RAM libre | — | 1 GB | 2 GB | 2.5 GB | 3.5 GB |
| Espacio | ~50 MB | ~570 MB | ~580 MB | ~1.65 GB | ~2.85 GB |

---

## Estructura del proyecto
pp/src/main/java/com/organizatext/
├── data/          # Room, Repository, DataStore
├── domain/        # Use cases
├── hardware/      # Detección de capacidades del dispositivo
├── llm/           # MediaPipe engine, descarga de modelos, prompts
├── nlp/           # RAKE, RegexExtractor, TextProcessor
├── ui/            # Screens, Components, Navigation, Theme
├── utils/         # TxtFileReader, ZipExporter
└── viewmodel/     # Document, Processor, Ultra, Category, Chat

---

## Licencia

MIT — ver [LICENSE](../LICENSE)