'use client';

import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import type { Intervention, InterventionStatus } from '@/lib/backend';

interface Props {
  intervention: Intervention;
  canAct: boolean;
}

const STATUS_LABEL: Record<InterventionStatus, string> = {
  pending: 'En attente',
  in_progress: 'En cours',
  paused: 'Pausée',
  completed: 'Terminée',
  cancelled: 'Annulée',
  archived: 'Archivée',
};

const STATUS_CLASS: Record<InterventionStatus, string> = {
  pending: 'bg-blue-50 text-blue-700 border-blue-200',
  in_progress: 'bg-[hsl(var(--rpma-teal))]/10 text-[hsl(var(--rpma-teal))] border-[hsl(var(--rpma-teal))]/30',
  paused: 'bg-orange-50 text-orange-700 border-orange-200',
  completed: 'bg-green-50 text-green-700 border-green-200',
  cancelled: 'bg-red-50 text-red-700 border-red-200',
  archived: 'bg-muted text-muted-foreground border-muted',
};

const PPF_STEPS = [
  { key: 'inspection', label: 'Inspection' },
  { key: 'preparation', label: 'Préparation' },
  { key: 'installation', label: 'Installation' },
  { key: 'finalisation', label: 'Finalisation' },
] as const;

type StepState = 'completed' | 'active' | 'pending';

function deriveStepStates(pct: number, status: InterventionStatus): StepState[] {
  if (status === 'completed') return ['completed', 'completed', 'completed', 'completed'];
  if (status === 'cancelled' || status === 'archived') return ['pending', 'pending', 'pending', 'pending'];
  if (status === 'pending') return ['pending', 'pending', 'pending', 'pending'];

  // in_progress or paused: each of 4 steps covers 25 pp
  const completedCount = Math.min(4, Math.floor(pct / 25));
  return PPF_STEPS.map((_, i) => {
    if (i < completedCount) return 'completed';
    if (i === completedCount) return 'active';
    return 'pending';
  }) as StepState[];
}

function WorkflowStepper({ pct, status }: { pct: number; status: InterventionStatus }) {
  const states = deriveStepStates(pct, status);

  return (
    <div className="mt-3">
      <div className="flex items-start gap-1">
        {PPF_STEPS.map((step, i) => {
          const state = states[i]!;
          const isLast = i === PPF_STEPS.length - 1;

          return (
            <div key={step.key} className="flex-1 flex flex-col items-center gap-1 min-w-0">
              {/* connector row */}
              <div className="w-full flex items-center">
                <div
                  className={cn(
                    'flex-1 h-0.5',
                    i === 0 ? 'invisible' : state === 'completed' ? 'bg-[hsl(var(--rpma-teal))]' : 'bg-muted',
                  )}
                />
                {/* dot */}
                <div
                  className={cn(
                    'w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 text-[9px] font-bold transition-colors',
                    state === 'completed'
                      ? 'bg-[hsl(var(--rpma-teal))] text-white'
                      : state === 'active'
                      ? 'bg-[hsl(var(--rpma-teal))]/20 border-2 border-[hsl(var(--rpma-teal))] text-[hsl(var(--rpma-teal))]'
                      : 'bg-muted border-2 border-muted-foreground/20 text-muted-foreground',
                  )}
                >
                  {state === 'completed' ? '✓' : i + 1}
                </div>
                <div
                  className={cn(
                    'flex-1 h-0.5',
                    isLast ? 'invisible' : state === 'completed' ? 'bg-[hsl(var(--rpma-teal))]' : 'bg-muted',
                  )}
                />
              </div>
              {/* label */}
              <span
                className={cn(
                  'text-[9px] leading-tight text-center truncate w-full px-0.5',
                  state === 'completed'
                    ? 'text-[hsl(var(--rpma-teal))] font-semibold'
                    : state === 'active'
                    ? 'text-[hsl(var(--rpma-teal))] font-bold'
                    : 'text-muted-foreground',
                )}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function AtelierInterventionCard({ intervention, canAct }: Props) {
  const router = useRouter();

  const vehicleLabel = [intervention.vehicle_make, intervention.vehicle_model]
    .filter(Boolean)
    .join(' ') || 'Véhicule inconnu';

  const pct = typeof intervention.completion_percentage === 'number'
    ? intervention.completion_percentage
    : 0;

  return (
    <article className="bg-white border border-[hsl(var(--rpma-border))] rounded-2xl overflow-hidden shadow-sm">
      <div className="p-4">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="min-w-0">
            <h3 className="font-bold text-base tracking-tight truncate">{vehicleLabel}</h3>
            <p className="text-xs text-muted-foreground truncate">
              {intervention.vehicle_plate}
              {intervention.task_number ? ` · ${intervention.task_number}` : ''}
            </p>
          </div>
          <span
            className={cn(
              'text-xs font-bold px-2 py-1 rounded-full border whitespace-nowrap',
              STATUS_CLASS[intervention.status] ?? 'bg-muted text-muted-foreground border-muted',
            )}
          >
            {STATUS_LABEL[intervention.status] ?? intervention.status}
          </span>
        </div>

        <dl className="grid grid-cols-2 gap-x-3 gap-y-1 text-sm mb-3">
          {intervention.client_name && (
            <>
              <dt className="text-xs text-muted-foreground">Client</dt>
              <dd className="font-medium truncate">{intervention.client_name}</dd>
            </>
          )}
          {intervention.technician_name && (
            <>
              <dt className="text-xs text-muted-foreground">Technicien</dt>
              <dd className="font-medium truncate">{intervention.technician_name}</dd>
            </>
          )}
        </dl>

        <div className="bg-muted/30 rounded-xl px-3 pt-2 pb-3">
          <div className="flex justify-between text-xs text-muted-foreground mb-0">
            <span className="font-medium">Étapes PPF</span>
            <span>{Math.round(pct)} %</span>
          </div>
          <WorkflowStepper pct={pct} status={intervention.status} />
        </div>
      </div>

      {canAct && (
        <div className="px-4 pb-4">
          <button
            onClick={() => router.push(`/tasks/${intervention.task_id}/workflow/ppf`)}
            className="w-full text-sm font-semibold py-2 rounded-xl bg-[hsl(var(--rpma-teal))] text-white hover:bg-[hsl(var(--rpma-teal))]/90 transition-colors"
          >
            Ouvrir le workflow
          </button>
        </div>
      )}
    </article>
  );
}
