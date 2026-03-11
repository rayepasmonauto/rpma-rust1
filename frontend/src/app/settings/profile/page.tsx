'use client';

import { Suspense } from 'react';
import dynamic from 'next/dynamic';
import { LoadingState } from '@/shared/ui/layout/LoadingState';
import { useAuth } from '@/domains/auth';

const ProfileSettingsTab = dynamic(
  () => import('@/domains/settings').then(mod => ({ default: mod.ProfileSettingsTab })),
  { loading: () => <LoadingState message="Chargement du profil..." /> }
);

export default function ProfilePage() {
  const { user, profile } = useAuth();
  
  return (
    <Suspense fallback={<LoadingState message="Chargement du profil..." />}>
      <ProfileSettingsTab user={user ?? undefined} profile={profile ?? undefined} />
    </Suspense>
  );
}
