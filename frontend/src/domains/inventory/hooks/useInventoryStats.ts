'use client';

import { useQuery } from '@tanstack/react-query';
import { inventoryKeys } from '@/lib/query-keys';
import { canAccessInventory } from '@/types/auth.types';
import { useAuth } from '@/shared/hooks/useAuth';
import { inventoryIpc } from '../ipc/inventory.ipc';
import type { InventoryStats } from '../api/types';

const AUTH_ERROR_MESSAGE = 'Authentication required';
const PERMISSION_ERROR_MESSAGE = 'Insufficient permissions for inventory access';

export function useInventoryStats() {
  const { user } = useAuth();
  const sessionToken = user?.token;
  const hasInventoryAccess = canAccessInventory(user ?? null);
  const authError = !sessionToken
    ? AUTH_ERROR_MESSAGE
    : !hasInventoryAccess
      ? PERMISSION_ERROR_MESSAGE
      : null;

  const query = useQuery({
    queryKey: inventoryKeys.dashboard(),
    queryFn: () => inventoryIpc.getDashboardData(),
    select: (data) => data.stats as InventoryStats,
    enabled: !authError,
    retry: false,
  });

  return {
    stats: authError ? null : (query.data ?? null),
    loading: authError ? false : query.isLoading,
    error: authError ?? (query.error instanceof Error ? query.error.message : null),
    refetch: async () => {
      if (!authError) {
        await query.refetch();
      }
    },
  };
}
