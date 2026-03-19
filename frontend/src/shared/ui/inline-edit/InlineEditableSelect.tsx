'use client';

import React, { useState, useCallback } from 'react';
import { cn } from '@/lib/utils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { InlineEditable } from './InlineEditable';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface InlineEditableSelectProps {
  value: string | null | undefined;
  options: SelectOption[];
  onSave: (value: string) => Promise<void | boolean> | void;
  fieldName: string;
  isDisabled?: boolean;
  disabledReason?: string;
  className?: string;
  placeholder?: string;
  displayFormatter?: (value: string | null | undefined) => React.ReactNode;
}

export function InlineEditableSelect({
  value,
  options,
  onSave,
  fieldName: _fieldName,
  isDisabled = false,
  disabledReason,
  className,
  placeholder = 'Sélectionner',
  displayFormatter,
}: InlineEditableSelectProps) {
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

  const handleSelectChange = useCallback(async (newValue: string) => {
    setEditValue(newValue);
    setIsLoading(true);
    try {
      await onSave(newValue);
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to save:', error);
    } finally {
      setIsLoading(false);
    }
  }, [onSave]);

  const selectedOption = options.find(opt => opt.value === value);
  const displayValue = displayFormatter 
    ? displayFormatter(value)
    : (selectedOption?.label || <span className="text-muted-foreground italic">{placeholder}</span>);

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
      <Select value={editValue} onValueChange={handleSelectChange} disabled={isLoading}>
        <SelectTrigger className={cn('h-8 w-auto min-w-[120px] text-sm', className)}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem 
              key={option.value} 
              value={option.value}
              disabled={option.disabled}
            >
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </InlineEditable>
  );
}
