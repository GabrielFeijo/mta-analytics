interface TelemetryMeterProps {
  label: string;
  value: number;
  tone?: 'ok' | 'warn' | 'signal';
}

export function TelemetryMeter({ label, value, tone }: TelemetryMeterProps) {
  const pct = Math.max(0, Math.min(100, Math.round(value)));
  const resolvedTone = tone || (pct <= 25 ? 'signal' : pct <= 55 ? 'warn' : 'ok');
  const barColor =
    resolvedTone === 'signal'
      ? 'bg-signal'
      : resolvedTone === 'warn'
        ? 'bg-warn'
        : 'bg-ok';

  return (
    <div className="flex items-center gap-3">
      <span className="w-16 shrink-0 text-2xs text-ink-dim">{label}</span>
      <div className="h-[3px] flex-1 overflow-hidden rounded-full bg-line">
        <div className={`h-full ${barColor}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="w-9 shrink-0 text-right font-mono text-2xs tabular-nums text-ink">
        {pct}%
      </span>
    </div>
  );
}
