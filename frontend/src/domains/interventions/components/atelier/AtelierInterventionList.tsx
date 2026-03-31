'use client';

import type { Intervention } from '@/lib/backend';
import { AtelierInterventionCard } from './AtelierInterventionCard';

interface Props {
  interventions: Intervention[];
  search: string;
  canAct: boolean;
}

function matchesSearch(i: Intervention, q: string): boolean {
  const lower = q.toLowerCase();
  return (
    i.vehicle_plate.toLowerCase().includes(lower) ||
    (i.vehicle_make?.toLowerCase().includes(lower) ?? false) ||
    (i.vehicle_model?.toLowerCase().includes(lower) ?? false) ||
    (i.client_name?.toLowerCase().includes(lower) ?? false) ||
    (i.technician_name?.toLowerCase().includes(lower) ?? false) ||
    (i.task_number?.toLowerCase().includes(lower) ?? false)
  );
}

export function AtelierInterventionList({ interventions, search, canAct }: Props) {
  const filtered = search.trim()
    ? interventions.filter((i) => matchesSearch(i, search))
    : interventions;

  if (filtered.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-12">
        {search.trim() ? 'Aucune intervention ne correspond à la recherche.' : 'Aucune intervention trouvée.'}
      </p>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
      {filtered.map((intervention) => (
        <AtelierInterventionCard
          key={intervention.id}
          intervention={intervention}
          canAct={canAct}
        />
      ))}
    </div>
  );
}
