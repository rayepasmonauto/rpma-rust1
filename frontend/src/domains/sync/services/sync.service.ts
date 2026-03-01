import { ipcClient } from '@/lib/ipc';

interface BackendSyncStatus {
  network_available: boolean;
  is_running: boolean;
  is_syncing: boolean;
  pending_operations: number;
  failed_operations: number;
  total_operations: number;
  last_sync_at?: number;
  last_sync?: number;
  errors?: string[];
}

export interface SyncStatus {
  is_online: boolean;
  isOnline: boolean;
  isRunning: boolean;
  is_syncing: boolean;
  isSyncing: boolean;
  pending_operations: number;
  pendingOperations: number;
  failed_operations: number;
  total_operations: number;
  last_sync_at?: number;
  lastSync?: Date;
  error?: string;
  errors: string[];
  metrics: {
    totalSyncOperations: number;
    successfulSyncs: number;
    failedSyncs: number;
    averageSyncDuration: number;
  };
}

export class SyncService {
  private static instance: SyncService;

  static getInstance(): SyncService {
    if (!SyncService.instance) {
      SyncService.instance = new SyncService();
    }
    return SyncService.instance;
  }

  async getStatus(): Promise<SyncStatus> {
    const result = await ipcClient.sync.getStatus() as unknown as BackendSyncStatus;
    return {
      is_online: result.network_available ?? false,
      isOnline: result.network_available ?? false,
      isRunning: result.is_running ?? false,
      is_syncing: result.is_syncing ?? false,
      isSyncing: result.is_syncing ?? false,
      pending_operations: result.pending_operations ?? 0,
      pendingOperations: result.pending_operations ?? 0,
      failed_operations: result.failed_operations ?? 0,
      total_operations: result.total_operations ?? 0,
      last_sync_at: result.last_sync_at,
      lastSync: result.last_sync ? new Date(result.last_sync) : undefined,
      errors: result.errors || [],
      metrics: {
        totalSyncOperations: 0,
        successfulSyncs: 0,
        failedSyncs: 0,
        averageSyncDuration: 0,
      },
    };
  }

  async getOperationsForEntity(entityId: string, entityType: string) {
    return await ipcClient.sync.getOperationsForEntity(entityId, entityType);
  }
}

export const syncService = SyncService.getInstance();
