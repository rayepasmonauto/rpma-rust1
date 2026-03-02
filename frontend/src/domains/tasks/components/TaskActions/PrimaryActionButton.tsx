import React from 'react';
import { CheckCircle, Play, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface PrimaryActionButtonProps {
  isCompleted: boolean;
  isInProgress: boolean;
  canStartTask: boolean;
  isPending: boolean;
  onViewCompleted: () => void;
  onViewWorkflow: () => void;
  onStartWorkflow: () => void;
  compact?: boolean;
}

export function PrimaryActionButton({
  isCompleted,
  isInProgress,
  canStartTask,
  isPending,
  onViewCompleted,
  onViewWorkflow,
  onStartWorkflow,
  compact = false,
}: PrimaryActionButtonProps) {
  if (isCompleted) {
    return (
      <Button onClick={onViewCompleted} className={cn('w-full bg-emerald-600 hover:bg-emerald-700', compact && 'h-10 text-sm')}>
        <CheckCircle className="h-5 w-5 mr-2" />
        Voir le rapport final
      </Button>
    );
  }

  if (isInProgress) {
    return (
      <Button
        onClick={onViewWorkflow}
        className={cn('w-full bg-[hsl(var(--rpma-teal))] hover:bg-[hsl(var(--rpma-teal))]/90', compact && 'h-10 text-sm')}
      >
        <ArrowRight className="h-5 w-5 mr-2" />
        Continuer l&apos;intervention
      </Button>
    );
  }

  return (
    <Button
      onClick={onStartWorkflow}
      disabled={!canStartTask || isPending}
      className={cn(
        'w-full transition-colors duration-200',
        compact && 'h-10 text-sm',
        canStartTask && !isPending
          ? 'bg-[hsl(var(--rpma-teal))] hover:bg-[hsl(var(--rpma-teal))]/90'
          : 'bg-gray-300/70 text-gray-600 cursor-not-allowed',
      )}
    >
      <Play className="h-5 w-5 mr-2" />
      {isPending ? "Démarrage..." : "Démarrer l'intervention"}
    </Button>
  );
}
