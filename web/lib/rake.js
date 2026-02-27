// web/lib/rake.js
// Implementación simple de RAKE (Rapid Automatic Keyword Extraction)
// Extrae palabras clave y frases importantes de un texto

/**
 * Lista de stopwords en español (palabras comunes sin valor semántico)
 */
const STOPWORDS_ES = new Set([
  'el', 'la', 'de', 'que', 'y', 'a', 'en', 'un', 'ser', 'se', 'no', 'haber',
  'por', 'con', 'su', 'para', 'como', 'estar', 'tener', 'le', 'lo', 'todo',
  'pero', 'más', 'hacer', 'o', 'poder', 'decir', 'este', 'ir', 'otro', 'ese',
  'si', 'me', 'ya', 'ver', 'porque', 'dar', 'cuando', 'él', 'muy', 'sin',
  'vez', 'mucho', 'saber', 'qué', 'sobre', 'mi', 'alguno', 'mismo', 'yo',
  'también', 'hasta', 'año', 'dos', 'querer', 'entre', 'así', 'primero',
  'desde', 'grande', 'eso', 'ni', 'nos', 'llegar', 'pasar', 'tiempo', 'ella',
  'sí', 'día', 'uno', 'bien', 'poco', 'deber', 'entonces', 'poner', 'cosa',
  'tanto', 'hombre', 'parecer', 'nuestro', 'tan', 'donde', 'ahora', 'parte',
  'después', 'vida', 'quedar', 'siempre', 'creer', 'hablar', 'llevar', 'dejar',
  'nada', 'cada', 'seguir', 'menos', 'nuevo', 'encontrar', 'algo', 'solo',
  'decir', 'estos', 'trabajar', 'primero', 'último', 'aunque', 'ante', 'antes',
  'algunos', 'aquel', 'aquí', 'arriba', 'así', 'bajo', 'bien', 'cómo', 'con',
  'contra', 'cual', 'cuál', 'cuales', 'cuáles', 'cuando', 'cuándo', 'cuanto',
  'del', 'dentro', 'dónde', 'dos', 'durante', 'e', 'éste', 'ésta', 'éstos',
  'éstas', 'fue', 'pueden', 'puede', 'eres', 'esa', 'esas', 'ese', 'esos',
  'esta', 'están', 'estas', 'esto', 'estos', 'estoy', 'etc', 'ha', 'han',
  'hay', 'he', 'aqui', 'allí', 'alli', 'ahí', 'tal', 'tales', 'toda', 'todas',
  'todos', 'tuyo', 'tuya', 'tuyos', 'tuyas', 'suyo', 'suya', 'suyos', 'suyas',
]);

/**
 * Normaliza texto: minúsculas, sin acentos, sin puntuación especial
 */
function normalizeText(text) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Elimina acentos
    .replace(/[^a-z0-9\s]/g, ' ') // Solo letras, números y espacios
    .replace(/\s+/g, ' ') // Espacios múltiples → uno solo
    .trim();
}

/**
 * Divide texto en frases usando delimitadores
 */
function splitIntoSentences(text) {
  return text
    .split(/[.!?;\n]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

/**
 * Extrae candidatos (palabras clave potenciales) de una frase
 * Candidato = secuencia de palabras NO stopwords
 */
function extractCandidates(sentence, stopwords) {
  const words = sentence.split(/\s+/);
  const candidates = [];
  let currentCandidate = [];

  for (const word of words) {
    if (word.length < 2) continue; // Palabras muy cortas

    if (stopwords.has(word)) {
      // Stopword encontrada, termina candidato actual
      if (currentCandidate.length > 0) {
        candidates.push(currentCandidate.join(' '));
        currentCandidate = [];
      }
    } else {
      // No es stopword, agregar a candidato
      currentCandidate.push(word);
    }
  }

  // Agregar último candidato si existe
  if (currentCandidate.length > 0) {
    candidates.push(currentCandidate.join(' '));
  }

  return candidates;
}

/**
 * Calcula score de una palabra (frecuencia + grado de co-ocurrencia)
 */
function calculateWordScores(candidates) {
  const wordFrequency = {};
  const wordDegree = {};

  // Contar frecuencia y grado (co-ocurrencia)
  candidates.forEach((phrase) => {
    const words = phrase.split(/\s+/);
    const phraseLength = words.length;

    words.forEach((word) => {
      wordFrequency[word] = (wordFrequency[word] || 0) + 1;
      wordDegree[word] = (wordDegree[word] || 0) + phraseLength;
    });
  });

  // Calcular score: degree(word) / frequency(word)
  const wordScores = {};
  Object.keys(wordFrequency).forEach((word) => {
    wordScores[word] = wordDegree[word] / wordFrequency[word];
  });

  return wordScores;
}

/**
 * Calcula score de cada frase candidata
 */
function scoreCandidates(candidates, wordScores) {
  const phraseScores = {};

  candidates.forEach((phrase) => {
    const words = phrase.split(/\s+/);
    const score = words.reduce((sum, word) => sum + (wordScores[word] || 0), 0);
    
    // Bonus para frases multi-palabra (más informativas)
    const lengthBonus = words.length > 1 ? 1.5 : 1.0;
    
    phraseScores[phrase] = score * lengthBonus;
  });

  return phraseScores;
}

/**
 * Extrae las N mejores keywords usando RAKE
 * @param {string} text - Texto a analizar
 * @param {number} topN - Número de keywords a retornar (default: 10)
 * @param {Set} customStopwords - Stopwords personalizadas (opcional)
 * @returns {Array} - Array de objetos {keyword, score}
 */
export function extractKeywords(text, topN = 10, customStopwords = null) {
  if (!text || text.trim().length === 0) {
    return [];
  }

  const stopwords = customStopwords || STOPWORDS_ES;

  // 1. Normalizar texto
  const normalized = normalizeText(text);

  // 2. Dividir en frases
  const sentences = splitIntoSentences(normalized);

  // 3. Extraer candidatos de cada frase
  const allCandidates = [];
  sentences.forEach((sentence) => {
    const candidates = extractCandidates(sentence, stopwords);
    allCandidates.push(...candidates);
  });

  if (allCandidates.length === 0) {
    return [];
  }

  // 4. Calcular scores de palabras
  const wordScores = calculateWordScores(allCandidates);

  // 5. Calcular scores de frases candidatas
  const phraseScores = scoreCandidates(allCandidates, wordScores);

  // 6. Ordenar por score y tomar top N
  const sortedPhrases = Object.entries(phraseScores)
    .sort((a, b) => b[1] - a[1]) // Descendente por score
    .slice(0, topN)
    .map(([keyword, score]) => ({
      keyword,
      score: parseFloat(score.toFixed(3)),
    }));

  return sortedPhrases;
}

/**
 * Versión simplificada: solo retorna array de strings (sin scores)
 */
export function extractKeywordsSimple(text, topN = 10) {
  const keywords = extractKeywords(text, topN);
  return keywords.map((item) => item.keyword);
}

/**
 * Agrega stopwords personalizadas al conjunto default
 */
export function addStopwords(words) {
  words.forEach((word) => STOPWORDS_ES.add(word.toLowerCase()));
}

/**
 * Exporta el conjunto de stopwords (útil para testing)
 */
export function getStopwords() {
  return STOPWORDS_ES;
}