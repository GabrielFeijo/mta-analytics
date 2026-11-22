export const TIME_WINDOW_OPTIONS = [
  { hours: 6, label: '6H' },
  { hours: 24, label: '24H' },
  { hours: 168, label: '7D' },
] as const;

interface TimeWindowSelectorProps {
  value: number;
  onChange: (hours: number) => void;
}

export function TimeWindowSelector({ value, onChange }: TimeWindowSelectorProps) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {TIME_WINDOW_OPTIONS.map((option) => (
        <button
          key={option.hours}
          type="button"
          onClick={() => onChange(option.hours)}
          className={`h-7 rounded-sm border px-2 font-mono text-2xs transition-colors ${
            value === option.hours
              ? 'border-line-strong bg-bg3 text-brass'
              : 'border-line bg-bg2 text-ink-dim hover:text-ink'
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
