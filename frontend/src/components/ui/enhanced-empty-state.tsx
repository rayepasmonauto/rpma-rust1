"use client";

import React from 'react';
import { EmptyState, type EmptyStateProps } from './empty-state';

export const EnhancedEmptyState = React.memo(function EnhancedEmptyState(props: EmptyStateProps) {
  return <EmptyState {...props} />;
});
