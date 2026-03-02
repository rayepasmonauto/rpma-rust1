import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TaskPriority } from '@/lib/backend';

interface PrioritySelectorProps {
  value: TaskPriority;
  onChange: (value: TaskPriority) => void;
  isPending: boolean;
}

export function PrioritySelector({ value, onChange, isPending }: PrioritySelectorProps) {
  return (
    <div className="pt-4 border-t border-border">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-foreground">Priorité</span>
        <Select
          value={value}
          onValueChange={(value: string) => {
            const priorityValue = ['low', 'medium', 'high', 'urgent'].find((p) => p === value) as TaskPriority;
            if (priorityValue) onChange(priorityValue);
          }}
          disabled={isPending}
        >
          <SelectTrigger className="w-32 border-border bg-muted text-foreground hover:bg-border">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-muted border-border">
            <SelectItem value="low" className="text-foreground hover:bg-border focus:bg-border">
              Basse
            </SelectItem>
            <SelectItem value="medium" className="text-foreground hover:bg-border focus:bg-border">
              Moyenne
            </SelectItem>
            <SelectItem value="high" className="text-foreground hover:bg-border focus:bg-border">
              Haute
            </SelectItem>
            <SelectItem value="urgent" className="text-foreground hover:bg-border focus:bg-border">
              Urgente
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
