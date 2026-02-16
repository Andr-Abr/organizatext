'use client';

import { useState, useEffect, useCallback } from 'react';
import BannerLimit from '@/components/BannerLimit';
import ModalLimits from '@/components/ModalLimits';
import UploadArea from '@/components/UploadArea';
import WorkerStatus from '@/components/WorkerStatus';
import VirtualFileList from '@/components/VirtualFileList';
import SelectionBar from '@/components/SelectionBar';
import EditTagsModal from '@/components/EditTagsModal';
import { validateFiles, getValidSubset } from '@/lib/fileValidation';
import { getWorkerPool } from '@/lib/workerPool';
import { saveFileMetadata, getAllFileMetadata } from '@/lib/storage';
import { exportToZip } from '@/lib/exporter';
import { generateFileId } from '@/lib/crypto';

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

  // Cargar al montar
  useEffect(() => {
    const loadData = async () => {
      const storedFiles = await getAllFileMetadata();
      if (storedFiles.length > 0) {
        setFiles(storedFiles.map(f => ({ ...f, markedForExport: false })));
      }
    };
    loadData();
  }, []);

  // Función para procesar archivos
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
        const result = await workerPool.processFile(file, fileId, (progress) => {
          setWorkerStats(workerPool.getStats());
        });
        const processedFile = {
          fileId,
          ...result,
          category: 'Sin categoría',
          markedForExport: true,
        };
        newFiles.push(processedFile);
        await saveFileMetadata(fileId, processedFile);
        setProcessedCount((prev) => prev + 1);
      } catch (error) {
        console.error(`Error processing ${file.name}:`, error);
      }
    }
    setFiles((prev) => [...prev, ...newFiles]);
    setFileBlobs(newBlobs);
    setIsProcessing(false);
    setTotalToProcess(0);
    setWorkerStats(null);
  }, [fileBlobs]);

  // Handler de selección de archivos
  const handleFilesSelected = useCallback((selectedFiles) => {
    const validation = validateFiles(selectedFiles);
    if (!validation.valid) {
      setPendingFiles(selectedFiles);
      setShowLimitModal(true);
      return;
    }
    if (validation.warnings.length > 0) {
      console.warn('Warnings:', validation.warnings);
    }
    processFiles(selectedFiles);
  }, [processFiles]);

  const handleSelectSubset = useCallback(() => {
    const subset = getValidSubset(pendingFiles);
    setShowLimitModal(false);
    setPendingFiles([]);
    if (subset.length > 0) {
      processFiles(subset);
    }
  }, [pendingFiles, processFiles]);

  const handleUseSample = useCallback(async () => {
    setShowLimitModal(false);
    setPendingFiles([]);
    try {
      const sampleFiles = [];
      const names = ['contactos', 'reuniones', 'investigacion', 'presupuesto', 'ideas', 'codigo-snippet', 'checklist', 'logs', 'email-draft', 'recursos'];
      for (let i = 1; i <= 10; i++) {
        const fileName = `ejemplo-${String(i).padStart(2, '0')}-${names[i - 1]}.txt`;
        const response = await fetch(`/sample-data/${fileName}`);
        const blob = await response.blob();
        const file = new File([blob], fileName, { type: 'text/plain' });
        sampleFiles.push(file);
      }
      processFiles(sampleFiles);
    } catch (error) {
      console.error('Error loading sample data:', error);
      alert('Error al cargar archivos de ejemplo');
    }
  }, [processFiles]);

  const handleViewLocal = useCallback(() => {
    setShowLimitModal(false);
    setPendingFiles([]);
    window.open('https://github.com/Andr-Abr/organizatext#version-local', '_blank');
  }, []);

  const handleToggleSelect = useCallback((fileId) => {
    setFiles((prev) => prev.map((f) => f.fileId === fileId ? { ...f, markedForExport: !f.markedForExport } : f));
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
    // Actualizar en estado
    setFiles((prev) =>
      prev.map((f) =>
        f.fileId === fileId ? { ...f, tags, category } : f
      )
    );

    // Actualizar en IndexedDB
    const file = files.find((f) => f.fileId === fileId);
    if (file) {
      await saveFileMetadata(fileId, { ...file, tags, category });
    }

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
      console.error('Export error:', error);
      alert('Error al exportar: ' + error.message);
    }
  }, [files, fileBlobs]);

  const handleClearAll = useCallback(() => {
    if (confirm('¿Estás seguro de eliminar todos los archivos procesados?')) {
      setFiles([]);
      setFileBlobs(new Map());
    }
  }, []);

  const selectedCount = files.filter((f) => f.markedForExport).length;

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Organizatext</h1>
              <p className="text-sm text-gray-600 mt-1">
                Procesamiento de archivos .txt en navegador • 100% offline
              </p>
            </div>
          </div>
        </div>
      </header>
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
      <ModalLimits
        isOpen={showLimitModal}
        onClose={() => {
          setShowLimitModal(false);
          setPendingFiles([]);
        }}
        onSelectSubset={handleSelectSubset}
        onUseSample={handleUseSample}
        onViewLocal={handleViewLocal}
      />
      <EditTagsModal
        isOpen={showEditModal}
        file={editingFile}
        onClose={() => {
          setShowEditModal(false);
          setEditingFile(null);
        }}
        onSave={handleSaveEdit}
      />
      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 text-center text-sm text-gray-500">
          <p>Organizatext v1.0 • Tus archivos NUNCA salen del navegador</p>
        </div>
      </footer>
    </main>
  );
}