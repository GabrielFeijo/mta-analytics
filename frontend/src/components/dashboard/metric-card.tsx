import { ReactNode } from 'react';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/cn';

interface MetricCardProps {
  label: string;
  value: ReactNode;
  icon: LucideIcon;
  iconClassName?: string;
  valueClassName?: string;
  footerLeft?: ReactNode;
  footerRight?: ReactNode;
}

export function MetricCard({
  label,
  value,
  icon: Icon,
  iconClassName = 'text-ink-dim',
  valueClassName = 'text-ink',
  footerLeft,
  footerRight,
}: MetricCardProps) {
  return (
    <div className="rounded-md border border-line bg-bg1 px-4 py-3">
      <div className="flex items-center justify-between text-2xs text-ink-faint">
        <span>{label}</span>
        <Icon className={cn('h-3.5 w-3.5', iconClassName)} strokeWidth={1.75} />
      </div>
      <div className={cn('mt-1 font-mono text-2xl font-medium tabular-nums', valueClassName)}>
        {value}
      </div>
      {(footerLeft || footerRight) && (
        <div className="mt-0.5 flex items-center justify-between gap-2 text-2xs text-ink-dim">
          <span>{footerLeft}</span>
          {footerRight && <span>{footerRight}</span>}
        </div>
      )}
    </div>
  );
}
