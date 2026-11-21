interface LogoProps {
  className?: string;
  iconSize?: number;
  textSize?: string;
  showText?: boolean;
}

export default function Logo({
  className = '',
  iconSize = 34,
  textSize = 'text-xl',
  showText = true,
}: LogoProps) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <svg
        width={iconSize}
        height={iconSize}
        viewBox="0 0 36 36"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0"
      >
        <rect x="1" y="1" width="34" height="34" rx="3" fill="#16171A" stroke="#3D4046" strokeWidth="1.5" />
        <rect x="4" y="4" width="28" height="28" rx="1.5" fill="#0F1012" stroke="#2C2E33" strokeWidth="1" />
        <path d="M8 25V17" stroke="#A29F94" strokeWidth="2.2" strokeLinecap="square" />
        <path d="M14.5 25V12" stroke="#C8A455" strokeWidth="2.2" strokeLinecap="square" />
        <path d="M21 25V15" stroke="#ECE8DC" strokeWidth="2.2" strokeLinecap="square" />
        <path d="M27.5 25V9" stroke="#D9482F" strokeWidth="2.2" strokeLinecap="square" />
        <circle cx="27.5" cy="9" r="2" fill="#D9482F" />
      </svg>

      {showText && (
        <div className="flex min-w-0 flex-col">
          <div className="flex items-baseline gap-1.5 leading-none">
            <span className={`font-display ${textSize} font-bold uppercase tracking-wider text-ink`}>
              MTA
            </span>
            <span className={`font-display ${textSize} font-semibold uppercase tracking-wider text-brass`}>
              Analytics
            </span>
          </div>
          <span className="mt-1 font-mono text-[10px] uppercase tracking-[0.18em] text-ink-faint">
            Telemetria • Garage Night
          </span>
        </div>
      )}
    </div>
  );
}
