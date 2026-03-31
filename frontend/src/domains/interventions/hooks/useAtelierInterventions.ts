'use client';

import { useQuery } from '@tanstack/react-query';
import { interventionKeys } from '@/lib/query-keys';
import { interventionsIpc } from '../ipc/interventions.ipc';
import type { Intervention } from '@/lib/backend';

export type AtelierStatusFilter =
  | 'all'
  | 'pending'
  | 'in_progress'
  | 'paused'
  | 'completed'
  | 'cancelled';

export interface AtelierKpis {
  total: number;
  inProgress: number;
  paused: number;
  completedToday: number;
}

export interface UseAtelierInterventionsOptions {
  statusFilter?: AtelierStatusFilter;
  /** Technician ID for depth-of-defense frontend scoping (backend enforces this too). */
  technicianId?: string;
}

function computeKpis(interventions: Intervention[]): AtelierKpis {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const startOfDayMs = startOfDay.getTime();

  return {
    total: interventions.length,
    inProgress: interventions.filter((i) => i.status === 'in_progress').length,
    paused: interventions.filter((i) => i.status === 'paused').length,
    completedToday: interventions.filter(
      (i) => i.status === 'completed' && i.completed_at != null && Number(i.completed_at) >= startOfDayMs,
    ).length,
  };
}

export function useAtelierInterventions(options: UseAtelierInterventionsOptions = {}) {
  const { statusFilter = 'all', technicianId } = options;

  const filters: Record<string, unknown> = {};
  if (statusFilter !== 'all') filters.status = statusFilter;
  if (technicianId) filters.technician_id = technicianId;

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: interventionKeys.list(filters),
    queryFn: async () => {
      const result = await interventionsIpc.list({
        status: statusFilter !== 'all' ? statusFilter : undefined,
        technician_id: technicianId,
        limit: 200,
      });
      return result.interventions;
    },
    staleTime: 30_000,
  });

  const interventions = data ?? [];
  const kpis = computeKpis(interventions);

  return { interventions, kpis, isLoading, error, refetch };
}
