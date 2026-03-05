import { LucideIcon } from 'lucide-react';
import { ReactNode } from 'react';

interface MetricStatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  color: string;
  bgColor: string;
  subtitle?: string;
  valueClassName?: string;
  children?: ReactNode;
}

export function MetricStatCard({
  label,
  value,
  icon: Icon,
  color,
  bgColor,
  subtitle,
  valueClassName = 'text-lg font-bold',
  children,
}: MetricStatCardProps) {
  return (
    <div className="flex items-center space-x-3 p-3 rounded-lg border">
      <div className={`p-2 rounded-full ${bgColor}`}>
        <Icon className={`h-4 w-4 ${color}`} />
      </div>
      <div className="flex-1">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        <p className={valueClassName}>{value}</p>
        {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
        {children}
      </div>
    </div>
  );
}
