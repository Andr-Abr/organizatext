'use client';

import { useState, useEffect, useCallback } from 'react';
import BannerLimit from '@/components/BannerLimit';
import ModalLimits from '@/components/ModalLimits';
import UploadArea from '@/components/UploadArea';
import WorkerStatus from '@/components/WorkerStatus';
import VirtualFileList from '@/components/VirtualFileList';
import SelectionBar from '@/components/SelectionBar';
import EditTagsModal from '@/components/EditTagsModal';
import AuthModal from '@/components/AuthModal';
import { validateFiles, getValidSubset } from '@/lib/fileValidation';
import { getWorkerPool } from '@/lib/workerPool';
import { saveFileMetadata, getAllFileMetadata } from '@/lib/storage';
import { exportToZip } from '@/lib/exporter';
import { generateFileId } from '@/lib/crypto';
import { getCurrentUser, logoutUser, isAuthenticated } from '@/lib/api';

export default function Home() {
  const [files, setFiles] = useState([]);
  const [fileBlobs, setFileBlobs] = useState(new Map());
  const [isProcessing, setIsProcessing] = useState(false);
  const [processedCount, setProcessedCount] = useState(0);
  const [totalToProcess, setTotalToProcess] = useState(0);
  const [workerStats, setWorkerStats] = useState(null);
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [pendingFiles, setPendingFiles] = useState([]);
  const [editingFile, setEditingFile] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [syncEnabled, setSyncEnabled] = useState(false);
  const [syncStatus, setSyncStatus] = useState('');

  // Cargar al montar
  useEffect(() => {
    const loadData = async () => {
      const storedFiles = await getAllFileMetadata();
      if (storedFiles.length > 0) {
        setFiles(storedFiles.map(f => ({ ...f, markedForExport: false })));
      }
    };
    loadData();

    // Verificar si hay usuario logueado
    const user = getCurrentUser();
    if (user) setCurrentUser(user);
  }, []);

  const processFiles = useCallback(async (filesToProcess) => {
    setIsProcessing(true);
    setProcessedCount(0);
    setTotalToProcess(filesToProcess.length);
    const workerPool = getWorkerPool();
    const newFiles = [];
    const newBlobs = new Map(fileBlobs);

    for (const file of filesToProcess) {
      try {
        const fileId = await generateFileId(file);
        newBlobs.set(fileId, file);

        const result = await workerPool.processFile(file, fileId, () => {
          setWorkerStats(workerPool.getStats());
        });

        // Buscar metadata existente por fileId (hash exacto)
        // o por nombre de archivo (coincidencia aproximada)
        const existingById = files.find(f => f.fileId === fileId);
        const existingByName = files.find(
          f => f.fileName === file.name && f.restoredFromSync
        );
        const existing = existingById || existingByName;

        const processedFile = {
          fileId,
          ...result,
          // Si hay metadata previa, usarla; si no, valores por defecto
          category: existing?.category || 'Sin categoría',
          tags: existing?.tags?.length > 0 ? existing.tags : (result.tags || []),
          markedForExport: true,
          // Marcar si se restauró metadata automáticamente
          metadataRestored: !!existing,
        };

        newFiles.push(processedFile);
        await saveFileMetadata(fileId, processedFile);
        setProcessedCount((prev) => prev + 1);
      } catch (error) {
        console.error(`Error processing ${file.name}:`, error);
      }
    }
    setFiles((prev) => {
      // Reemplazar archivos restaurados con la versión real procesada
      const restoredIds = new Set(
        prev.filter(f => f.restoredFromSync).map(f => f.fileId)
      );
      const newFileIds = new Set(newFiles.map(f => f.fileId));
      const newFileNames = new Set(newFiles.map(f => f.fileName));

      // Filtrar los restaurados que ya tienen versión real
      const filtered = prev.filter(f =>
        !(f.restoredFromSync && (newFileIds.has(f.fileId) || newFileNames.has(f.fileName)))
      );
      return [...filtered, ...newFiles];
    });
    setFileBlobs(newBlobs);
    setIsProcessing(false);
    setTotalToProcess(0);
    setWorkerStats(null);
  }, [fileBlobs, files]);

  const handleFilesSelected = useCallback((selectedFiles) => {
    const validation = validateFiles(selectedFiles);
    if (!validation.valid) {
      setPendingFiles(selectedFiles);
      setShowLimitModal(true);
      return;
    }
    processFiles(selectedFiles);
  }, [processFiles]);

  const handleSelectSubset = useCallback(() => {
    const subset = getValidSubset(pendingFiles);
    setShowLimitModal(false);
    setPendingFiles([]);
    if (subset.length > 0) processFiles(subset);
  }, [pendingFiles, processFiles]);

  const handleUseSample = useCallback(async () => {
    setShowLimitModal(false);
    setPendingFiles([]);
    try {
      const names = ['contactos', 'reuniones', 'investigacion', 'presupuesto', 'ideas', 'codigo-snippet', 'checklist', 'logs', 'email-draft', 'recursos'];
      const sampleFiles = await Promise.all(
        names.map(async (name, i) => {
          const fileName = `ejemplo-${String(i + 1).padStart(2, '0')}-${name}.txt`;
          const response = await fetch(`/sample-data/${fileName}`);
          const blob = await response.blob();
          return new File([blob], fileName, { type: 'text/plain' });
        })
      );
      processFiles(sampleFiles);
    } catch (error) {
      alert('Error al cargar archivos de ejemplo');
    }
  }, [processFiles]);

  const handleViewLocal = useCallback(() => {
    setShowLimitModal(false);
    setPendingFiles([]);
    window.open('https://github.com/Andr-Abr/organizatext#version-local', '_blank');
  }, []);

  const handleToggleSelect = useCallback((fileId) => {
    setFiles((prev) => prev.map((f) =>
      f.fileId === fileId ? { ...f, markedForExport: !f.markedForExport } : f
    ));
  }, []);

  const handleSelectAll = useCallback(() => {
    setFiles((prev) => prev.map((f) => ({ ...f, markedForExport: true })));
  }, []);

  const handleDeselectAll = useCallback(() => {
    setFiles((prev) => prev.map((f) => ({ ...f, markedForExport: false })));
  }, []);

  const handleDownload = useCallback((fileId) => {
    const blob = fileBlobs.get(fileId);
    const file = files.find((f) => f.fileId === fileId);
    if (blob && file) {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.fileName;
      a.click();
      URL.revokeObjectURL(url);
    }
  }, [fileBlobs, files]);

  const handleEditTags = useCallback((fileId) => {
    const file = files.find((f) => f.fileId === fileId);
    if (file) {
      setEditingFile(file);
      setShowEditModal(true);
    }
  }, [files]);

  const handleSaveEdit = useCallback(async ({ fileId, tags, category }) => {
    setFiles((prev) => prev.map((f) =>
      f.fileId === fileId ? { ...f, tags, category } : f
    ));
    const file = files.find((f) => f.fileId === fileId);
    if (file) await saveFileMetadata(fileId, { ...file, tags, category });
    setShowEditModal(false);
    setEditingFile(null);
  }, [files]);

  const handleExport = useCallback(async () => {
    const selectedFiles = files.filter((f) => f.markedForExport);
    if (selectedFiles.length === 0) {
      alert('Selecciona al menos un archivo para exportar');
      return;
    }
    try {
      await exportToZip(selectedFiles, fileBlobs);
    } catch (error) {
      alert('Error al exportar: ' + error.message);
    }
  }, [files, fileBlobs]);

  const handleClearAll = useCallback(() => {
    if (confirm('¿Estás seguro de eliminar todos los archivos procesados?')) {
      setFiles([]);
      setFileBlobs(new Map());
    }
  }, []);

  // Sincronización con backend
  const handleSync = useCallback(async () => {
    if (!isAuthenticated()) {
      setShowAuthModal(true);
      return;
    }
    setSyncStatus('syncing');
    try {
      const { encryptData } = await import('@/lib/crypto');
      const password = prompt('Ingresa tu password para cifrar la metadata:');
      if (!password) { setSyncStatus(''); return; }

      let synced = 0;
      for (const file of files) {
        const encrypted = await encryptData(JSON.stringify({
          fileName: file.fileName,
          tags: file.tags,
          category: file.category,
          wordCount: file.wordCount,
        }), password);
        const { syncMetadata } = await import('@/lib/api');
        await syncMetadata(file.fileId, encrypted);
        synced++;
      }
      setSyncStatus('success');
      setTimeout(() => setSyncStatus(''), 3000);
      alert(`✅ ${synced} archivos sincronizados correctamente`);
    } catch (error) {
      setSyncStatus('error');
      setTimeout(() => setSyncStatus(''), 3000);
      alert('Error al sincronizar: ' + error.message);
    }
  }, [files]);

  const handleCleanDB = useCallback(async () => {
    if (!isAuthenticated()) {
      alert('Debes iniciar sesión para limpiar la base de datos');
      return;
    }

    const selectedFiles = files.filter((f) => f.markedForExport);
    const hasSelection = selectedFiles.length > 0;

    const message = hasSelection
      ? `¿Eliminar ${selectedFiles.length} archivos seleccionados de MongoDB?`
      : '¿Eliminar TODA tu metadata de MongoDB?\n\nEsto no elimina los archivos locales.';

    if (!confirm(message)) return;

    try {
      if (hasSelection) {
        const { deleteSelectedSyncedMetadata } = await import('@/lib/api');
        const result = await deleteSelectedSyncedMetadata(
          selectedFiles.map(f => f.fileId)
        );
        alert(`✅ ${result.deleted} registros eliminados de MongoDB`);
      } else {
        const { deleteAllSyncedMetadata } = await import('@/lib/api');
        const result = await deleteAllSyncedMetadata();
        alert(`✅ ${result.deleted} registros eliminados de MongoDB`);
      }
    } catch (error) {
      alert('Error al limpiar: ' + error.message);
    }
  }, [files]);
  
  const handleLogout = useCallback(() => {
    logoutUser();
    setCurrentUser(null);
    setSyncEnabled(false);
    setSyncStatus('');
  }, []);

  const handleAuthSuccess = useCallback(async () => {
    const user = getCurrentUser();
    setCurrentUser(user);

    // Preguntar si desea restaurar metadata del servidor
    const wantRestore = confirm(
      '¿Deseas restaurar tu metadata sincronizada desde el servidor?\n\n' +
      'Necesitarás tu password para descifrarla.'
    );

    if (!wantRestore) return;

    try {
      const password = prompt('Ingresa tu password para descifrar la metadata:');
      if (!password) return;

      const { getAllSyncedMetadata } = await import('@/lib/api');
      const { decryptData } = await import('@/lib/crypto');

      const response = await getAllSyncedMetadata();

      if (!response.items || response.items.length === 0) {
        alert('No hay metadata sincronizada en el servidor.');
        return;
      }

      const restoredFiles = [];
      let errors = 0;

      for (const item of response.items) {
        try {
          const decrypted = await decryptData(item.encrypted_data, password);
          const metadata = JSON.parse(decrypted);

          const restoredFile = {
            fileId: item.file_id,
            fileName: metadata.fileName,
            tags: metadata.tags || [],
            category: metadata.category || 'Sin categoría',
            wordCount: metadata.wordCount || 0,
            fileSize: 0,
            markedForExport: false,
            detectado_PII: false,
            urls: [],
            emails: [],
            restoredFromSync: true,
          };

          restoredFiles.push(restoredFile);
          await saveFileMetadata(item.file_id, restoredFile);
        } catch {
          errors++;
        }
      }

      if (restoredFiles.length > 0) {
        setFiles((prev) => {
          const existingIds = new Set(prev.map(f => f.fileId));
          const newFiles = restoredFiles.filter(f => !existingIds.has(f.fileId));
          return [...prev, ...newFiles];
        });
        alert(
          `✅ ${restoredFiles.length} archivos restaurados.` +
          (errors > 0 ? `\n⚠️ ${errors} no se pudieron descifrar (password incorrecto).` : '')
        );
      } else {
        alert('No se pudo descifrar ningún archivo. Verifica tu password.');
      }

    } catch (error) {
      alert('Error al restaurar: ' + error.message);
    }
  }, []);

  const selectedCount = files.filter((f) => f.markedForExport).length;

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Organizatext</h1>
              <p className="text-xs text-gray-500 mt-0.5">
                Procesamiento de archivos .txt • 100% offline
              </p>
            </div>

            {/* Acciones del header */}
            <div className="flex items-center space-x-3">
              {/* Toggle sincronización (solo si logueado) */}
              {currentUser && (
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-gray-600">Sync</span>
                  <button
                    onClick={() => setSyncEnabled((prev) => !prev)}
                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                      syncEnabled ? 'bg-blue-600' : 'bg-gray-300'
                    }`}
                  >
                    <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                      syncEnabled ? 'translate-x-5' : 'translate-x-1'
                    }`} />
                  </button>
                </div>
              )}

              {/* Botón sync */}
              {currentUser && syncEnabled && files.length > 0 && (
                <button
                  onClick={handleSync}
                  disabled={syncStatus === 'syncing'}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                    syncStatus === 'syncing' ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : syncStatus === 'success' ? 'bg-green-100 text-green-700'
                    : syncStatus === 'error' ? 'bg-red-100 text-red-700'
                    : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                  }`}
                >
                  {syncStatus === 'syncing' ? '⏳ Sincronizando...'
                    : syncStatus === 'success' ? '✅ Sincronizado'
                    : syncStatus === 'error' ? '❌ Error'
                    : '☁️ Sincronizar'}
                </button>
              )}
              
              {/* Botón limpiar DB */}
              {currentUser && (
                <button
                  onClick={handleCleanDB}
                  className="px-3 py-1.5 text-xs font-medium bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                  title={selectedCount > 0 ? `Eliminar ${selectedCount} seleccionados de MongoDB` : 'Eliminar toda la metadata de MongoDB'}
                >
                  {selectedCount > 0 ? `🗑️ Limpiar (${selectedCount})` : '🗑️ Limpiar DB'}
                </button>
              )}

              {/* Usuario logueado */}
              {currentUser ? (
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded-lg max-w-[120px] truncate">
                    {currentUser.email}
                  </span>
                  <button
                    onClick={handleLogout}
                    className="px-3 py-1.5 text-xs font-medium bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    Salir
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowAuthModal(true)}
                  className="px-3 py-1.5 text-xs font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Iniciar sesión
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <BannerLimit />

        {files.length === 0 && !isProcessing && (
          <UploadArea onFilesSelected={handleFilesSelected} isProcessing={isProcessing} />
        )}

        {isProcessing && (
          <WorkerStatus stats={workerStats} processedCount={processedCount} totalCount={totalToProcess} />
        )}

        {files.length > 0 && (
          <>
            <SelectionBar
              selectedCount={selectedCount}
              totalCount={files.length}
              onSelectAll={handleSelectAll}
              onDeselectAll={handleDeselectAll}
              onExport={handleExport}
              onClearAll={handleClearAll}
            />
            <VirtualFileList
              files={files}
              onToggleSelect={handleToggleSelect}
              onDownload={handleDownload}
              onEditTags={handleEditTags}
              height={600}
            />
            {!isProcessing && (
              <div className="mt-6 text-center">
                <button
                  onClick={() => document.getElementById('file-input-extra')?.click()}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors shadow-lg"
                >
                  Cargar más archivos
                </button>
                <input
                  id="file-input-extra"
                  type="file"
                  multiple
                  accept=".txt"
                  onChange={(e) => handleFilesSelected(Array.from(e.target.files || []))}
                  className="hidden"
                />
              </div>
            )}
          </>
        )}
      </div>

      {/* Modales */}
      <ModalLimits
        isOpen={showLimitModal}
        onClose={() => { setShowLimitModal(false); setPendingFiles([]); }}
        onSelectSubset={handleSelectSubset}
        onUseSample={handleUseSample}
        onViewLocal={handleViewLocal}
      />
      <EditTagsModal
        isOpen={showEditModal}
        file={editingFile}
        onClose={() => { setShowEditModal(false); setEditingFile(null); }}
        onSave={handleSaveEdit}
      />
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={handleAuthSuccess}
      />

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 text-center text-sm text-gray-500">
          <p>Organizatext v1.0 • Tus archivos NUNCA salen del navegador</p>
        </div>
      </footer>
    </main>
  );
}