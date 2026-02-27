// web/workers/processor.worker.js
// Web Worker para procesamiento de archivos en segundo plano
// Extrae URLs, emails, números, keywords (RAKE) y entidades (compromise)

// Importar compromise (NER) - se carga dinámicamente
let nlp = null;

// Patrones regex para extracción
const PATTERNS = {
  URL: /https?:\/\/[^\s]+/gi,
  EMAIL: /[\w.-]+@[\w.-]+\.\w+/gi,
  PHONE: /(\+\d{1,3}[\s-]?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}/gi,
  NUMBER: /\b\d+(?:\.\d+)?\b/g,
};

// Stopwords en español (para RAKE)
const STOPWORDS_ES = new Set([
  'el', 'la', 'de', 'que', 'y', 'a', 'en', 'un', 'ser', 'se', 'no', 'haber',
  'por', 'con', 'su', 'para', 'como', 'estar', 'tener', 'le', 'lo', 'todo',
  'pero', 'más', 'hacer', 'o', 'poder', 'decir', 'este', 'ir', 'otro', 'ese',
  'si', 'me', 'ya', 'ver', 'porque', 'dar', 'cuando', 'él', 'muy', 'sin',
  'vez', 'mucho', 'saber', 'qué', 'sobre', 'mi', 'alguno', 'mismo', 'yo',
  'también', 'hasta', 'año', 'dos', 'querer', 'entre', 'así', 'primero',
  'desde', 'grande', 'eso', 'ni', 'nos', 'llegar', 'pasar', 'tiempo', 'ella',
  'sí', 'día', 'uno', 'bien', 'poco', 'deber', 'entonces', 'poner', 'cosa',
]);

/**
 * Inicializa compromise (carga dinámica)
 */
async function initializeNLP() {
  if (!nlp) {
    try {
      // Importar compromise dinámicamente
      const compromiseModule = await import('compromise');
      nlp = compromiseModule.default;
    } catch (error) {
      console.error('Error loading compromise:', error);
      nlp = null;
    }
  }
}

/**
 * Extrae URLs del texto
 */
function extractURLs(text) {
  const matches = text.match(PATTERNS.URL);
  return matches ? [...new Set(matches)] : [];
}

/**
 * Extrae emails del texto
 */
function extractEmails(text) {
  const matches = text.match(PATTERNS.EMAIL);
  return matches ? [...new Set(matches)] : [];
}

/**
 * Extrae números de teléfono del texto
 */
function extractPhones(text) {
  const matches = text.match(PATTERNS.PHONE);
  return matches ? [...new Set(matches)] : [];
}

/**
 * Detecta PII (Información Personal Identificable)
 */
function detectPII(text, emails, phones) {
  let hasPII = false;
  const piiTypes = [];

  if (emails.length > 0) {
    hasPII = true;
    piiTypes.push('emails');
  }

  if (phones.length > 0) {
    hasPII = true;
    piiTypes.push('teléfonos');
  }

  // Detectar números de documento (simplificado)
  const docPatterns = [
    /\b\d{8,10}\b/g, // DNI, CC
    /\b[A-Z]{2}\d{6,8}\b/g, // Pasaportes
  ];

  for (const pattern of docPatterns) {
    if (pattern.test(text)) {
      hasPII = true;
      piiTypes.push('posibles documentos');
      break;
    }
  }

  return { hasPII, piiTypes };
}

/**
 * Implementación simple de RAKE (Rapid Automatic Keyword Extraction)
 */
function extractKeywordsRAKE(text, topN = 10) {
  const normalized = text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const sentences = normalized.split(/[.!?;\n]+/).filter((s) => s.length > 0);

  const allCandidates = [];
  sentences.forEach((sentence) => {
    const words = sentence.split(/\s+/);
    let currentCandidate = [];

    words.forEach((word) => {
      if (word.length < 2) return;

      if (STOPWORDS_ES.has(word)) {
        if (currentCandidate.length > 0) {
          allCandidates.push(currentCandidate.join(' '));
          currentCandidate = [];
        }
      } else {
        currentCandidate.push(word);
      }
    });

    if (currentCandidate.length > 0) {
      allCandidates.push(currentCandidate.join(' '));
    }
  });

  if (allCandidates.length === 0) return [];

  // Calcular scores
  const wordFrequency = {};
  const wordDegree = {};

  allCandidates.forEach((phrase) => {
    const words = phrase.split(/\s+/);
    const phraseLength = words.length;

    words.forEach((word) => {
      wordFrequency[word] = (wordFrequency[word] || 0) + 1;
      wordDegree[word] = (wordDegree[word] || 0) + phraseLength;
    });
  });

  const wordScores = {};
  Object.keys(wordFrequency).forEach((word) => {
    wordScores[word] = wordDegree[word] / wordFrequency[word];
  });

  const phraseScores = {};
  allCandidates.forEach((phrase) => {
    const words = phrase.split(/\s+/);
    const score = words.reduce((sum, word) => sum + (wordScores[word] || 0), 0);
    const lengthBonus = words.length > 1 ? 1.5 : 1.0;
    phraseScores[phrase] = score * lengthBonus;
  });

  return Object.entries(phraseScores)
    .sort((a, b) => b[1] - a[1])
    .slice(0, topN)
    .map(([keyword]) => keyword);
}

/**
 * Extrae entidades nombradas usando compromise
 */
function extractEntities(text) {
  if (!nlp) return [];

  try {
    const doc = nlp(text);
    const entities = [];

    // Personas
    const people = doc.people().out('array');
    people.forEach((p) => entities.push({ type: 'person', value: p }));

    // Lugares
    const places = doc.places().out('array');
    places.forEach((p) => entities.push({ type: 'place', value: p }));

    // Organizaciones
    const orgs = doc.organizations().out('array');
    orgs.forEach((o) => entities.push({ type: 'organization', value: o }));

    // Fechas
    const dates = doc.dates().out('array');
    dates.forEach((d) => entities.push({ type: 'date', value: d }));

    return entities;
  } catch (error) {
    console.error('Error extracting entities:', error);
    return [];
  }
}

/**
 * Procesa un archivo de texto
 */
async function processFile(file) {
  try {
    // Leer contenido del archivo
    const text = await file.text();

    // Inicializar NLP si es la primera vez
    await initializeNLP();

    // Extracciones
    const urls = extractURLs(text);
    const emails = extractEmails(text);
    const phones = extractPhones(text);
    const keywords = extractKeywordsRAKE(text, 10);
    const entities = extractEntities(text);

    // Detectar PII
    const { hasPII, piiTypes } = detectPII(text, emails, phones);

    // Combinar todas las etiquetas
    const allTags = [
      ...keywords,
      ...entities.map((e) => e.value),
    ].slice(0, 20); // Máximo 20 etiquetas

    return {
      success: true,
      data: {
        fileName: file.name,
        fileSize: file.size,
        urls,
        emails,
        phones,
        keywords,
        entities,
        tags: allTags,
        detectado_PII: hasPII,
        piiTypes,
        wordCount: text.split(/\s+/).length,
        charCount: text.length,
        processedAt: new Date().toISOString(),
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      fileName: file.name,
    };
  }
}

/**
 * Listener principal del worker
 */
self.addEventListener('message', async (event) => {
  const { type, file, fileId } = event.data;

  if (type === 'PROCESS_FILE') {
    // Reportar inicio
    self.postMessage({
      type: 'PROGRESS',
      fileId,
      status: 'processing',
      progress: 0,
    });

    // Procesar archivo
    const result = await processFile(file);

    // Reportar completado
    self.postMessage({
      type: 'COMPLETE',
      fileId,
      result,
    });
  }
});

// Notificar que el worker está listo
self.postMessage({ type: 'READY' });