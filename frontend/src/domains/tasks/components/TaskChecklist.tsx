'use client';

import React from 'react';
import { TaskStatus } from '@/lib/backend';
import { ChecklistItem } from '@/types/task.types';
import { ChecklistView } from './TaskInfo/ChecklistView';

export interface TaskChecklistProps {
  items?: ChecklistItem[];
  taskId?: string;
  status?: TaskStatus;
  onItemChange?: (itemId: string, completed: boolean) => void;
  readOnly?: boolean;
}

/**
 * Task checklist wrapper component
 */
export function TaskChecklist({ items = [], onItemChange, readOnly = false }: TaskChecklistProps) {
  return (
    <ChecklistView
      items={items}
      onItemChange={onItemChange}
      readOnly={readOnly}
    />
  );
}

export default TaskChecklist;