import React from 'react';
import { cn } from '@/lib/utils';

interface InlineActionButtonProps {
  action: {
    id: string;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    disabled?: boolean;
    onClick: () => void;
  };
  onActionClick: (action: () => void) => void;
}

export function InlineActionButton({ action, onActionClick }: InlineActionButtonProps) {
  return (
    <button
      type="button"
      onClick={() => onActionClick(action.onClick)}
      disabled={action.disabled}
      className={cn(
        'w-full flex items-center p-2.5 rounded-lg border text-xs transition-colors duration-200',
        action.disabled
          ? 'border-border/50 bg-background/30 cursor-not-allowed opacity-50'
          : 'border-border/50 bg-background/70 hover:border-accent/60 hover:bg-border/30',
      )}
    >
      <action.icon className={cn('h-3.5 w-3.5 mr-2', action.disabled ? 'text-border' : 'text-accent')} />
      <span className={cn(action.disabled ? 'text-border' : 'text-foreground')}>{action.label}</span>
    </button>
  );
}
