import * as React from 'react';
import { cn } from '@/lib/cn';

export type ButtonVariant =
  | 'default'
  | 'destructive'
  | 'outline'
  | 'secondary'
  | 'ghost'
  | 'link';

export type ButtonSize = 'default' | 'sm' | 'lg' | 'icon';

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  default: 'border border-signal bg-signal text-ink hover:bg-signal/90',
  destructive: 'border border-signal/50 bg-transparent text-signal hover:bg-signal/10',
  outline: 'border border-line bg-bg2 text-ink hover:border-line-strong hover:bg-bg3',
  secondary: 'border border-line bg-bg2 text-ink hover:border-line-strong hover:bg-bg3',
  ghost: 'border border-transparent bg-transparent text-ink-dim hover:bg-bg2 hover:text-ink',
  link: 'text-brass underline-offset-4 hover:underline',
};

const SIZE_CLASSES: Record<ButtonSize, string> = {
  default: 'h-8 px-3 py-1.5 gap-2',
  sm: 'h-7 px-2.5 text-xs gap-1.5',
  lg: 'h-9 px-4 text-sm gap-2',
  icon: 'h-7 w-7',
};

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', ...props }, ref) => (
    <button
      ref={ref}
      className={cn(
        'inline-flex shrink-0 items-center justify-center whitespace-nowrap rounded-sm text-[13px] font-medium transition-colors focus-visible:outline-none disabled:pointer-events-none disabled:opacity-40',
        VARIANT_CLASSES[variant],
        SIZE_CLASSES[size],
        className,
      )}
      {...props}
    />
  ),
);
Button.displayName = 'Button';
