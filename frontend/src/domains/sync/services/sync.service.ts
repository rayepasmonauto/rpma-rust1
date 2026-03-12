// Sync service stub — sync domain removed (local SQLite, no network sync)
export interface SyncStatus {
  isOnline: boolean;
  pendingOperations: number;
  errors: string[];
  lastSyncTime?: string;
}

export class SyncService {
  async getStatus(): Promise<SyncStatus> {
    return { isOnline: true, pendingOperations: 0, errors: [] };
  }

  async getOperationsForEntity(_entityId: string, _entityType: string): Promise<unknown[]> {
    return [];
  }
}

export const syncService = new SyncService();
