import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { taskKeys } from '@/lib/query-keys';
import type { UpdateTaskRequest } from '@/lib/backend';
import { useAuth } from '@/shared/hooks/useAuth';
import { canEditField, getFieldRestrictionMessage, FIELD_LABELS } from '@/shared/ui/inline-edit/field-permissions';
import { useTaskMutations } from './useTaskMutations';

export interface UseInlineEditTaskOptions {
  taskId: string;
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

export function useInlineEditTask({ taskId, onSuccess, onError }: UseInlineEditTaskOptions) {
  const { user } = useAuth();
  const { updateTask } = useTaskMutations();
  const queryClient = useQueryClient();

  const userRole = user?.role as 'admin' | 'supervisor' | 'technician' | 'viewer' | undefined;

  const canEdit = useCallback(
    (fieldName: string): boolean => {
      return canEditField(userRole, fieldName);
    },
    [userRole]
  );

  const getDisabledReason = useCallback(
    (fieldName: string): string | undefined => {
      if (canEditField(userRole, fieldName)) return undefined;
      const label = FIELD_LABELS[fieldName] || fieldName;
      return `Seuls les administrateurs et superviseurs peuvent modifier le champ "${label}"`;
    },
    [userRole]
  );

  const editField = useCallback(
    async <K extends keyof UpdateTaskRequest>(
      fieldName: K,
      value: UpdateTaskRequest[K]
    ): Promise<boolean> => {
      if (!canEditField(userRole, fieldName)) {
        const message = getFieldRestrictionMessage(fieldName);
        toast.error(message);
        return false;
      }

      try {
        await updateTask.mutateAsync({
          taskId,
          data: { [fieldName]: value } as unknown as UpdateTaskRequest,
        });
        toast.success(`${FIELD_LABELS[fieldName] || fieldName} mis à jour`);
        onSuccess?.();
        return true;
      } catch (error) {
        const err = error instanceof Error ? error : new Error('Erreur de mise à jour');
        toast.error(err.message);
        onError?.(err);
        return false;
      }
    },
    [taskId, userRole, updateTask, onSuccess, onError]
  );

  const updateMultipleFields = useCallback(
    async (fields: Partial<UpdateTaskRequest>): Promise<boolean> => {
      for (const fieldName of Object.keys(fields)) {
        if (!canEditField(userRole, fieldName)) {
          const reason = getDisabledReason(fieldName);
          toast.error(reason || `Vous ne pouvez pas modifier ${fieldName}`);
          return false;
        }
      }

      try {
        await updateTask.mutateAsync({
          taskId,
          data: fields as unknown as UpdateTaskRequest,
        });
        toast.success('Modifications enregistrées');
        onSuccess?.();
        return true;
      } catch (error) {
        const err = error instanceof Error ? error : new Error('Erreur de mise à jour');
        toast.error(err.message);
        onError?.(err);
        return false;
      }
    },
    [taskId, userRole, updateTask, onSuccess, onError, getDisabledReason]
  );

  const invalidateTask = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: taskKeys.byId(taskId) });
    queryClient.invalidateQueries({ queryKey: taskKeys.lists() });
  }, [queryClient, taskId]);

  return {
    canEdit,
    getDisabledReason,
    editField,
    updateMultipleFields,
    invalidateTask,
    isEditing: updateTask.isPending,
    userRole,
  };
}