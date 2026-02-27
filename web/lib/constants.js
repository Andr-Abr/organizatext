// web/lib/constants.js
// Constantes globales de la aplicación

// Límites de procesamiento (versión pública)
export const LIMITS = {
  MAX_FILE_SIZE_MB: parseInt(process.env.NEXT_PUBLIC_MAX_FILE_SIZE_MB || '10'),
  MAX_TOTAL_SIZE_MB: parseInt(process.env.NEXT_PUBLIC_MAX_TOTAL_SIZE_MB || '50'),
  MAX_FILES_COUNT: parseInt(process.env.NEXT_PUBLIC_MAX_FILES_COUNT || '200'),
  WORKER_CONCURRENCY: 2, // Máximo 2 archivos procesándose simultáneamente
};

// Convertir MB a bytes
export const MB_TO_BYTES = 1024 * 1024;

// Textos exactos de la UI (según requisitos)
export const UI_TEXTS = {
  BANNER: 'Límite de uso: máximo **50 MB total**, **10 MB por archivo**, hasta **200 archivos**. Para procesar más, y otros formatos (pdf, word, md) ejecuta la app localmente (ver README).',
  
  MODAL_TITLE: 'Límite de Archivos Superado',
  
  MODAL_MESSAGE: `Has intentado subir archivos que superan los límites:
- 50 MB total, 10 MB por archivo, hasta 200 archivos

Elige una opción:`,
  
  MODAL_OPTIONS: [
    {
      id: 'subset',
      label: 'Seleccionar un subconjunto de archivos',
      description: '(recomendada)',
    },
    {
      id: 'sample',
      label: 'Usar el dataset de ejemplo incluido en el repo',
      description: '(`sample-data/`)',
    },
    {
      id: 'local',
      label: 'Ejecutar la app localmente',
      description: '(ver README)',
    },
  ],
};

// Categorías predefinidas (usuario puede agregar más)
export const DEFAULT_CATEGORIES = [
  'Sin categoría',
  'Contactos',
  'Documentación',
  'Finanzas',
  'Ideas',
  'Código',
  'Reuniones',
  'Personal',
];

// Colores para etiquetas (rotación automática)
export const TAG_COLORS = [
  'bg-blue-100 text-blue-800',
  'bg-green-100 text-green-800',
  'bg-yellow-100 text-yellow-800',
  'bg-red-100 text-red-800',
  'bg-purple-100 text-purple-800',
  'bg-pink-100 text-pink-800',
  'bg-indigo-100 text-indigo-800',
  'bg-gray-100 text-gray-800',
];

// Tipos de entidades detectables (compromise.js)
export const ENTITY_TYPES = {
  PERSON: 'Persona',
  PLACE: 'Lugar',
  ORGANIZATION: 'Organización',
  DATE: 'Fecha',
  URL: 'URL',
  EMAIL: 'Email',
  PHONE: 'Teléfono',
  KEYWORD: 'Palabra clave',
};

// Regex patterns para extracción
export const PATTERNS = {
  URL: /https?:\/\/[^\s]+/gi,
  EMAIL: /[\w.-]+@[\w.-]+\.\w+/gi,
  PHONE: /(\+\d{1,3}[\s-]?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}/gi,
  NUMBER: /\b\d+(?:\.\d+)?\b/g,
};

// Configuración de cifrado (Web Crypto API)
export const CRYPTO_CONFIG = {
  ALGORITHM: 'AES-GCM',
  KEY_LENGTH: 256,
  IV_LENGTH: 12,
  SALT_LENGTH: 16,
  PBKDF2_ITERATIONS: 100000,
  PBKDF2_HASH: 'SHA-256',
};