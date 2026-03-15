import { useContext } from 'react';
import type { AuthContextType } from '@/types/auth.types';
import { AuthContext } from '@/domains/auth/api/AuthProvider';

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
