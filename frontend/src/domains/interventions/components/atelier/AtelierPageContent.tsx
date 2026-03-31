'use client';

import { useState } from 'react';
import { useAuth } from '@/domains/auth';
import { useAtelierInterventions, type AtelierStatusFilter } from '../../hooks/useAtelierInterventions';
import { AtelierKpiBand } from './AtelierKpiBand';
import { AtelierFilters } from './AtelierFilters';
import { AtelierInterventionList } from './AtelierInterventionList';

export function AtelierPageContent() {
  const { profile } = useAuth();
  const [statusFilter, setStatusFilter] = useState<AtelierStatusFilter>('all');
  const [search, setSearch] = useState('');

  const role = profile?.role ?? 'viewer';
  const isViewer = role === 'viewer';

  // Depth-of-defense frontend scoping: technicians only see their own interventions.
  // The backend already enforces this; this is a secondary guard.
  const technicianId = role === 'technician' ? (profile?.id ?? undefined) : undefined;

  const { interventions, kpis, isLoading, error } = useAtelierInterventions({
    statusFilter,
    technicianId,
  });

  return (
    <div className="space-y-5">
      <section className="bg-white border border-[hsl(var(--rpma-border))] rounded-2xl p-6 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Interventions</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Suivi en temps réel de l&apos;atelier PPF — progression, statuts et priorités.
          </p>
        </div>
      </section>

      <AtelierKpiBand kpis={kpis} />

      <AtelierFilters
        status={statusFilter}
        search={search}
        onStatusChange={setStatusFilter}
        onSearchChange={setSearch}
      />

      <section className="mt-2">
        {isLoading && (
          <p className="text-sm text-muted-foreground text-center py-12">Chargement des interventions…</p>
        )}
        {!isLoading && error && (
          <p className="text-sm text-red-600 text-center py-12">
            Erreur lors du chargement des interventions.
          </p>
        )}
        {!isLoading && !error && (
          <AtelierInterventionList
            interventions={interventions}
            search={search}
            canAct={!isViewer}
          />
        )}
      </section>
    </div>
  );
}
