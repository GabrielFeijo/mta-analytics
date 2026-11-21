import { AlertTriangle, RotateCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface QueryErrorStateProps {
  message?: string;
  onRetry?: () => void;
}

export function QueryErrorState({
  message = 'Não foi possível carregar os dados da API.',
  onRetry,
}: QueryErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-md border border-signal/40 bg-bg1 px-4 py-10 text-center">
      <AlertTriangle className="h-5 w-5 text-signal" strokeWidth={1.75} />
      <p className="text-xs text-ink-dim">{message}</p>
      {onRetry && (
        <Button type="button" variant="outline" size="sm" onClick={onRetry}>
          <RotateCw className="h-3.5 w-3.5" strokeWidth={1.75} />
          Tentar novamente
        </Button>
      )}
    </div>
  );
}
