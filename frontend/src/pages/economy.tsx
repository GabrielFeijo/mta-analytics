import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { DollarSign, TrendingUp, Wallet } from 'lucide-react';
import { economyApi } from '@/services/economy-api';
import { formatCurrency } from '@/lib/formatters';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MetricCard } from '@/components/dashboard/metric-card';
import { TransactionTable } from '@/components/economy/transaction-table';
import { QueryErrorState } from '@/components/common/query-error-state';

const FILTER_OPTIONS = [
  { key: 'ALL', label: 'Todas' },
  { key: 'EARN', label: 'Entradas (+)' },
  { key: 'SPEND', label: 'Saídas (-)' },
] as const;

type TypeFilter = (typeof FILTER_OPTIONS)[number]['key'];

export default function Economy() {
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('ALL');

  const {
    data: snapshot,
    isLoading,
    isError: isSnapshotError,
    refetch: refetchSnapshot,
  } = useQuery({
    queryKey: ['economy-snapshot'],
    queryFn: economyApi.getSnapshot,
    refetchInterval: 30000,
  });

  const {
    data: transactions = [],
    isLoading: isTxLoading,
    isError: isTxError,
    refetch: refetchTx,
  } = useQuery({
    queryKey: ['recent-transactions'],
    queryFn: () => economyApi.getRecentTransactions(40),
    refetchInterval: 10000,
  });

  if (isSnapshotError && isTxError) {
    return (
      <QueryErrorState
        message="Não foi possível carregar o módulo econômico."
        onRetry={() => {
          void refetchSnapshot();
          void refetchTx();
        }}
      />
    );
  }

  const filteredTx = transactions.filter((tx) => {
    if (typeFilter === 'ALL') return true;
    if (typeFilter === 'EARN') {
      return tx.type === 'EARN' || tx.type === 'TRANSFER_IN' || tx.type === 'ADMIN_ADD';
    }
    return tx.type === 'SPEND' || tx.type === 'TRANSFER_OUT' || tx.type === 'ADMIN_REMOVE';
  });

  const inflation = Number(snapshot?.inflationRate) || 0;
  const dirtyMoney = Number(snapshot?.dirtyMoney) || 0;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <MetricCard
          label="MASSA MONETÁRIA TOTAL"
          value={isLoading ? '…' : formatCurrency(snapshot?.totalMoney || 0)}
          icon={DollarSign}
          iconClassName="text-brass"
          valueClassName="text-brass"
          footerLeft="Soma de bancos + carteira"
          footerRight={
            <span className={`font-mono ${inflation > 5 ? 'text-signal' : 'text-ok'}`}>
              Inflação {inflation >= 0 ? `+${inflation}%` : `${inflation}%`}
            </span>
          }
        />

        <MetricCard
          label="LIQUIDEZ EM CIRCULAÇÃO"
          value={isLoading ? '…' : formatCurrency(snapshot?.moneyInCirc || 0)}
          icon={TrendingUp}
          iconClassName="text-ok"
          footerLeft="Dinheiro vivo em carteira"
          footerRight={
            dirtyMoney > 0 ? (
              <span className="font-mono text-warn">
                Sujo: {formatCurrency(dirtyMoney)}
              </span>
            ) : null
          }
        />

        <MetricCard
          label="PATRIMÔNIO MÉDIO POR PILOTO"
          value={isLoading ? '…' : formatCurrency(snapshot?.avgPlayerWealth || 0)}
          icon={Wallet}
          footerLeft="Média ponderada por personagem ativo"
        />
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
            {FILTER_OPTIONS.map((f) => (
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
          ) : isTxError ? (
            <div className="p-4">
              <QueryErrorState
                message="Falha ao buscar transações recentes."
                onRetry={() => void refetchTx()}
              />
            </div>
          ) : (
            <TransactionTable transactions={filteredTx} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
