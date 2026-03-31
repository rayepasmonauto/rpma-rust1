import React from 'react';
import { CheckCircle, Camera, ListChecks, Car, User, Clock } from 'lucide-react';
import { formatDate } from '@/shared/utils/date-formatters';
import { useTranslation } from '@/shared/hooks';

type CompletedHeroProps = {
  task: {
    title?: string;
    external_id?: string | null;
    vehicle_make?: string | null;
    vehicle_model?: string | null;
    vehicle_year?: string | null;
    customer_name?: string | null;
    start_time?: string | null;
    end_time?: string | null;
  };
  duration: string | null;
  photoCount: number;
  checklistCount: number;
  checklistTotal: number;
  progressPercentage: number;
};

export function CompletedHero({
  task,
  duration,
  photoCount,
  checklistCount,
  checklistTotal,
  progressPercentage,
}: CompletedHeroProps) {
  const { t } = useTranslation();
  const vehicleInfo = [task.vehicle_make, task.vehicle_model, task.vehicle_year]
    .filter(Boolean)
    .join(' ');
  const displayTitle = task.title || `#${task.external_id?.slice(-8) || ''}`;

  return (
    <div className="animate-fadeIn rounded-xl border border-rpma-primary/20 bg-gradient-to-br from-rpma-primary/10 via-rpma-primary/5 to-success/5 px-6 py-6 shadow-md">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex-1">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-rpma-primary/15 px-3 py-1 text-xs font-semibold text-rpma-primary">
              {t('completed.badge')}
            </span>
            <span className="rounded-full bg-success/15 px-3 py-1 text-xs font-semibold text-success">
              <CheckCircle className="mr-1 inline h-3 w-3" />
              {t('completed.progressBadge')}
            </span>
          </div>

          <div className="mb-2 flex items-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-rpma-primary/15 text-rpma-primary shadow-sm">
              <CheckCircle className="h-7 w-7" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-foreground">
                {t('completed.title')}
              </h1>
              <p className="text-sm text-muted-foreground">
                {t('completed.subtitle', { title: displayTitle })}
              </p>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Car className="h-4 w-4" />
              {vehicleInfo || t('completed.vehicleNotSpecified')}
            </span>
            <span className="text-muted-foreground/40">·</span>
            <span className="flex items-center gap-1.5">
              <User className="h-4 w-4" />
              {task.customer_name || t('completed.clientNotSpecified')}
            </span>
            <span className="text-muted-foreground/40">·</span>
            <span className="flex items-center gap-1.5">
              <Clock className="h-4 w-4" />
              {formatDate(task.end_time)}
            </span>
          </div>
        </div>

        <div className="flex flex-shrink-0 gap-3">
          <StatMini icon={<Clock className="h-4 w-4 text-muted-foreground" />} label={t('completed.duration')} value={duration || '—'} />
          <StatMini icon={<Camera className="h-4 w-4 text-muted-foreground" />} label={t('completed.photos')} value={String(photoCount)} />
          <StatMini icon={<ListChecks className="h-4 w-4 text-muted-foreground" />} label={t('completed.checklist')} value={`${checklistCount}/${checklistTotal}`} />
        </div>
      </div>

      <div className="mt-5">
        <div className="mb-1.5 flex justify-between text-xs font-medium text-muted-foreground">
          <span>{t('completed.workflowProgress')}</span>
          <span>{progressPercentage}%</span>
        </div>
        <div className="h-2 rounded-full bg-muted">
          <div
            className="h-2 rounded-full bg-rpma-primary transition-all duration-500 ease-out"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </div>
    </div>
  );
}

function StatMini({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-card px-4 py-3 shadow-sm">
      <div className="flex items-center gap-2">
        {icon}
        <div>
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
            {label}
          </div>
          <div className="text-lg font-bold text-foreground">{value}</div>
        </div>
      </div>
    </div>
  );
}
