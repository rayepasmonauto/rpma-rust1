import { useCallback, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { convertTimestamps } from "@/lib/types";
import type { UpdateTaskRequest, CreateTaskRequest } from "@/lib/backend";
import { ipcClient } from "@/lib/ipc";
import { taskKeys, clientKeys } from "@/lib/query-keys";
import { handleError } from "@/lib/utils/error-handler";
import { LogDomain } from "@/lib/logging/types";
import type { Task, Client } from "@/types";
import { useAuth } from "@/shared/hooks/useAuth";
import { taskIpc } from "../ipc/task.ipc";

export interface TaskWithClient extends Task {
  client_name?: string;
}

export function useTaskManager() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // ── Server-state: tasks (via TanStack Query) ────────────────────────────
  const tasksQuery = useQuery({
    queryKey: taskKeys.lists(),
    queryFn: async () => {
      const result = await taskIpc.list({
        page: 1,
        limit: 100,
      });
      return result.data.map((task) => convertTimestamps(task));
    },
    enabled: !!user?.token,
  });

  // ── Server-state: clients (via TanStack Query) ──────────────────────────
  const clientsQuery = useQuery({
    queryKey: clientKeys.list(),
    queryFn: async () => {
      const result = await ipcClient.clients.list({
        page: 1,
        limit: 100,
        sort_by: "created_at",
        sort_order: "desc",
      });
      return result.data.map((client) => convertTimestamps(client));
    },
    enabled: !!user?.token,
  });

  // ── Derived: join tasks ↔ client names ──────────────────────────────────
  const tasks = useMemo<TaskWithClient[]>(() => {
    const rawTasks = (tasksQuery.data ?? []) as Task[];
    const rawClients = (clientsQuery.data ?? []) as Client[];

    const clientNamesById = new Map(
      rawClients.map((client) => [client.id, client.name]),
    );

    return rawTasks.map((task) => ({
      ...task,
      client_name:
        clientNamesById.get(task.client_id ?? "") || "Client inconnu",
    })) as TaskWithClient[];
  }, [tasksQuery.data, clientsQuery.data]);

  const clients = (clientsQuery.data ?? []) as Client[];

  const isLoading = tasksQuery.isLoading || clientsQuery.isLoading;

  // ── Cache-invalidation helpers ──────────────────────────────────────────
  const invalidateTasks = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: taskKeys.lists() });
  }, [queryClient]);

  const refresh = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: taskKeys.lists() });
    queryClient.invalidateQueries({ queryKey: clientKeys.list() });
  }, [queryClient]);

  // ── Mutations ───────────────────────────────────────────────────────────
  const createMutation = useMutation({
    mutationFn: async (taskData: CreateTaskRequest) => {
      return taskIpc.create(taskData);
    },
    onSuccess: invalidateTasks,
    onError: (error: unknown) => {
      handleError(error, "Task creation failed", {
        domain: LogDomain.TASK,
        userId: user?.user_id,
        component: "TaskManager",
        toastMessage: "Erreur lors de la création de la tâche",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({
      taskId,
      updateData,
    }: {
      taskId: string;
      updateData: UpdateTaskRequest;
    }) => {
      return taskIpc.update(taskId, updateData);
    },
    onSuccess: invalidateTasks,
    onError: (error: unknown) => {
      handleError(error, "Task update failed", {
        domain: LogDomain.TASK,
        userId: user?.user_id,
        component: "TaskManager",
        toastMessage: "Erreur lors de la mise à jour de la tâche",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (taskId: string) => {
      return taskIpc.delete(taskId);
    },
    onSuccess: invalidateTasks,
    onError: (error: unknown) => {
      handleError(error, "Task deletion failed", {
        domain: LogDomain.TASK,
        userId: user?.user_id,
        component: "TaskManager",
        toastMessage: "Erreur lors de la suppression de la tâche",
      });
    },
  });

  // ── Stable callback wrappers (preserve original call signatures) ────────
  const createTask = useCallback(
    async (taskData: CreateTaskRequest) => {
      await createMutation.mutateAsync(taskData);
    },
    [createMutation],
  );

  const updateTask = useCallback(
    async (taskId: string, updateData: UpdateTaskRequest) => {
      await updateMutation.mutateAsync({ taskId, updateData });
    },
    [updateMutation],
  );

  const deleteTask = useCallback(
    async (taskId: string) => {
      await deleteMutation.mutateAsync(taskId);
    },
    [deleteMutation],
  );

  return {
    tasks,
    clients,
    isLoading,
    refresh,
    createTask,
    updateTask,
    deleteTask,
    user,
  };
}
