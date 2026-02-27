// web/lib/exporter.js
// Exportador de archivos a ZIP con estructura de carpetas por categoría

import JSZip from 'jszip';
import { saveAs } from 'file-saver';

/**
 * Exporta archivos seleccionados a ZIP
 * Estructura: categorías como carpetas + metadata.json
 * @param {Array} files - Array de archivos con metadata
 * @param {Map} fileBlobs - Map de fileId -> Blob original
 */
export async function exportToZip(files, fileBlobs) {
  if (files.length === 0) {
    throw new Error('No hay archivos para exportar');
  }

  const zip = new JSZip();

  // Agrupar por categoría
  const filesByCategory = {};

  files.forEach((file) => {
    const category = file.category || 'Sin categoría';
    if (!filesByCategory[category]) {
      filesByCategory[category] = [];
    }
    filesByCategory[category].push(file);
  });

  // Crear carpetas y agregar archivos
  for (const [category, categoryFiles] of Object.entries(filesByCategory)) {
    // Sanitizar nombre de carpeta (eliminar caracteres inválidos)
    const folderName = sanitizeFolderName(category);
    const folder = zip.folder(folderName);

    for (const file of categoryFiles) {
      const blob = fileBlobs.get(file.fileId);
      
      if (blob) {
        // Agregar archivo original (blob sin modificar)
        folder.file(file.fileName, blob);
      } else {
        console.warn(`Blob no encontrado para ${file.fileName}`);
      }
    }
  }

  // Agregar metadata.json en la raíz
  const metadata = {
    exportedAt: new Date().toISOString(),
    totalFiles: files.length,
    categories: Object.keys(filesByCategory),
    files: files.map((file) => ({
      fileName: file.fileName,
      fileSize: file.fileSize,
      category: file.category || 'Sin categoría',
      tags: file.tags,
      detectado_PII: file.detectado_PII,
      piiTypes: file.piiTypes,
      wordCount: file.wordCount,
      urls: file.urls?.length || 0,
      emails: file.emails?.length || 0,
      phones: file.phones?.length || 0,
      processedAt: file.processedAt,
    })),
  };

  zip.file('metadata.json', JSON.stringify(metadata, null, 2));

  // Agregar README.txt con instrucciones
  const readme = `Organizatext - Exportación
============================

Fecha de exportación: ${new Date().toLocaleString()}
Total de archivos: ${files.length}
Categorías: ${Object.keys(filesByCategory).length}

Estructura:
-----------
Los archivos están organizados en carpetas por categoría.
El archivo metadata.json contiene toda la información extraída (etiquetas, URLs, emails, etc).

Para más información: https://github.com/Andr-Abr/organizatext
`;

  zip.file('README.txt', readme);

  // Generar ZIP y descargar
  const zipBlob = await zip.generateAsync(
    {
      type: 'blob',
      compression: 'DEFLATE',
      compressionOptions: { level: 6 },
    },
    (metadata) => {
      // Callback de progreso (opcional)
      const progress = metadata.percent.toFixed(0);
      console.log(`Generando ZIP: ${progress}%`);
    }
  );

  // Descargar usando file-saver
  const timestamp = new Date().toISOString().split('T')[0].replace(/-/g, '');
  const fileName = `organizatext-export-${timestamp}.zip`;
  
  saveAs(zipBlob, fileName);

  return {
    success: true,
    fileName,
    size: zipBlob.size,
  };
}

/**
 * Sanitiza nombre de carpeta (elimina caracteres inválidos)
 */
function sanitizeFolderName(name) {
  return name
    .replace(/[<>:"/\\|?*]/g, '_') // Caracteres no permitidos en nombres de archivo
    .replace(/\s+/g, '_') // Espacios → guiones bajos
    .substring(0, 50); // Limitar longitud
}

/**
 * Exporta solo la metadata como JSON (sin archivos)
 */
export function exportMetadataOnly(files) {
  const metadata = {
    exportedAt: new Date().toISOString(),
    totalFiles: files.length,
    files: files.map((file) => ({
      fileName: file.fileName,
      fileSize: file.fileSize,
      category: file.category || 'Sin categoría',
      tags: file.tags,
      detectado_PII: file.detectado_PII,
      wordCount: file.wordCount,
      processedAt: file.processedAt,
    })),
  };

  const blob = new Blob([JSON.stringify(metadata, null, 2)], {
    type: 'application/json',
  });

  const timestamp = new Date().toISOString().split('T')[0].replace(/-/g, '');
  saveAs(blob, `organizatext-metadata-${timestamp}.json`);
}