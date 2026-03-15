import React from 'react';
import { History } from 'lucide-react';
import { useTaskHistory } from '../hooks/useTaskHistory';
import { TaskHistory } from './TaskHistory';

interface TaskTimelineProps {
  taskId: string;
}

export function TaskTimeline({ taskId }: TaskTimelineProps) {
  const { data: historyEntries, isLoading, error } = useTaskHistory(taskId);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <History className="w-4 h-4 text-accent" />
          <h2 className="text-base md:text-lg font-semibold text-foreground">Historique de l&apos;intervention</h2>
        </div>
        <span className="text-xs text-border-light uppercase tracking-wide">Historique</span>
      </div>
      <div className="h-px bg-border/40" />
      <TaskHistory
        taskId={taskId}
        historyEntries={historyEntries}
        isLoading={isLoading}
        error={error as Error | null}
      />
    </div>
  );
}
