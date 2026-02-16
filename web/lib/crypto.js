// web/lib/crypto.js
// Funciones de cifrado/descifrado cliente-side con Web Crypto API
// Usado para sincronización opcional de metadata cifrada

import { CRYPTO_CONFIG } from './constants';

/**
 * Genera salt aleatorio
 */
function generateSalt() {
  return crypto.getRandomValues(new Uint8Array(CRYPTO_CONFIG.SALT_LENGTH));
}

/**
 * Genera IV (Initialization Vector) aleatorio
 */
function generateIV() {
  return crypto.getRandomValues(new Uint8Array(CRYPTO_CONFIG.IV_LENGTH));
}

/**
 * Deriva una clave criptográfica desde un password usando PBKDF2
 * @param {string} password - Password del usuario
 * @param {Uint8Array} salt - Salt para derivación
 * @returns {Promise<CryptoKey>}
 */
async function deriveKey(password, salt) {
  const encoder = new TextEncoder();
  const passwordBuffer = encoder.encode(password);

  // Importar password como CryptoKey
  const baseKey = await crypto.subtle.importKey(
    'raw',
    passwordBuffer,
    'PBKDF2',
    false,
    ['deriveBits', 'deriveKey']
  );

  // Derivar clave AES-GCM
  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: CRYPTO_CONFIG.PBKDF2_ITERATIONS,
      hash: CRYPTO_CONFIG.PBKDF2_HASH,
    },
    baseKey,
    {
      name: CRYPTO_CONFIG.ALGORITHM,
      length: CRYPTO_CONFIG.KEY_LENGTH,
    },
    false, // No extraíble
    ['encrypt', 'decrypt']
  );
}

/**
 * Cifra datos con AES-GCM
 * @param {string} data - Datos a cifrar (JSON string)
 * @param {string} password - Password del usuario
 * @returns {Promise<Object>} - { ciphertext, salt, iv } en base64
 */
export async function encryptData(data, password) {
  try {
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);

    // Generar salt e IV aleatorios
    const salt = generateSalt();
    const iv = generateIV();

    // Derivar clave
    const key = await deriveKey(password, salt);

    // Cifrar
    const ciphertext = await crypto.subtle.encrypt(
      {
        name: CRYPTO_CONFIG.ALGORITHM,
        iv: iv,
      },
      key,
      dataBuffer
    );

    // Convertir a base64 para transmisión
    return {
      ciphertext: arrayBufferToBase64(ciphertext),
      salt: arrayBufferToBase64(salt),
      iv: arrayBufferToBase64(iv),
      algorithm: CRYPTO_CONFIG.ALGORITHM,
    };
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Failed to encrypt data');
  }
}

/**
 * Descifra datos con AES-GCM
 * @param {Object} encryptedData - { ciphertext, salt, iv } en base64
 * @param {string} password - Password del usuario
 * @returns {Promise<string>} - Datos descifrados (JSON string)
 */
export async function decryptData(encryptedData, password) {
  try {
    const { ciphertext, salt, iv } = encryptedData;

    // Convertir de base64 a ArrayBuffer
    const ciphertextBuffer = base64ToArrayBuffer(ciphertext);
    const saltBuffer = base64ToArrayBuffer(salt);
    const ivBuffer = base64ToArrayBuffer(iv);

    // Derivar clave
    const key = await deriveKey(password, new Uint8Array(saltBuffer));

    // Descifrar
    const decryptedBuffer = await crypto.subtle.decrypt(
      {
        name: CRYPTO_CONFIG.ALGORITHM,
        iv: new Uint8Array(ivBuffer),
      },
      key,
      ciphertextBuffer
    );

    // Convertir a string
    const decoder = new TextDecoder();
    return decoder.decode(decryptedBuffer);
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Failed to decrypt data (wrong password?)');
  }
}

/**
 * Genera un hash de password (para autenticación, no para cifrado)
 * Nota: El backend debería hacer su propio hashing con bcrypt/argon2
 */
export async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return arrayBufferToBase64(hashBuffer);
}

/**
 * Valida si un password puede descifrar datos cifrados
 */
export async function validatePassword(encryptedData, password) {
  try {
    await decryptData(encryptedData, password);
    return true;
  } catch {
    return false;
  }
}

// ============================================
// Utilidades de conversión
// ============================================

function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToArrayBuffer(base64) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

/**
 * Genera un ID único para un archivo (hash SHA-256)
 */
export async function generateFileId(file) {
  const buffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  return arrayBufferToBase64(hashBuffer).substring(0, 16); // Primeros 16 chars
}