import * as React from 'react';
import { cn } from '@/lib/utils';

export const Select = ({ children }: { children: React.ReactNode }) => <>{children}</>;
export const SelectGroup = ({ children }: { children: React.ReactNode }) => <>{children}</>;
export const SelectValue = ({ placeholder }: { placeholder?: string }) => <span>{placeholder}</span>;
export const SelectTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ className, children, ...props }, ref) => (
  <button
    ref={ref}
    type="button"
    className={cn(
      'flex h-8 w-full items-center justify-between rounded-sm border border-line bg-bg2 px-2.5 text-[13px] text-ink',
      className,
    )}
    {...props}
  >
    {children}
  </button>
));
SelectTrigger.displayName = 'SelectTrigger';
export const SelectContent = ({ children }: { children: React.ReactNode }) => <div>{children}</div>;
export const SelectLabel = ({ children }: { children: React.ReactNode }) => <div>{children}</div>;
export const SelectItem = ({ children }: { children: React.ReactNode; value?: string }) => (
  <div>{children}</div>
);
export const SelectSeparator = () => <div className="my-1 h-px bg-line" />;
