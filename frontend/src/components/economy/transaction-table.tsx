import { ArrowDownRight, ArrowUpRight } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { formatCurrency, formatTime } from '@/lib/formatters';
import { Transaction } from '@/types/telemetry';

const TYPE_META: Record<
  string,
  { label: string; isInflow: boolean; variant: 'ok' | 'default' | 'brass' }
> = {
  EARN: { label: 'RECEITA', isInflow: true, variant: 'ok' },
  TRANSFER_IN: { label: 'TRANSF. RECEBIDA', isInflow: true, variant: 'brass' },
  ADMIN_ADD: { label: 'CRÉDITO ADMIN', isInflow: true, variant: 'ok' },
  SPEND: { label: 'DESPESA', isInflow: false, variant: 'default' },
  TRANSFER_OUT: { label: 'TRANSF. ENVIADA', isInflow: false, variant: 'default' },
  ADMIN_REMOVE: { label: 'DÉBITO ADMIN', isInflow: false, variant: 'default' },
};

function resolveTransactionDescription(tx: Transaction): string | undefined {
  if (tx.description) {
    return tx.description;
  }
  const meta = tx.metadata;
  if (!meta) {
    return undefined;
  }
  const candidate = meta.description ?? meta.vehicleName ?? meta.reason;
  return typeof candidate === 'string' && candidate.trim() ? candidate : undefined;
}

export function TransactionTable({ transactions }: { transactions: Transaction[] }) {
  if (!transactions || transactions.length === 0) {
    return (
      <div className="py-10 text-center text-xs text-ink-dim">
        Nenhuma movimentação financeira registrada neste filtro.
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Jogador</TableHead>
          <TableHead>Operação</TableHead>
          <TableHead>Origem / Recurso</TableHead>
          <TableHead className="text-right">Valor</TableHead>
          <TableHead className="text-right">Horário</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {transactions.map((tx, idx) => {
          const meta = TYPE_META[tx.type] || {
            label: tx.type,
            isInflow: false,
            variant: 'default' as const,
          };
          const description = resolveTransactionDescription(tx);

          return (
            <TableRow key={tx.id || idx}>
              <TableCell className="max-w-[160px] truncate font-medium text-ink">
                {tx.player?.lastUsername || 'Desconhecido'}
              </TableCell>
              <TableCell>
                <Badge variant={meta.variant} className="font-mono">
                  {meta.isInflow ? (
                    <ArrowUpRight className="h-3 w-3" strokeWidth={2} />
                  ) : (
                    <ArrowDownRight className="h-3 w-3" strokeWidth={2} />
                  )}
                  {meta.label}
                </Badge>
              </TableCell>
              <TableCell
                className="max-w-[280px] truncate text-ink-dim"
                title={description || tx.source}
              >
                <span className="font-mono text-xs text-ink">{tx.source || 'sistema'}</span>
                {description && (
                  <span className="ml-2 text-2xs text-ink-faint">— {description}</span>
                )}
              </TableCell>
              <TableCell
                className={`whitespace-nowrap text-right font-mono font-medium tabular-nums ${
                  meta.isInflow ? 'text-ok' : 'text-signal'
                }`}
              >
                {meta.isInflow ? '+' : '-'} {formatCurrency(Number(tx.amount) || 0)}
              </TableCell>
              <TableCell className="whitespace-nowrap text-right font-mono text-2xs tabular-nums text-ink-faint">
                {formatTime(tx.timestamp)}
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
