'use client';

import { cn } from '@/lib/utils';
import type { AtelierStatusFilter } from '../../hooks/useAtelierInterventions';

const STATUS_CHIPS: { label: string; value: AtelierStatusFilter }[] = [
  { label: 'Toutes', value: 'all' },
  { label: 'En attente', value: 'pending' },
  { label: 'En cours', value: 'in_progress' },
  { label: 'Pausées', value: 'paused' },
  { label: 'Terminées', value: 'completed' },
  { label: 'Annulées', value: 'cancelled' },
];

interface Props {
  status: AtelierStatusFilter;
  search: string;
  onStatusChange: (value: AtelierStatusFilter) => void;
  onSearchChange: (value: string) => void;
}

export function AtelierFilters({ status, search, onStatusChange, onSearchChange }: Props) {
  return (
    <section className="mt-5 bg-white border border-[hsl(var(--rpma-border))] rounded-2xl p-4 shadow-sm flex flex-wrap items-center justify-between gap-4">
      <div className="flex flex-wrap gap-2">
        {STATUS_CHIPS.map((chip) => (
          <button
            key={chip.value}
            onClick={() => onStatusChange(chip.value)}
            className={cn(
              'px-3 py-2 rounded-full text-sm font-semibold border transition-colors',
              status === chip.value
                ? 'bg-[hsl(var(--rpma-teal))]/10 text-[hsl(var(--rpma-teal))] border-[hsl(var(--rpma-teal))]/30'
                : 'bg-muted/40 text-muted-foreground border-transparent hover:bg-muted/60',
            )}
          >
            {chip.label}
          </button>
        ))}
      </div>
      <input
        type="text"
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        placeholder="Rechercher par plaque, client ou modèle…"
        className="min-w-[240px] flex-1 max-w-sm border border-[hsl(var(--rpma-border))] rounded-xl px-4 py-2.5 text-sm bg-muted/30 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[hsl(var(--rpma-teal))]/40"
      />
    </section>
  );
}
