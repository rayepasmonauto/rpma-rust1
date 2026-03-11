'use client';

import { Suspense } from 'react';
import dynamic from 'next/dynamic';
import { LoadingState } from '@/shared/ui/layout/LoadingState';
import { useAuth } from '@/domains/auth';

const AccessibilityTab = dynamic(
  () => import('@/domains/settings').then(mod => ({ default: mod.AccessibilityTab })),
  { loading: () => <LoadingState message="Chargement de l'accessibilite..." /> }
);

export default function AccessibilityPage() {
  const { user, profile } = useAuth();
  
  return (
    <Suspense fallback={<LoadingState message="Chargement de l'accessibilite..." />}>
      <AccessibilityTab user={user ?? undefined} profile={profile ?? undefined} />
    </Suspense>
  );
}
