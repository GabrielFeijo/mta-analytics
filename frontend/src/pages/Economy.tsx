import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { TrendingUp, DollarSign, Wallet } from 'lucide-react';
import { economyApi } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TransactionTable } from '@/components/economy/TransactionTable';

export default function Economy() {
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'EARN' | 'SPEND'>('ALL');

  const { data: snapshot, isLoading } = useQuery({
    queryKey: ['economy-snapshot'],
    queryFn: economyApi.getSnapshot,
    refetchInterval: 30000,
  });

  const { data: transactions = [], isLoading: isTxLoading } = useQuery({
    queryKey: ['recent-transactions'],
    queryFn: () => economyApi.getRecentTransactions(40),
    refetchInterval: 10000,
  });

  const filteredTx = transactions.filter((tx) => {
    if (typeFilter === 'ALL') return true;
    if (typeFilter === 'EARN') return tx.type === 'EARN' || tx.type === 'TRANSFER_IN';
    return tx.type === 'SPEND' || tx.type === 'TRANSFER_OUT';
  });

  const inflation = Number(snapshot?.inflationRate) || 0;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <div className="rounded-md border border-line bg-bg1 px-4 py-3">
          <div className="flex items-center justify-between text-2xs text-ink-faint">
            <span>MASSA MONETÁRIA TOTAL</span>
            <DollarSign className="h-3.5 w-3.5 text-brass" strokeWidth={1.75} />
          </div>
          <div className="mt-1 font-mono text-2xl font-medium tabular-nums text-brass">
            {isLoading ? '…' : formatCurrency(snapshot?.totalMoney || 0)}
          </div>
          <div className="mt-0.5 flex items-center justify-between text-2xs text-ink-dim">
            <span>Soma de bancos + carteira</span>
            <span className={`font-mono ${inflation > 5 ? 'text-signal' : 'text-ok'}`}>
              Inflação {inflation >= 0 ? `+${inflation}%` : `${inflation}%`}
            </span>
          </div>
        </div>

        <div className="rounded-md border border-line bg-bg1 px-4 py-3">
          <div className="flex items-center justify-between text-2xs text-ink-faint">
            <span>LIQUIDEZ EM CIRCULAÇÃO</span>
            <TrendingUp className="h-3.5 w-3.5 text-ok" strokeWidth={1.75} />
          </div>
          <div className="mt-1 font-mono text-2xl font-medium tabular-nums text-ink">
            {isLoading ? '…' : formatCurrency(snapshot?.moneyInCirc || 0)}
          </div>
          <div className="mt-0.5 text-2xs text-ink-dim">
            Capital líquido movimentado ativamente
          </div>
        </div>

        <div className="rounded-md border border-line bg-bg1 px-4 py-3">
          <div className="flex items-center justify-between text-2xs text-ink-faint">
            <span>PATRIMÔNIO MÉDIO POR PILOTO</span>
            <Wallet className="h-3.5 w-3.5 text-ink-dim" strokeWidth={1.75} />
          </div>
          <div className="mt-1 font-mono text-2xl font-medium tabular-nums text-ink">
            {isLoading ? '…' : formatCurrency(snapshot?.avgPlayerWealth || 0)}
          </div>
          <div className="mt-0.5 text-2xs text-ink-dim">
            Média ponderada por personagem ativo
          </div>
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3">
          <div>
            <CardTitle>Livro-Razão de Transações em Tempo Real</CardTitle>
            <CardDescription>
              Auditoria de salários, bancos, concessionárias, postos, multas e rachas (`mta_racing`).
            </CardDescription>
          </div>

          <div className="flex items-center gap-1.5">
            {(
              [
                { key: 'ALL', label: 'Todas' },
                { key: 'EARN', label: 'Entradas (+)' },
                { key: 'SPEND', label: 'Saídas (-)' },
              ] as const
            ).map((f) => (
              <button
                key={f.key}
                type="button"
                onClick={() => setTypeFilter(f.key)}
                className={`h-7 rounded-sm border px-2.5 text-xs font-medium transition-colors ${
                  typeFilter === f.key
                    ? 'border-line-strong bg-bg3 text-ink'
                    : 'border-line bg-bg2 text-ink-dim hover:text-ink'
                }`}
              >
                {f.label}
              </button>
            ))}
            <Badge variant="brass" className="ml-1 font-mono">
              {filteredTx.length}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {isTxLoading ? (
            <div className="py-12 text-center text-xs text-ink-dim">
              Carregando transações…
            </div>
          ) : (
            <TransactionTable transactions={filteredTx} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
