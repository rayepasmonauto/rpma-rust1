'use client';

import React, { createContext, useContext, ReactNode } from 'react';

/**
 * Reports Domain - Context Value
 */
export interface ReportsContextValue {
  initialized: boolean;
}

const ReportsContext = createContext<ReportsContextValue | undefined>(undefined);

/**
 * Reports Domain - Provider
 */
export function ReportsProvider({ children }: { children: ReactNode }) {
  // Simple provider that could hold reports-related configuration or cache
  return (
    <ReportsContext.Provider value={{ initialized: true }}>
      {children}
    </ReportsContext.Provider>
  );
}

/**
 * Reports Domain - Hook to access reports context
 */
export function useReportsContext() {
  const context = useContext(ReportsContext);
  if (context === undefined) {
    throw new Error('useReportsContext must be used within a ReportsProvider');
  }
  return context;
}
