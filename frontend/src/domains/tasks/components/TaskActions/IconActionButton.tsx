import React from 'react';
import { cn } from '@/lib/utils';

interface IconActionButtonProps {
  action: {
    id: string;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    count?: number;
    disabled?: boolean;
    onClick: () => void;
  };
  onActionClick: (action: () => void) => void;
  compact?: boolean;
}

export function IconActionButton({ action, onActionClick, compact = false }: IconActionButtonProps) {
  return (
    <button
      type="button"
      onClick={() => onActionClick(action.onClick)}
      disabled={action.disabled}
      className={cn(
        'flex flex-col items-center justify-center rounded-lg border transition-all duration-200',
        compact ? 'p-2 min-h-[56px]' : 'p-4',
        action.disabled
          ? 'border-border/50 bg-background/30 cursor-not-allowed opacity-50'
          : 'border-border/50 bg-background/60 hover:border-accent/60 hover:bg-border/30',
      )}
    >
      <div className="relative">
        <action.icon className={cn('h-5 w-5 mb-1', action.disabled ? 'text-border' : 'text-accent')} />
        {action.count && action.count > 0 && (
          <span className="absolute -top-2 -right-2 bg-accent text-background text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] h-4 flex items-center justify-center">
            {action.count}
          </span>
        )}
      </div>
      <span className={cn('text-xs font-medium text-center', action.disabled ? 'text-border' : 'text-border-light')}>
        {action.label}
      </span>
    </button>
  );
}
