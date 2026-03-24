import { useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { statusApi } from "@/lib/ipc/status";
import type { StatusDistribution, Task, TaskQuery } from "@/lib/backend";
import { taskKeys } from "@/lib/query-keys";
import { taskIpc } from "../ipc/task.ipc";

/**
 * Hook for Kanban board task status management.
 *
 * Uses TanStack Query for server state (ADR-014) instead of manual
 * useState+useEffect. Two queries run in parallel:
 * - task list for the board
 * - status distribution counts
 *
 * Status transitions are handled via useMutation with automatic
 * cache invalidation on success.
 */
export function useTaskStatus() {
  const queryClient = useQueryClient();

  // ── Queries ───────────────────────────────────────────────────────────────

  const tasksQuery = useQuery<Task[]>({
    queryKey: taskKeys.lists(),
    queryFn: async () => {
      const query: Partial<TaskQuery> = {};
      const result = await taskIpc.list(query);
      return result.data;
    },
  });

  const distributionQuery = useQuery<StatusDistribution>({
    queryKey: taskKeys.statusDistribution(),
    queryFn: () => statusApi.getStatusDistribution(),
  });

  // ── Mutation ──────────────────────────────────────────────────────────────

  const transitionMutation = useMutation({
    mutationFn: async (params: {
      taskId: string;
      newStatus: string;
      reason?: string;
    }) => {
      return statusApi.transitionStatus({
        task_id: params.taskId,
        new_status: params.newStatus,
        reason: params.reason || null,
        correlation_id: null,
      });
    },
    onSuccess: () => {
      // Invalidate both queries so the board and counters refresh together
      queryClient.invalidateQueries({ queryKey: taskKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: taskKeys.statusDistribution(),
      });
    },
  });

  /**
   * Transition a task to a new status.
   *
   * Preserves the original return-value contract so existing consumers
   * (e.g. KanbanBoard drag-and-drop handler) keep working unchanged.
   */
  const transitionStatus = useCallback(
    async (
      taskId: string,
      newStatus: string,
      reason?: string,
    ): Promise<
      { success: true; data: unknown } | { success: false; error: string }
    > => {
      try {
        const data = await transitionMutation.mutateAsync({
          taskId,
          newStatus,
          reason,
        });
        toast.success(`Task status updated to ${newStatus}`);
        return { success: true, data };
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to update task status";
        toast.error(message);
        return { success: false, error: message };
      }
    },
    [transitionMutation],
  );

  // ── Public interface (unchanged shape) ────────────────────────────────────

  return {
    tasks: tasksQuery.data ?? [],
    loading: tasksQuery.isLoading,
    error:
      tasksQuery.error?.message ?? distributionQuery.error?.message ?? null,
    distribution: distributionQuery.data ?? null,
    transitionStatus,
    refetchTasks: tasksQuery.refetch,
    refetchDistribution: distributionQuery.refetch,
  };
}
