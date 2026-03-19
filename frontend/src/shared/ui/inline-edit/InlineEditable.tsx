'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Pencil, X, Check, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export interface InlineEditableProps {
  value: React.ReactNode;
  onEdit: () => void;
  isEditing: boolean;
  isDisabled?: boolean;
  disabledReason?: string;
  className?: string;
  displayClassName?: string;
  children: React.ReactNode;
  onSave?: () => void;
  onCancel?: () => void;
  isLoading?: boolean;
}

export function InlineEditable({
  value,
  onEdit,
  isEditing,
  isDisabled = false,
  disabledReason,
  className,
  displayClassName,
  children,
  onSave,
  onCancel,
  isLoading = false,
}: InlineEditableProps) {
  const [isHovered, setIsHovered] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleClick = useCallback(() => {
    if (!isDisabled && !isEditing) {
      onEdit();
    }
  }, [isDisabled, isEditing, onEdit]);

  const handleCancel = useCallback(() => {
    onCancel?.();
  }, [onCancel]);

  useEffect(() => {
    if (isEditing) {
      const handleClickOutside = (event: MouseEvent) => {
        if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
          handleCancel();
        }
      };
      
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
    return undefined;
  }, [isEditing, handleCancel]);

  if (isEditing) {
    return (
      <div ref={containerRef} className={cn('flex items-center gap-2', className)}>
        {children}
        <div className="flex items-center gap-1 shrink-0">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={onSave}
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Check className="h-3 w-3 text-green-600" />
            )}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={handleCancel}
            disabled={isLoading}
          >
            <X className="h-3 w-3 text-red-500" />
          </Button>
        </div>
      </div>
    );
  }

  const editTrigger = (
    <div
      className={cn(
        'group flex items-center gap-1.5 cursor-pointer rounded px-1 -mx-1 transition-colors',
        isDisabled ? 'cursor-not-allowed opacity-60' : 'hover:bg-accent/10',
        displayClassName
      )}
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <span className="text-foreground font-medium text-right">{value}</span>
      {!isDisabled && isHovered && (
        <Pencil className="h-3 w-3 text-muted-foreground shrink-0" />
      )}
    </div>
  );

  if (isDisabled && disabledReason) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            {editTrigger}
          </TooltipTrigger>
          <TooltipContent>
            <p>{disabledReason}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return editTrigger;
}