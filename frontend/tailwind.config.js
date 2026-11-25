const c = (name) => `rgb(var(--c-${name}) / <alpha-value>)`;

export default {
  darkMode: ['class'],
  content: [
    './index.html',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    container: {
      center: true,
      padding: '1.5rem',
      screens: {
        '2xl': '1440px',
      },
    },
    extend: {
      colors: {
        bg0: c('bg0'),
        bg1: c('bg1'),
        bg2: c('bg2'),
        bg3: c('bg3'),
        line: c('line'),
        'line-strong': c('line-strong'),
        ink: c('ink'),
        'ink-dim': c('ink-dim'),
        'ink-faint': c('ink-faint'),
        signal: c('signal'),
        'signal-deep': c('signal-deep'),
        brass: c('brass'),
        ok: c('ok'),
        warn: c('warn'),
      },
      fontFamily: {
        sans: ['var(--font-ui)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'ui-monospace', 'monospace'],
        display: ['var(--font-display)', 'var(--font-ui)', 'sans-serif'],
      },
      fontSize: {
        '2xs': ['11px', '16px'],
      },
      borderRadius: {
        lg: 'var(--r-md)',
        md: 'var(--r-md)',
        sm: 'var(--r-sm)',
      },
    },
  },
  plugins: [],
};
