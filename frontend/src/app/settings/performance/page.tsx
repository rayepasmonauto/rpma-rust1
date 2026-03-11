'use client';

import { Suspense } from 'react';
import dynamic from 'next/dynamic';
import { LoadingState } from '@/shared/ui/layout/LoadingState';
import { useAuth } from '@/domains/auth';

const PerformanceTab = dynamic(
  () => import('@/domains/settings').then(mod => ({ default: mod.PerformanceTab })),
  { loading: () => <LoadingState message="Chargement des performances..." /> }
);

export default function PerformancePage() {
  const { user, profile } = useAuth();
  
  return (
    <Suspense fallback={<LoadingState message="Chargement des performances..." />}>
      <PerformanceTab user={user ?? undefined} profile={profile ?? undefined} />
    </Suspense>
  );
}
