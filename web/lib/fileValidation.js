// web/lib/fileValidation.js
// Validación de archivos antes de procesamiento

import { LIMITS, MB_TO_BYTES } from './constants';

/**
 * Valida un conjunto de archivos contra los límites establecidos
 * @param {File[]} files - Array de archivos a validar
 * @returns {Object} - { valid: boolean, errors: string[], warnings: string[] }
 */
export function validateFiles(files) {
  const errors = [];
  const warnings = [];

  if (!files || files.length === 0) {
    errors.push('No se seleccionaron archivos');
    return { valid: false, errors, warnings };
  }

  // Validar número de archivos
  if (files.length > LIMITS.MAX_FILES_COUNT) {
    errors.push(
      `Demasiados archivos: ${files.length} (máximo ${LIMITS.MAX_FILES_COUNT})`
    );
  }

  // Validar tamaño total
  const totalSize = files.reduce((sum, file) => sum + file.size, 0);
  const totalSizeMB = totalSize / MB_TO_BYTES;
  
  if (totalSizeMB > LIMITS.MAX_TOTAL_SIZE_MB) {
    errors.push(
      `Tamaño total excede el límite: ${totalSizeMB.toFixed(2)} MB (máximo ${LIMITS.MAX_TOTAL_SIZE_MB} MB)`
    );
  }

  // Validar tamaño individual de cada archivo
  const oversizedFiles = [];
  files.forEach((file) => {
    const fileSizeMB = file.size / MB_TO_BYTES;
    if (fileSizeMB > LIMITS.MAX_FILE_SIZE_MB) {
      oversizedFiles.push(`${file.name} (${fileSizeMB.toFixed(2)} MB)`);
    }
  });

  if (oversizedFiles.length > 0) {
    errors.push(
      `Archivos que exceden ${LIMITS.MAX_FILE_SIZE_MB} MB: ${oversizedFiles.join(', ')}`
    );
  }

  // Validar extensión (solo .txt)
  const invalidExtensions = [];
  files.forEach((file) => {
    if (!file.name.toLowerCase().endsWith('.txt')) {
      invalidExtensions.push(file.name);
    }
  });

  if (invalidExtensions.length > 0) {
    errors.push(
      `Archivos con extensión no válida: ${invalidExtensions.join(', ')}. Solo se permiten archivos .txt`
    );
  }

  // Warnings (no bloquean, solo informan)
  if (totalSizeMB > LIMITS.MAX_TOTAL_SIZE_MB * 0.8) {
    warnings.push(
      `Estás cerca del límite de tamaño total (${totalSizeMB.toFixed(2)} MB / ${LIMITS.MAX_TOTAL_SIZE_MB} MB)`
    );
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    stats: {
      fileCount: files.length,
      totalSizeMB: totalSizeMB.toFixed(2),
      averageSizeMB: (totalSizeMB / files.length).toFixed(2),
    },
  };
}

/**
 * Filtra archivos válidos de un conjunto
 * @param {File[]} files
 * @returns {File[]} - Solo archivos .txt dentro de límites
 */
export function filterValidFiles(files) {
  return files.filter((file) => {
    const sizeMB = file.size / MB_TO_BYTES;
    return (
      file.name.toLowerCase().endsWith('.txt') &&
      sizeMB <= LIMITS.MAX_FILE_SIZE_MB
    );
  });
}

/**
 * Calcula cuántos archivos caben dentro de los límites
 * @param {File[]} files
 * @returns {File[]} - Subconjunto que cumple límites
 */
export function getValidSubset(files) {
  const validFiles = filterValidFiles(files);
  
  let totalSize = 0;
  const subset = [];

  for (const file of validFiles) {
    if (subset.length >= LIMITS.MAX_FILES_COUNT) break;
    
    const newTotal = totalSize + file.size;
    if (newTotal / MB_TO_BYTES > LIMITS.MAX_TOTAL_SIZE_MB) break;
    
    subset.push(file);
    totalSize = newTotal;
  }

  return subset;
}