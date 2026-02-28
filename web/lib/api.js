// web/lib/api.js
// Llamadas al backend FastAPI

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://organizatext.vercel.app';

// ============================================
// Helper para requests
// ============================================

async function request(endpoint, options = {}) {
  const token = localStorage.getItem('organizatext_token');

  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
    ...options,
  };

  const response = await fetch(`${API_URL}${endpoint}`, config);

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Error desconocido' }));
    throw new Error(error.detail || `Error ${response.status}`);
  }

  return response.json();
}

// ============================================
// Auth
// ============================================

export async function registerUser(email, password) {
  const data = await request('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  localStorage.setItem('organizatext_token', data.access_token);
  localStorage.setItem('organizatext_user', JSON.stringify(data.user));
  return data;
}

export async function loginUser(email, password) {
  const data = await request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  localStorage.setItem('organizatext_token', data.access_token);
  localStorage.setItem('organizatext_user', JSON.stringify(data.user));
  return data;
}

export function logoutUser() {
  localStorage.removeItem('organizatext_token');
  localStorage.removeItem('organizatext_user');
}

export function getCurrentUser() {
  const user = localStorage.getItem('organizatext_user');
  return user ? JSON.parse(user) : null;
}

export function isAuthenticated() {
  return !!localStorage.getItem('organizatext_token');
}

// ============================================
// Metadata sync
// ============================================

export async function syncMetadata(fileId, encryptedData) {
  return request('/metadata/', {
    method: 'POST',
    body: JSON.stringify({
      file_id: fileId,
      encrypted_data: encryptedData,
    }),
  });
}

export async function getAllSyncedMetadata() {
  return request('/metadata/');
}

export async function deleteSyncedMetadata(fileId) {
  return request(`/metadata/${fileId}`, { method: 'DELETE' });
}

export async function checkHealth() {
  return request('/health');
}

export async function deleteAllSyncedMetadata() {
  return request('/metadata/all/', { method: 'DELETE' });
}

export async function deleteSelectedSyncedMetadata(fileIds) {
  return request('/metadata/delete-selected/', {
    method: 'POST',
    body: JSON.stringify({ file_ids: fileIds }),
  });
}