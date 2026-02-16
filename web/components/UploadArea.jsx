// web/components/UploadArea.jsx
// Área de drag & drop para subir archivos

'use client';

import { useState } from 'react';

export default function UploadArea({ onFilesSelected, isProcessing }) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      onFilesSelected(files);
    }
  };

  const handleFileInput = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      onFilesSelected(files);
    }
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`
        border-2 border-dashed rounded-xl p-12 text-center transition-all
        ${
          isDragging
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-300 bg-gray-50 hover:border-gray-400'
        }
        ${isProcessing ? 'opacity-50 pointer-events-none' : ''}
      `}
    >
      <div className="flex flex-col items-center space-y-4">
        {/* Icono */}
        <div
          className={`
          w-16 h-16 rounded-full flex items-center justify-center
          ${isDragging ? 'bg-blue-100' : 'bg-gray-100'}
        `}
        >
          <svg
            className={`w-8 h-8 ${isDragging ? 'text-blue-600' : 'text-gray-400'}`}
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
            />
          </svg>
        </div>

        {/* Texto */}
        <div>
          <p className="text-lg font-semibold text-gray-700 mb-2">
            {isDragging
              ? 'Suelta los archivos aquí'
              : 'Arrastra archivos .txt aquí'}
          </p>
          <p className="text-sm text-gray-500">
            o haz click para seleccionar archivos
          </p>
        </div>

        {/* Botón de selección */}
        <label
          htmlFor="file-input"
          className={`
            px-6 py-3 bg-blue-600 text-white rounded-lg font-medium
            cursor-pointer hover:bg-blue-700 transition-colors
            ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}
          `}
        >
          Seleccionar Archivos
        </label>
        <input
          id="file-input"
          type="file"
          multiple
          accept=".txt"
          onChange={handleFileInput}
          disabled={isProcessing}
          className="hidden"
        />

        {/* Info */}
        <p className="text-xs text-gray-400 mt-4">
          Solo archivos .txt • Máx 10 MB por archivo • Hasta 200 archivos
        </p>
      </div>
    </div>
  );
}