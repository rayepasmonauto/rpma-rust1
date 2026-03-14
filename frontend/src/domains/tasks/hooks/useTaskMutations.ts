import { useMutation, useQueryClient } from '@tanstack/react-query';
import { taskKeys } from '@/lib/query-keys';
import { taskIpc } from '../ipc/task.ipc';
import { useAuth } from '@/shared/hooks/useAuth';
import type { UpdateTaskRequest } from '@/lib/backend';
import type { JsonObject } from '@/types/json';

/**
 * Hook providing common task mutations with automatic cache invalidation
 */
export function useTaskMutations() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const invalidateTask = (taskId: string) => {
    queryClient.invalidateQueries({ queryKey: taskKeys.byId(taskId) });
    queryClient.invalidateQueries({ queryKey: taskKeys.lists() });
  };

  const updateTaskMutation = useMutation({
    mutationFn: async ({ taskId, data }: { taskId: string; data: UpdateTaskRequest }) => {
      if (!user?.token) throw new Error('Utilisateur non authentifié');
      return taskIpc.update(taskId, data);
    },
    onSuccess: (_, { taskId }) => invalidateTask(taskId),
  });

  const deleteTaskMutation = useMutation({
    mutationFn: async (taskId: string) => {
      if (!user?.token) throw new Error('Utilisateur non authentifié');
      return taskIpc.delete(taskId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: taskKeys.lists() });
    },
  });

  const editTaskMutation = useMutation({
    mutationFn: async ({ taskId, data }: { taskId: string; data: JsonObject }) => {
      if (!user?.token) throw new Error('Utilisateur non authentifié');
      return taskIpc.editTask(taskId, data);
    },
    onSuccess: (_, { taskId }) => invalidateTask(taskId),
  });

  const reportIssueMutation = useMutation({
    mutationFn: async ({
      taskId,
      issueType,
      severity,
      description
    }: {
      taskId: string;
      issueType: string;
      severity: string;
      description: string;
    }) => {
      if (!user?.token) throw new Error('Utilisateur non authentifié');
      return taskIpc.reportTaskIssue(taskId, issueType, severity, description);
    },
    onSuccess: (_, { taskId }) => invalidateTask(taskId),
  });

  const delayTaskMutation = useMutation({
    mutationFn: async ({
      taskId,
      newDate,
      reason
    }: {
      taskId: string;
      newDate: string;
      reason: string;
    }) => {
      if (!user?.token) throw new Error('Utilisateur non authentifié');
      return taskIpc.delayTask(taskId, newDate, reason);
    },
    onSuccess: (_, { taskId }) => invalidateTask(taskId),
  });

  const sendMessageMutation = useMutation({
    mutationFn: async ({
      taskId,
      message,
      messageType
    }: {
      taskId: string;
      message: string;
      messageType: string;
    }) => {
      if (!user?.token) throw new Error('Utilisateur non authentifié');
      return taskIpc.sendTaskMessage(taskId, message, messageType);
    },
    // No need to invalidate task cache for messages usually, but we could
    onSuccess: (_, { taskId }) => invalidateTask(taskId),
  });

  return {
    updateTask: updateTaskMutation,
    deleteTask: deleteTaskMutation,
    editTask: editTaskMutation,
    reportIssue: reportIssueMutation,
    delayTask: delayTaskMutation,
    sendMessage: sendMessageMutation,
  };
}
