// web/components/SelectionBar.jsx
// Barra de acciones para archivos seleccionados

'use client';

export default function SelectionBar({
  selectedCount,
  totalCount,
  onSelectAll,
  onDeselectAll,
  onExport,
  onClearAll,
}) {
  if (totalCount === 0) return null;

  const allSelected = selectedCount === totalCount;

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4 shadow-sm">
      <div className="flex items-center justify-between flex-wrap gap-4">
        {/* Info de selección */}
        <div className="flex items-center space-x-4">
          <span className="text-sm font-medium text-gray-700">
            {selectedCount} de {totalCount} seleccionados
          </span>
          <div className="flex items-center space-x-2">
            {!allSelected ? (
              <button
                onClick={onSelectAll}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors"
              >
                Seleccionar todos
              </button>
            ) : (
              <button
                onClick={onDeselectAll}
                className="text-sm text-gray-600 hover:text-gray-700 font-medium transition-colors"
              >
                Deseleccionar todos
              </button>
            )}
          </div>
        </div>

        {/* Acciones */}
        <div className="flex items-center space-x-3">
          {/* Exportar ZIP */}
          <button
            onClick={onExport}
            disabled={selectedCount === 0}
            className={`
              px-4 py-2 rounded-lg font-medium text-sm transition-all flex items-center space-x-2
              ${
                selectedCount > 0
                  ? 'bg-green-600 text-white hover:bg-green-700 shadow-sm'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }
            `}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <span>Exportar ZIP ({selectedCount})</span>
          </button>

          {/* Limpiar todo */}
          <button
            onClick={onClearAll}
            className="px-4 py-2 bg-red-100 text-red-700 rounded-lg font-medium text-sm hover:bg-red-200 transition-colors flex items-center space-x-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
            <span>Limpiar todo</span>
          </button>
        </div>
      </div>
    </div>
  );
}