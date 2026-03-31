'use client';

import type { AtelierKpis } from '../../hooks/useAtelierInterventions';

interface Props {
  kpis: AtelierKpis;
}

interface KpiCardProps {
  label: string;
  value: number;
  sub: string;
}

function KpiCard({ label, value, sub }: KpiCardProps) {
  return (
    <article className="bg-white border border-[hsl(var(--rpma-border))] rounded-2xl p-5 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">{label}</p>
      <strong className="text-4xl font-bold tracking-tight text-foreground">{value}</strong>
      <p className="mt-1 text-sm text-muted-foreground">{sub}</p>
    </article>
  );
}

export function AtelierKpiBand({ kpis }: Props) {
  return (
    <section className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-5">
      <KpiCard label="En cours" value={kpis.inProgress} sub="Interventions actives" />
      <KpiCard label="Pausées" value={kpis.paused} sub="En attente de reprise" />
      <KpiCard label="Terminées aujourd'hui" value={kpis.completedToday} sub="Depuis minuit" />
      <KpiCard label="Total" value={kpis.total} sub="Interventions chargées" />
    </section>
  );
}
