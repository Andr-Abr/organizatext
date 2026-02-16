// web/components/ModalLimits.jsx
// Modal que aparece cuando se superan los límites

'use client';

import { UI_TEXTS } from '@/lib/constants';

export default function ModalLimits({ isOpen, onClose, onSelectSubset, onUseSample, onViewLocal }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 animate-fade-in">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-yellow-100 rounded-full p-2">
              <svg
                className="h-6 w-6 text-yellow-600"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <h3 className="ml-3 text-lg font-semibold text-gray-900">
              {UI_TEXTS.MODAL_TITLE}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>

        {/* Mensaje */}
        <div className="mb-6">
          <p className="text-sm text-gray-700 whitespace-pre-line">
            {UI_TEXTS.MODAL_MESSAGE}
          </p>
        </div>

        {/* Opciones */}
        <div className="space-y-3 mb-6">
          {UI_TEXTS.MODAL_OPTIONS.map((option, index) => (
            <button
              key={option.id}
              onClick={() => {
                if (option.id === 'subset') onSelectSubset();
                else if (option.id === 'sample') onUseSample();
                else if (option.id === 'local') onViewLocal();
              }}
              className="w-full text-left p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all group"
            >
              <div className="flex items-start">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-semibold group-hover:bg-blue-600 group-hover:text-white transition-colors">
                  {index + 1}
                </span>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-900 group-hover:text-blue-700">
                    {option.label}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {option.description}
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Botón cancelar */}
        <button
          onClick={onClose}
          className="w-full px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}