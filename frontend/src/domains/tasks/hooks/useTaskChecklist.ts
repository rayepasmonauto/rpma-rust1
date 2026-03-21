import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { taskIpc } from '../ipc/task.ipc';
import type { ChecklistItem } from '@/lib/backend';

/**
 * Loads and manages checklist items for a task via backend IPC.
 * Replaces the previous localStorage-based workaround.
 */
export function useTaskChecklist(taskId: string | undefined) {
  const [items, setItems] = useState<ChecklistItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!taskId) {
      setItems([]);
      return;
    }

    let cancelled = false;
    setIsLoading(true);

    taskIpc.checklistItemsGet(taskId)
      .then((data) => {
        if (!cancelled) setItems(data ?? []);
      })
      .catch(() => {
        if (!cancelled) setItems([]);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => { cancelled = true; };
  }, [taskId]);

  const toggleItem = useCallback(async (itemId: string, completed: boolean) => {
    if (!taskId) return;

    // Optimistic update
    setItems(prev => prev.map(item =>
      item.id === itemId ? { ...item, is_completed: completed } : item
    ));

    try {
      const updated = await taskIpc.checklistItemUpdate(itemId, taskId, { is_completed: completed });
      setItems(prev => prev.map(item => item.id === itemId ? updated : item));
    } catch {
      // Rollback
      setItems(prev => prev.map(item =>
        item.id === itemId ? { ...item, is_completed: !completed } : item
      ));
      toast.error('Erreur lors de la mise à jour de la checklist');
    }
  }, [taskId]);

  return { items, isLoading, toggleItem };
}
