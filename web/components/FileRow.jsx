// web/components/FileRow.jsx
// Fila individual de archivo procesado

'use client';

import { TAG_COLORS } from '@/lib/constants';

export default function FileRow({ file, style, onToggleSelect, onDownload, onEditTags }) {
  const isSelected = file.markedForExport;

  const formatSize = (bytes) => {
    const mb = bytes / (1024 * 1024);
    return mb < 1 ? `${(bytes / 1024).toFixed(1)} KB` : `${mb.toFixed(2)} MB`;
  };

  return (
    <div
      style={style}
      className={`
        border-b border-gray-200 p-4 hover:bg-gray-50 transition-colors
        ${isSelected ? 'bg-blue-50' : 'bg-white'}
      `}
    >
      <div className="flex items-start space-x-4 h-full">
        {/* Checkbox */}
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => onToggleSelect(file.fileId)}
          className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 flex-shrink-0"
        />

        {/* Contenido */}
        <div className="flex-1 min-w-0">
          {/* Header con nombre y categoría */}
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2 mb-1">
                <h4 className="text-sm font-semibold text-gray-900 truncate">
                  {file.fileName}
                </h4>
                {/* Categoría visible arriba */}
                <span className={`
                  flex-shrink-0 text-xs font-medium px-2 py-0.5 rounded
                  ${file.category === 'Sin categoría' ? 'bg-gray-100 text-gray-600' : 'bg-purple-100 text-purple-700'}
                `}>
                  {file.category || 'Sin categoría'}
                </span>
              </div>
              <p className="text-xs text-gray-500">
                {formatSize(file.fileSize)} • {file.wordCount} palabras
                {file.detectado_PII && (
                  <span className="ml-2 text-red-600 font-medium">
                    ⚠ PII detectado
                  </span>
                )}
              </p>
            </div>
          </div>

          {/* Etiquetas con scroll */}
          <div className="max-h-[80px] overflow-y-auto pr-2 custom-scrollbar">
            <div className="flex flex-wrap gap-2">
              {file.tags && file.tags.slice(0, 15).map((tag, index) => (
                <span
                  key={index}
                  className={`
                    px-2 py-1 text-xs font-medium rounded-full
                    ${TAG_COLORS[index % TAG_COLORS.length]}
                  `}
                >
                  {tag}
                </span>
              ))}
              {file.tags && file.tags.length > 15 && (
                <span className="px-2 py-1 text-xs text-gray-500">
                  +{file.tags.length - 15} más
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Acciones */}
        <div className="flex items-center space-x-2 flex-shrink-0">
          <button
            onClick={() => onEditTags(file.fileId)}
            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
            title="Editar etiquetas y categoría"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
              />
            </svg>
          </button>
          <button
            onClick={() => onDownload(file.fileId)}
            className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded transition-colors"
            title="Descargar archivo"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}