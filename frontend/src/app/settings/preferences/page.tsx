'use client';

import { Suspense } from 'react';
import dynamic from 'next/dynamic';
import { LoadingState } from '@/shared/ui/layout/LoadingState';
import { useAuth } from '@/domains/auth';

const PreferencesTab = dynamic(
  () => import('@/domains/settings').then(mod => ({ default: mod.PreferencesTab })),
  { loading: () => <LoadingState message="Chargement des preferences..." /> }
);

export default function PreferencesPage() {
  const { user, profile } = useAuth();
  
  return (
    <Suspense fallback={<LoadingState message="Chargement des preferences..." />}>
      <PreferencesTab user={user ?? undefined} profile={profile ?? undefined} />
    </Suspense>
  );
}
