'use client';

import { createContext } from 'react';

// Stub context — value is always null until bootstrap state is implemented.
// Using `null` explicitly (not `any`) so consumers get a typed `null` return.
export const bootstrapContext = createContext<null>(null);

export function bootstrapProvider({ children }: { children: React.ReactNode }) {
  return <bootstrapContext.Provider value={null}>{children}</bootstrapContext.Provider>;
}
