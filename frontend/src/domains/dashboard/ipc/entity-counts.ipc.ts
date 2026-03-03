import { safeInvoke } from '@/lib/ipc/core';

export interface EntityCountsResponse {
  tasks?: number;
  clients?: number;
  interventions?: number;
}

export const entityCountsIpc = {
  getCounts: (sessionToken: string) =>
    safeInvoke<EntityCountsResponse>('get_entity_counts', {
      sessionToken,
    }),
};
