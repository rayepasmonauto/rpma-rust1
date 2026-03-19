'use client';

import React, { useState, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { Textarea } from '@/components/ui/textarea';
import { InlineEditable } from './InlineEditable';

export interface InlineEditableTextareaProps {
  value: string | null | undefined;
  onSave: (value: string) => Promise<void | boolean> | void;
  fieldName: string;
  isDisabled?: boolean;
  disabledReason?: string;
  className?: string;
  placeholder?: string;
  rows?: number;
  displayFormatter?: (value: string | null | undefined) => React.ReactNode;
}

export function InlineEditableTextarea({
  value,
  onSave,
  fieldName: _fieldName,
  isDisabled = false,
  disabledReason,
  className,
  placeholder = 'Non défini',
  rows = 3,
  displayFormatter,
}: InlineEditableTextareaProps) {
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
      await onSave(editValue);
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
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleCancel();
    }
  }, [handleSave, handleCancel]);

  const displayValue = displayFormatter 
    ? displayFormatter(value) 
    : (value ? (
        <span className={cn('line-clamp-2', className)}>{value}</span>
      ) : (
        <span className="text-muted-foreground italic">{placeholder}</span>
      ));

  return (
    <InlineEditable
      value={displayValue}
      onEdit={handleEdit}
      isEditing={isEditing}
      isDisabled={isDisabled}
      disabledReason={disabledReason}
      onSave={handleSave}
      onCancel={handleCancel}
      isLoading={isLoading}
    >
      <Textarea
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onKeyDown={handleKeyDown}
        className={cn('min-h-[80px] text-sm', className)}
        rows={rows}
        autoFocus
        disabled={isLoading}
      />
    </InlineEditable>
  );
}
