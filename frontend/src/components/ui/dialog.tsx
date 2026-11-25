import * as React from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { cn } from '@/lib/cn';

interface DialogContextValue {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const DialogContext = React.createContext<DialogContextValue>({
  open: false,
  onOpenChange: () => {},
});

export function Dialog({
  open = false,
  onOpenChange = () => {},
  children,
}: {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
}) {
  React.useEffect(() => {
    if (!open) return undefined;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onOpenChange(false);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', handleKey);
    };
  }, [open, onOpenChange]);

  return (
    <DialogContext.Provider value={{ open, onOpenChange }}>{children}</DialogContext.Provider>
  );
}

export function DialogTrigger({ children }: { children: React.ReactNode }) {
  const ctx = React.useContext(DialogContext);
  return (
    <button
      type="button"
      className="inline-flex border-0 bg-transparent p-0 text-inherit"
      onClick={() => ctx.onOpenChange(true)}
    >
      {children}
    </button>
  );
}

export function DialogPortal({ children }: { children: React.ReactNode }) {
  return createPortal(children, document.body);
}

export function DialogClose({
  className,
  children,
}: {
  className?: string;
  children?: React.ReactNode;
}) {
  const ctx = React.useContext(DialogContext);
  return (
    <button type="button" className={className} onClick={() => ctx.onOpenChange(false)}>
      {children}
    </button>
  );
}

export const DialogOverlay = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  const ctx = React.useContext(DialogContext);
  return (
    <div
      ref={ref}
      onClick={() => ctx.onOpenChange(false)}
      className={cn('fixed inset-0 z-50 bg-black/75', className)}
      {...props}
    />
  );
});
DialogOverlay.displayName = 'DialogOverlay';

export const DialogContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => {
  const ctx = React.useContext(DialogContext);
  const localRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    if (ctx.open) {
      localRef.current?.focus();
    }
  }, [ctx.open]);

  if (!ctx.open) return null;

  return createPortal(
    <>
      <DialogOverlay />
      <div
        ref={(node) => {
          localRef.current = node;
          if (typeof ref === 'function') {
            ref(node);
          } else if (ref) {
            ref.current = node;
          }
        }}
        role="dialog"
        aria-modal="true"
        tabIndex={-1}
        className={cn(
          'fixed left-[50%] top-[50%] z-50 grid w-full max-w-xl translate-x-[-50%] translate-y-[-50%] gap-4 rounded-md border border-line-strong bg-bg1 p-5 text-ink shadow-[0_20px_50px_rgba(0,0,0,0.75)] focus:outline-none',
          className,
        )}
        {...props}
      >
        {children}
        <button
          type="button"
          onClick={() => ctx.onOpenChange(false)}
          className="absolute right-3.5 top-3.5 inline-flex h-7 w-7 items-center justify-center rounded-sm border border-transparent text-ink-dim transition-colors hover:border-line hover:bg-bg2 hover:text-ink focus:outline-none"
        >
          <X className="h-4 w-4" strokeWidth={1.75} />
          <span className="sr-only">Fechar</span>
        </button>
      </div>
    </>,
    document.body,
  );
});
DialogContent.displayName = 'DialogContent';

export const DialogHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('flex flex-col space-y-1 text-left', className)} {...props} />
);

export const DialogFooter = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn('flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2', className)}
    {...props}
  />
);

export const DialogTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h2
    ref={ref}
    className={cn('font-display text-lg font-semibold uppercase tracking-wide text-ink', className)}
    {...props}
  />
));
DialogTitle.displayName = 'DialogTitle';

export const DialogDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p ref={ref} className={cn('text-xs text-ink-dim', className)} {...props} />
));
DialogDescription.displayName = 'DialogDescription';
