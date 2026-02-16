// web/components/EditTagsModal.jsx
// Modal para editar etiquetas y categoría de un archivo

'use client';

import { useState, useEffect } from 'react';
import { DEFAULT_CATEGORIES, TAG_COLORS } from '@/lib/constants';

export default function EditTagsModal({ isOpen, file, onClose, onSave }) {
  const [tags, setTags] = useState([]);
  const [category, setCategory] = useState('Sin categoría');
  const [newTag, setNewTag] = useState('');
  const [customCategory, setCustomCategory] = useState('');
  const [showCustomCategoryInput, setShowCustomCategoryInput] = useState(false);
  const [availableCategories, setAvailableCategories] = useState(DEFAULT_CATEGORIES);

  // Sincronizar con el archivo actual
  useEffect(() => {
    if (file) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setTags(file.tags || []);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCategory(file.category || 'Sin categoría');
    }
  }, [file]);

  if (!isOpen || !file) return null;

  const handleAddTag = () => {
    const trimmed = newTag.trim();
    if (trimmed && !tags.includes(trimmed)) {
      setTags([...tags, trimmed]);
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setTags(tags.filter((tag) => tag !== tagToRemove));
  };

  const handleAddCustomCategory = () => {
    const trimmed = customCategory.trim();
    if (trimmed && !availableCategories.includes(trimmed)) {
      setAvailableCategories([...availableCategories, trimmed]);
      setCategory(trimmed);
      setCustomCategory('');
      setShowCustomCategoryInput(false);
    }
  };

  const handleSave = () => {
    onSave({
      fileId: file.fileId,
      tags,
      category,
    });
    onClose();
  };

  const handleKeyPress = (e, action) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      action();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">
            Editar: {file.fileName}
          </h3>
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

        {/* Body */}
        <div className="px-6 py-4 space-y-6">
          {/* Categoría */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Categoría
            </label>
            <select
              value={category}
              onChange={(e) => {
                if (e.target.value === '__custom__') {
                  setShowCustomCategoryInput(true);
                } else {
                  setCategory(e.target.value);
                }
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {availableCategories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
              <option value="__custom__">+ Crear nueva categoría</option>
            </select>

            {/* Input para categoría personalizada */}
            {showCustomCategoryInput && (
              <div className="mt-3 flex space-x-2">
                <input
                  type="text"
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value)}
                  onKeyPress={(e) => handleKeyPress(e, handleAddCustomCategory)}
                  placeholder="Nombre de la nueva categoría"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  autoFocus
                />
                <button
                  onClick={handleAddCustomCategory}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Agregar
                </button>
                <button
                  onClick={() => {
                    setShowCustomCategoryInput(false);
                    setCustomCategory('');
                  }}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Cancelar
                </button>
              </div>
            )}
          </div>

          {/* Etiquetas */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Etiquetas ({tags.length})
            </label>

            {/* Lista de etiquetas actuales */}
            <div className="flex flex-wrap gap-2 mb-3 min-h-[60px] p-3 border border-gray-200 rounded-lg bg-gray-50">
              {tags.length === 0 ? (
                <p className="text-sm text-gray-400 italic">
                  No hay etiquetas. Agrega una abajo.
                </p>
              ) : (
                tags.map((tag, index) => (
                  <span
                    key={index}
                    className={`
                      px-3 py-1 text-sm font-medium rounded-full flex items-center space-x-2
                      ${TAG_COLORS[index % TAG_COLORS.length]}
                    `}
                  >
                    <span>{tag}</span>
                    <button
                      onClick={() => handleRemoveTag(tag)}
                      className="hover:bg-black hover:bg-opacity-10 rounded-full p-0.5 transition-colors"
                    >
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </button>
                  </span>
                ))
              )}
            </div>

            {/* Input para agregar nueva etiqueta */}
            <div className="flex space-x-2">
              <input
                type="text"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyPress={(e) => handleKeyPress(e, handleAddTag)}
                placeholder="Agregar nueva etiqueta"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <button
                onClick={handleAddTag}
                disabled={!newTag.trim()}
                className={`
                  px-4 py-2 rounded-lg font-medium transition-colors
                  ${
                    newTag.trim()
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  }
                `}
              >
                Agregar
              </button>
            </div>
          </div>

          {/* Información del archivo */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-blue-900 mb-2">
              Información del archivo
            </h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-blue-700 font-medium">Tamaño:</span>{' '}
                <span className="text-blue-900">
                  {(file.fileSize / 1024).toFixed(1)} KB
                </span>
              </div>
              <div>
                <span className="text-blue-700 font-medium">Palabras:</span>{' '}
                <span className="text-blue-900">{file.wordCount}</span>
              </div>
              <div>
                <span className="text-blue-700 font-medium">URLs:</span>{' '}
                <span className="text-blue-900">{file.urls?.length || 0}</span>
              </div>
              <div>
                <span className="text-blue-700 font-medium">Emails:</span>{' '}
                <span className="text-blue-900">{file.emails?.length || 0}</span>
              </div>
              {file.detectado_PII && (
                <div className="col-span-2">
                  <span className="text-red-700 font-medium">⚠ PII detectado:</span>{' '}
                  <span className="text-red-900">
                    {file.piiTypes?.join(', ') || 'información sensible'}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Guardar cambios
          </button>
        </div>
      </div>
    </div>
  );
}