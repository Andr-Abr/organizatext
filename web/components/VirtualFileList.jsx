// web/components/VirtualFileList.jsx
// Lista virtualizada de archivos procesados (maneja 3000+ items sin lag)

'use client';

import { FixedSizeList as List } from 'react-window';
import FileRow from './FileRow';

export default function VirtualFileList({
  files,
  onToggleSelect,
  onDownload,
  onEditTags,
  height = 600,
}) {
  if (files.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <svg
          className="mx-auto h-12 w-12 text-gray-400 mb-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
        <p className="text-lg font-medium mb-2">No hay archivos procesados</p>
        <p className="text-sm">Arrastra archivos .txt para comenzar</p>
      </div>
    );
  }

  // Altura de cada fila (ajustar según diseño)
  const ROW_HEIGHT = 160;

  // Render de cada fila
  const Row = ({ index, style }) => {
    const file = files[index];
    return (
      <FileRow
        file={file}
        style={style}
        onToggleSelect={onToggleSelect}
        onDownload={onDownload}
        onEditTags={onEditTags}
      />
    );
  };

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm">
      {/* Header de la lista */}
      <div className="bg-gray-50 border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-700">
            Archivos Procesados ({files.length})
          </h3>
          <div className="text-xs text-gray-500">
            {files.filter((f) => f.markedForExport).length} seleccionados para exportar
          </div>
        </div>
      </div>

      {/* Lista virtualizada */}
      <List
        height={height}
        itemCount={files.length}
        itemSize={ROW_HEIGHT}
        width="100%"
        overscanCount={5} // Pre-renderizar 5 items extra fuera del viewport
      >
        {Row}
      </List>
    </div>
  );
}