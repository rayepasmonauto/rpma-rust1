import { EntityType } from '@/lib/backend';

export interface EntitySyncStatus {
  entityId: string;
  entityType: EntityType;
  status: 'synced' | 'pending' | 'syncing' | 'error';
  lastModified: Date;
  error?: string;
}

// Stub — sync domain removed; all data is local SQLite, always "synced"
export function useEntitySyncStatus(_entityId: string, _entityType: EntityType): EntitySyncStatus | null | undefined {
  return null;
}
