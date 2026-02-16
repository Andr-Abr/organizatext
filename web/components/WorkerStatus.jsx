// web/components/WorkerStatus.jsx
// Muestra el estado del procesamiento (archivos en cola, progreso)

'use client';

export default function WorkerStatus({ stats, processedCount, totalCount }) {
  if (totalCount === 0) return null;

  const progress = (processedCount / totalCount) * 100;

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-700">
          Estado del Procesamiento
        </h3>
        <span className="text-sm text-gray-500">
          {processedCount} / {totalCount} archivos
        </span>
      </div>

      {/* Barra de progreso */}
      <div className="w-full bg-gray-200 rounded-full h-2 mb-3 overflow-hidden">
        <div
          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Estadísticas del pool */}
      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="bg-gray-50 rounded-lg p-2">
          <p className="text-xs text-gray-500">Procesando</p>
          <p className="text-lg font-semibold text-blue-600">
            {stats?.activeJobs || 0}
          </p>
        </div>
        <div className="bg-gray-50 rounded-lg p-2">
          <p className="text-xs text-gray-500">En cola</p>
          <p className="text-lg font-semibold text-gray-700">
            {stats?.queuedJobs || 0}
          </p>
        </div>
        <div className="bg-gray-50 rounded-lg p-2">
          <p className="text-xs text-gray-500">Completados</p>
          <p className="text-lg font-semibold text-green-600">
            {processedCount}
          </p>
        </div>
      </div>

      {/* Animación de carga */}
      {processedCount < totalCount && (
        <div className="mt-3 flex items-center justify-center text-sm text-gray-500">
          <svg
            className="animate-spin h-4 w-4 mr-2 text-blue-600"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          Procesando archivos...
        </div>
      )}
    </div>
  );
}