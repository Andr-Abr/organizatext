// web/components/AuthModal.jsx
// Modal de Login y Registro

'use client';

import { useState } from 'react';
import { registerUser, loginUser } from '@/lib/api';

export default function AuthModal({ isOpen, onClose, onSuccess }) {
  const [tab, setTab] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleClose = () => {
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setError('');
    setTab('login');
    onClose();
  };

  const handleSubmit = async () => {
    setError('');

    if (!email || !password) {
      setError('Email y password son requeridos');
      return;
    }

    if (tab === 'register' && password !== confirmPassword) {
      setError('Los passwords no coinciden');
      return;
    }

    if (password.length < 8) {
      setError('El password debe tener al menos 8 caracteres');
      return;
    }

    setLoading(true);
    try {
      if (tab === 'login') {
        await loginUser(email, password);
      } else {
        await registerUser(email, password);
      }
      onSuccess();
      handleClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') handleSubmit();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            {tab === 'login' ? 'Iniciar sesión' : 'Crear cuenta'}
          </h3>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => { setTab('login'); setError(''); }}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${
              tab === 'login'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Iniciar sesión
          </button>
          <button
            onClick={() => { setTab('register'); setError(''); }}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${
              tab === 'register'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Registrarse
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-4 space-y-4">
          {/* Descripción */}
          <p className="text-sm text-gray-600 bg-blue-50 border border-blue-200 rounded-lg p-3">
            {tab === 'login'
              ? 'Inicia sesión para sincronizar tu metadata cifrada entre dispositivos.'
              : 'Crea una cuenta para hacer backup de tu metadata. Tus archivos NUNCA se suben.'}
          </p>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="tu@email.com"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={loading}
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Mínimo 8 caracteres"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={loading}
            />
          </div>

          {/* Confirmar password (solo registro) */}
          {tab === 'register' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Confirmar password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Repite el password"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={loading}
              />
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
          <button
            onClick={handleClose}
            disabled={loading}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className={`px-4 py-2 rounded-lg font-medium transition-colors text-white ${
              loading
                ? 'bg-blue-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {loading
              ? 'Cargando...'
              : tab === 'login' ? 'Iniciar sesión' : 'Crear cuenta'}
          </button>
        </div>
      </div>
    </div>
  );
}