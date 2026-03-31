import { Suspense } from 'react';
import dynamic from 'next/dynamic';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { PageShell } from '@/shared/ui/layout/PageShell';
import { LoadingState } from '@/shared/ui/layout/LoadingState';

const AtelierPageContent = dynamic(
  () => import('@/domains/interventions').then((mod) => ({ default: mod.AtelierPageContent })),
  { loading: () => <LoadingState />, ssr: false },
);

export default function InterventionsPage() {
  return (
    <ErrorBoundary>
      <PageShell>
        <Suspense fallback={<LoadingState />}>
          <AtelierPageContent />
        </Suspense>
      </PageShell>
    </ErrorBoundary>
  );
}
