"use client";

import React from 'react';
import { Filter, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './button';

type EmptyStateAction =
  | React.ReactNode
  | {
      label: string;
      onClick: () => void;
      icon?: React.ReactNode;
    };

type StructuredAction = {
  label: string;
  onClick: () => void;
  icon?: React.ReactNode;
};

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: EmptyStateAction;
  secondaryAction?: StructuredAction;
  tips?: Array<{
    title: string;
    description: string;
  }>;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'search' | 'filter' | 'error';
}

const isStructuredAction = (action?: EmptyStateAction): action is StructuredAction => {
  if (!action || typeof action !== 'object' || React.isValidElement(action)) {
    return false;
  }
  return 'label' in action && 'onClick' in action;
};

export const EmptyState = React.forwardRef<HTMLDivElement, EmptyStateProps>(
  (
    {
      icon,
      title,
      description,
      action,
      secondaryAction,
      tips,
      className,
      size = 'md',
      variant = 'default',
      ...props
    },
    ref
  ) => {
    const sizeClasses = {
      sm: 'py-6',
      md: 'py-12',
      lg: 'py-16',
    };

    const titleSizeClasses = {
      sm: 'text-lg',
      md: 'text-xl',
      lg: 'text-2xl',
    };

    const descriptionSizeClasses = {
      sm: 'text-sm',
      md: 'text-base',
      lg: 'text-lg',
    };

    const renderAction = () => {
      if (!action) return null;
      if (!isStructuredAction(action)) {
        return action;
      }
      return (
        <Button onClick={action.onClick}>
          {action.icon}
          {action.label}
        </Button>
      );
    };

    return (
      <div
        ref={ref}
        className={cn('flex flex-col items-center justify-center text-center', sizeClasses[size], className)}
        {...props}
      >
        {icon ? (
          <div className="mb-4 text-muted-foreground">{icon}</div>
        ) : (
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-[hsl(var(--rpma-border))] bg-[hsl(var(--rpma-surface))]" />
        )}
        <h3 className={cn('mb-2 font-semibold text-foreground', titleSizeClasses[size])}>{title}</h3>
        {description && (
          <p className={cn('mb-6 max-w-lg text-muted-foreground', descriptionSizeClasses[size])}>{description}</p>
        )}
        {(action || secondaryAction || variant === 'search' || variant === 'filter') && (
          <div className="mb-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            {renderAction()}
            {secondaryAction && (
              <Button variant="outline" onClick={secondaryAction.onClick}>
                {secondaryAction.icon}
                {secondaryAction.label}
              </Button>
            )}
            {variant === 'search' && (
              <Button variant="ghost" onClick={() => window.location.reload()}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Actualiser
              </Button>
            )}
            {variant === 'filter' && (
              <Button variant="ghost" onClick={() => window.location.reload()}>
                <Filter className="mr-2 h-4 w-4" />
                Effacer les filtres
              </Button>
            )}
          </div>
        )}
        {tips && tips.length > 0 && (
          <div className="mt-4 grid w-full max-w-4xl grid-cols-1 gap-4 border-t border-[hsl(var(--rpma-border))] pt-6 md:grid-cols-3">
            {tips.map((tip, index) => (
              <div key={`${tip.title}-${index}`} className="rounded-lg border border-[hsl(var(--rpma-border))] bg-white p-4">
                <div className="mb-2 font-semibold text-foreground">{tip.title}</div>
                <p className="text-xs text-muted-foreground">{tip.description}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }
);

EmptyState.displayName = 'EmptyState';

interface NoDataEmptyStateProps extends Omit<EmptyStateProps, 'icon' | 'title' | 'description'> {
  type?: 'tasks' | 'clients' | 'interventions' | 'search' | 'error';
}

export const NoDataEmptyState = React.forwardRef<HTMLDivElement, NoDataEmptyStateProps>(
  ({ type = 'tasks', action, className, ...props }, ref) => {
    const configs = {
      tasks: {
        icon: '??',
        title: 'Aucune tâche trouvée',
        description: "Il n'y a pas encore de tâches à afficher. Créez votre première tâche pour commencer.",
      },
      clients: {
        icon: '??',
        title: 'Aucun client trouvé',
        description: "Vous n'avez pas encore ajouté de clients. Ajoutez votre premier client pour commencer.",
      },
      interventions: {
        icon: '??',
        title: 'Aucune intervention trouvée',
        description: "Il n'y a pas d'interventions planifiées ou terminées à afficher.",
      },
      search: {
        icon: '??',
        title: 'Aucun résultat trouvé',
        description: "Essayez de modifier vos critères de recherche ou vérifiez l'orthographe.",
      },
      error: {
        icon: '??',
        title: 'Une erreur est survenue',
        description: 'Impossible de charger les données. Veuillez réessayer plus tard.',
      },
    };

    const config = configs[type];

    return (
      <EmptyState
        ref={ref}
        icon={<span className="text-4xl">{config.icon}</span>}
        title={config.title}
        description={config.description}
        action={action}
        className={className}
        variant={type === 'search' ? 'search' : type === 'error' ? 'error' : 'default'}
        {...props}
      />
    );
  }
);

NoDataEmptyState.displayName = 'NoDataEmptyState';

export { type EmptyStateProps, type NoDataEmptyStateProps };
