'use client';

import { Suspense, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { LoadingState } from '@/shared/ui/layout/LoadingState';
import { useAuth } from '@/domains/auth';

const OrganizationSettingsTab = dynamic(
  () => import('@/domains/settings').then(mod => ({ default: mod.OrganizationSettingsTab })),
  { loading: () => <LoadingState message="Chargement des paramètres de l'organisation..." /> }
);

export default function OrganizationSettingsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user?.role !== 'admin') {
      router.replace('/settings/profile');
    }
  }, [user, loading, router]);

  if (loading || user?.role !== 'admin') return null;

  return (
    <Suspense fallback={<LoadingState message="Chargement des paramètres de l'organisation..." />}>
      <OrganizationSettingsTab />
    </Suspense>
  );
}
