'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { LoadingState } from '@/shared/ui/layout/LoadingState';
import { PageShell } from '@/shared/ui/layout/PageShell';

const CalendarDashboard = dynamic(
  () => import('@/domains/calendar').then((mod) => mod.CalendarDashboard),
  { ssr: false, loading: () => <LoadingState /> }
);

export default function DashboardPage() {
  return (
    <ErrorBoundary>
      <PageShell>
        <CalendarDashboard />
      </PageShell>
    </ErrorBoundary>
  );
}
