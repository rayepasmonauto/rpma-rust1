'use client';

import dynamic from 'next/dynamic';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { PageShell } from '@/shared/ui/layout/PageShell';

const CalendarDashboard = dynamic(
  () => import('@/domains/calendar').then((module) => module.CalendarDashboard)
);

export default function Home() {
  return (
    <ErrorBoundary>
      <PageShell>
        <CalendarDashboard />
      </PageShell>
    </ErrorBoundary>
  );
}
