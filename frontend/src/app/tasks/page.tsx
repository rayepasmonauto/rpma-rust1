'use client';

import { ErrorBoundary } from '@/components/ui/error-boundary';
import { PageShell } from '@/shared/ui/layout/PageShell';
import { TasksPageContent } from '@/domains/tasks';

export default function TasksPage() {
  return (
    <ErrorBoundary>
      <PageShell>
        <TasksPageContent />
      </PageShell>
    </ErrorBoundary>
  );
}
