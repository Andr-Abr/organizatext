// web/lib/storage.js
// Wrapper para localForage (IndexedDB)
// Almacena metadata de archivos procesados localmente

import localforage from 'localforage';

// Configurar localForage
const storage = localforage.createInstance({
  name: 'organizatext',
  storeName: 'file_metadata',
  description: 'Almacenamiento local de metadata de archivos procesados',
});

/**
 * Guarda metadata de un archivo procesado
 * @param {string} fileId - ID único del archivo
 * @param {Object} metadata - Datos del archivo procesado
 */
export async function saveFileMetadata(fileId, metadata) {
  try {
    await storage.setItem(fileId, {
      ...metadata,
      savedAt: new Date().toISOString(),
    });
    return { success: true };
  } catch (error) {
    console.error('Error saving metadata:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Obtiene metadata de un archivo
 */
export async function getFileMetadata(fileId) {
  try {
    const metadata = await storage.getItem(fileId);
    return metadata;
  } catch (error) {
    console.error('Error getting metadata:', error);
    return null;
  }
}

/**
 * Obtiene todos los archivos almacenados
 */
export async function getAllFileMetadata() {
  try {
    const keys = await storage.keys();
    const allMetadata = [];

    for (const key of keys) {
      const metadata = await storage.getItem(key);
      if (metadata) {
        allMetadata.push({ fileId: key, ...metadata });
      }
    }

    // Ordenar por fecha (más reciente primero)
    allMetadata.sort((a, b) => {
      return new Date(b.savedAt) - new Date(a.savedAt);
    });

    return allMetadata;
  } catch (error) {
    console.error('Error getting all metadata:', error);
    return [];
  }
}

/**
 * Elimina metadata de un archivo
 */
export async function deleteFileMetadata(fileId) {
  try {
    await storage.removeItem(fileId);
    return { success: true };
  } catch (error) {
    console.error('Error deleting metadata:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Limpia todo el almacenamiento local
 */
export async function clearAllMetadata() {
  try {
    await storage.clear();
    return { success: true };
  } catch (error) {
    console.error('Error clearing storage:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Exporta toda la metadata como JSON
 */
export async function exportMetadataAsJSON() {
  const allMetadata = await getAllFileMetadata();
  return JSON.stringify(allMetadata, null, 2);
}

/**
 * Importa metadata desde JSON
 */
export async function importMetadataFromJSON(jsonString) {
  try {
    const data = JSON.parse(jsonString);
    
    for (const item of data) {
      const { fileId, ...metadata } = item;
      await saveFileMetadata(fileId, metadata);
    }

    return { success: true, count: data.length };
  } catch (error) {
    console.error('Error importing metadata:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Obtiene estadísticas del almacenamiento
 */
export async function getStorageStats() {
  try {
    const keys = await storage.keys();
    const allMetadata = await getAllFileMetadata();

    const totalFiles = keys.length;
    const categories = {};
    const tags = {};

    allMetadata.forEach((item) => {
      // Contar por categoría
      const category = item.category || 'Sin categoría';
      categories[category] = (categories[category] || 0) + 1;

      // Contar por etiquetas
      if (item.tags) {
        item.tags.forEach((tag) => {
          tags[tag] = (tags[tag] || 0) + 1;
        });
      }
    });

    return {
      totalFiles,
      categories,
      tags,
      oldestFile: allMetadata[allMetadata.length - 1]?.savedAt,
      newestFile: allMetadata[0]?.savedAt,
    };
  } catch (error) {
    console.error('Error getting stats:', error);
    return null;
  }
}

export default storage;