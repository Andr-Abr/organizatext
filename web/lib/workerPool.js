// web/lib/workerPool.js
// Pool de Web Workers para procesamiento concurrente

import { LIMITS } from './constants';

/**
 * Pool de Web Workers con concurrencia limitada
 */
export class WorkerPool {
  constructor(workerUrl, poolSize = LIMITS.WORKER_CONCURRENCY) {
    this.workerUrl = workerUrl;
    this.poolSize = poolSize;
    this.workers = [];
    this.availableWorkers = [];
    this.queue = [];
    this.activeJobs = new Map();
    this.initialized = false;
  }

  /**
   * Inicializa el pool de workers
   */
  async initialize() {
    if (this.initialized) return;

    for (let i = 0; i < this.poolSize; i++) {
      const worker = new Worker(this.workerUrl, { type: 'module' });
      
      // Esperar a que el worker esté listo
      await new Promise((resolve) => {
        worker.addEventListener('message', function onReady(event) {
          if (event.data.type === 'READY') {
            worker.removeEventListener('message', onReady);
            resolve();
          }
        });
      });

      // Configurar listener de mensajes
      worker.addEventListener('message', (event) => {
        this.handleWorkerMessage(worker, event);
      });

      this.workers.push(worker);
      this.availableWorkers.push(worker);
    }

    this.initialized = true;
  }

  /**
   * Maneja mensajes de los workers
   */
  handleWorkerMessage(worker, event) {
    const { type, fileId, result, status, progress } = event.data;

    const job = this.activeJobs.get(fileId);
    if (!job) return;

    switch (type) {
      case 'PROGRESS':
        if (job.onProgress) {
          job.onProgress({ fileId, status, progress });
        }
        break;

      case 'COMPLETE':
        // Liberar worker
        this.availableWorkers.push(worker);
        this.activeJobs.delete(fileId);

        // Resolver promesa
        if (result.success) {
          job.resolve(result.data);
        } else {
          job.reject(new Error(result.error));
        }

        // Procesar siguiente en cola
        this.processQueue();
        break;
    }
  }

  /**
   * Procesa un archivo
   */
  async processFile(file, fileId, onProgress) {
    if (!this.initialized) {
      await this.initialize();
    }

    return new Promise((resolve, reject) => {
      const job = {
        file,
        fileId,
        onProgress,
        resolve,
        reject,
      };

      this.queue.push(job);
      this.processQueue();
    });
  }

  /**
   * Procesa la cola de trabajos
   */
  processQueue() {
    while (this.queue.length > 0 && this.availableWorkers.length > 0) {
      const job = this.queue.shift();
      const worker = this.availableWorkers.shift();

      this.activeJobs.set(job.fileId, job);

      worker.postMessage({
        type: 'PROCESS_FILE',
        file: job.file,
        fileId: job.fileId,
      });
    }
  }

  /**
   * Obtiene estadísticas del pool
   */
  getStats() {
    return {
      poolSize: this.poolSize,
      activeJobs: this.activeJobs.size,
      queuedJobs: this.queue.length,
      availableWorkers: this.availableWorkers.length,
    };
  }

  /**
   * Termina todos los workers
   */
  terminate() {
    this.workers.forEach((worker) => worker.terminate());
    this.workers = [];
    this.availableWorkers = [];
    this.queue = [];
    this.activeJobs.clear();
    this.initialized = false;
  }
}

/**
 * Instancia singleton del pool (se crea bajo demanda)
 */
let poolInstance = null;

export function getWorkerPool() {
  if (!poolInstance) {
    poolInstance = new WorkerPool('/processor.worker.js');
  }
  return poolInstance;
}

export function terminateWorkerPool() {
  if (poolInstance) {
    poolInstance.terminate();
    poolInstance = null;
  }
}