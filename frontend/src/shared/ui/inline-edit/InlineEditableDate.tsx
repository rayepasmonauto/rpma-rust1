'use client';

import React, { useState, useCallback } from 'react';
import { Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { formatDate } from '@/shared/utils/date-formatters';
import { InlineEditable } from './InlineEditable';

export interface InlineEditableDateProps {
  value: string | null | undefined;
  onSave: (value: string) => Promise<void | boolean> | void;
  fieldName: string;
  isDisabled?: boolean;
  disabledReason?: string;
  className?: string;
  placeholder?: string;
}

export function InlineEditableDate({
  value,
  onSave,
  fieldName: _fieldName,
  isDisabled = false,
  disabledReason,
  className,
  placeholder = 'Non définie',
}: InlineEditableDateProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value ?? '');
  const [isLoading, setIsLoading] = useState(false);

  const handleEdit = useCallback(() => {
    setEditValue(value ?? '');
    setIsEditing(true);
  }, [value]);

  const handleSave = useCallback(async () => {
    if (editValue === (value ?? '')) {
      setIsEditing(false);
      return;
    }
    
    setIsLoading(true);
    try {
      await onSave(editValue || '');
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to save:', error);
    } finally {
      setIsLoading(false);
    }
  }, [editValue, value, onSave]);

  const handleCancel = useCallback(() => {
    setEditValue(value ?? '');
    setIsEditing(false);
  }, [value]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleCancel();
    }
  }, [handleSave, handleCancel]);

  const displayValue = value ? (
    <span className="flex items-center gap-1.5">
      <Calendar className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
      {formatDate(value)}
    </span>
  ) : (
    <span className="text-muted-foreground italic">{placeholder}</span>
  );

  return (
    <InlineEditable
      value={displayValue}
      onEdit={handleEdit}
      isEditing={isEditing}
      isDisabled={isDisabled}
      disabledReason={disabledReason}
      className={className}
      onSave={handleSave}
      onCancel={handleCancel}
      isLoading={isLoading}
    >
      <Input
        type="date"
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onKeyDown={handleKeyDown}
        className={cn('h-8 text-sm w-auto', className)}
        autoFocus
        disabled={isLoading}
      />
    </InlineEditable>
  );
}
