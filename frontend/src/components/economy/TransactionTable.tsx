import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { formatCurrency, formatTime } from '@/lib/utils';
import { ArrowDownRight, ArrowUpRight } from 'lucide-react';

interface TransactionItem {
  id: number | string;
  type: 'EARN' | 'SPEND' | 'TRANSFER_IN' | 'TRANSFER_OUT';
  amount: number;
  source: string;
  balance?: number;
  description?: string;
  timestamp: string;
  player?: {
    lastUsername: string;
  };
}

const TYPE_META: Record<
  string,
  { label: string; isInflow: boolean; variant: 'ok' | 'default' | 'brass' }
> = {
  EARN: { label: 'RECEITA', isInflow: true, variant: 'ok' },
  TRANSFER_IN: { label: 'TRANSF. RECEBIDA', isInflow: true, variant: 'brass' },
  SPEND: { label: 'DESPESA', isInflow: false, variant: 'default' },
  TRANSFER_OUT: { label: 'TRANSF. ENVIADA', isInflow: false, variant: 'default' },
};

export function TransactionTable({ transactions }: { transactions: TransactionItem[] }) {
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
              <TableCell className="max-w-[260px] truncate text-ink-dim" title={tx.description || tx.source}>
                <span className="font-mono text-xs text-ink">{tx.source}</span>
                {tx.description && (
                  <span className="ml-2 text-2xs text-ink-faint">— {tx.description}</span>
                )}
              </TableCell>
              <TableCell
                className={`whitespace-nowrap text-right font-mono tabular-nums font-medium ${
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
