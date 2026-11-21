import * as React from 'react';
import { cn } from '@/lib/utils';

export type BadgeVariant =
  | 'default'
  | 'secondary'
  | 'destructive'
  | 'brass'
  | 'ok'
  | 'warn'
  | 'outline';

const VARIANT_CLASSES: Record<BadgeVariant, string> = {
  default: 'border-signal/60 bg-signal/15 text-signal',
  secondary: 'border-line bg-bg2 text-ink-dim',
  destructive: 'border-signal/60 bg-signal/15 text-signal',
  brass: 'border-brass/50 bg-brass/15 text-brass',
  ok: 'border-ok/50 bg-ok/15 text-ok',
  warn: 'border-warn/50 bg-warn/15 text-warn',
  outline: 'border-line-strong bg-bg2/50 text-ink',
};

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: BadgeVariant;
}

export function Badge({ className, variant = 'secondary', ...props }: BadgeProps) {
  return (
    <div
      className={cn(
        'inline-flex items-center gap-1 rounded-sm border px-1.5 py-0.5 text-2xs font-medium transition-colors',
        VARIANT_CLASSES[variant],
        className,
      )}
      {...props}
    />
  );
}
