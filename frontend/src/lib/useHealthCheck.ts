"use client";

import { useQuery } from "@tanstack/react-query";
import { IPC_COMMANDS, safeInvoke } from "@/lib/ipc";
import { systemKeys } from "@/lib/query-keys";

export interface HealthStatus {
  db: boolean;
  version: string;
}

export interface UseHealthCheckOptions {
  enabled?: boolean;
}

/**
 * Checks backend / database health via TanStack Query (ADR-014).
 *
 * Replaces the previous `useState` + `useEffect` + `safeInvoke` pattern
 * with a single `useQuery` call.  The return-type contract is kept
 * identical so that consumers (`GlobalHealthBanner`, tests) are unaffected.
 */
export function useHealthCheck(options: UseHealthCheckOptions = {}) {
  const { enabled = true } = options;

  const query = useQuery<HealthStatus>({
    queryKey: systemKeys.health(),
    queryFn: () => safeInvoke<HealthStatus>(IPC_COMMANDS.SYSTEM_HEALTH_CHECK),
    enabled,
    retry: false,
    staleTime: 1000 * 60, // 1 minute
    refetchOnWindowFocus: false,
  });

  // Derive the same shape the old hook returned:
  //   status:    HealthStatus | null
  //   hasFailed: true when the query errored OR the DB flag is false
  //   isHealthy: true only when we have a successful response with db === true
  const status: HealthStatus | null = query.data ?? null;
  const hasFailed = query.isError || (status !== null && !status.db);

  return {
    status,
    hasFailed,
    isHealthy: Boolean(status?.db) && !hasFailed,
  };
}
