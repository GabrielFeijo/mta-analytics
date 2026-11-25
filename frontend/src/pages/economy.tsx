import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { DollarSign, TrendingUp, Wallet } from 'lucide-react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { economyApi } from '@/services/economy-api';
import { formatCurrency, formatDate } from '@/lib/formatters';
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

const SERIES_PERIOD_OPTIONS = [
  { key: '24h', label: '24H' },
  { key: '7d', label: '7D' },
  { key: '30d', label: '30D' },
] as const;

type TypeFilter = (typeof FILTER_OPTIONS)[number]['key'];
type SeriesPeriod = (typeof SERIES_PERIOD_OPTIONS)[number]['key'];

export default function Economy() {
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('ALL');
  const [seriesPeriod, setSeriesPeriod] = useState<SeriesPeriod>('7d');

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
    data: timeSeries = [],
    isLoading: isSeriesLoading,
    isError: isSeriesError,
    refetch: refetchSeries,
  } = useQuery({
    queryKey: ['economy-timeseries', 'totalMoney', seriesPeriod],
    queryFn: () => economyApi.getTimeSeries('totalMoney', seriesPeriod),
    refetchInterval: 60000,
  });

  const {
    data: transactions = [],
    isLoading: isTxLoading,
    isError: isTxError,
    refetch: refetchTx,
  } = useQuery({
    queryKey: ['recent-transactions', typeFilter],
    queryFn: () => economyApi.getRecentTransactions(50, typeFilter),
    refetchInterval: 10000,
  });

  if (isSnapshotError && isTxError) {
    return (
      <QueryErrorState
        message="Não foi possível carregar o módulo econômico."
        onRetry={() => {
          void refetchSnapshot();
          void refetchTx();
          void refetchSeries();
        }}
      />
    );
  }

  const inflation = Number(snapshot?.inflationRate) || 0;
  const dirtyMoney = Number(snapshot?.dirtyMoney) || 0;

  return (
    <div className="space-y-4">
      {isSnapshotError ? (
        <QueryErrorState
          message="Não foi possível sincronizar os indicadores consolidados da economia."
          onRetry={() => void refetchSnapshot()}
        />
      ) : (
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
            footerLeft="Média por piloto ativo (30d)"
          />
        </div>
      )}

      <Card>
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3">
          <div>
            <CardTitle>Evolução da Massa Monetária</CardTitle>
            <CardDescription>
              Série histórica de snapshots horários do patrimônio consolidado no servidor.
            </CardDescription>
          </div>

          <div className="flex items-center gap-1.5">
            {SERIES_PERIOD_OPTIONS.map((opt) => (
              <button
                key={opt.key}
                type="button"
                onClick={() => setSeriesPeriod(opt.key)}
                className={`h-7 rounded-sm border px-2 font-mono text-2xs transition-colors ${
                  seriesPeriod === opt.key
                    ? 'border-line-strong bg-bg3 text-brass'
                    : 'border-line bg-bg2 text-ink-dim hover:text-ink'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </CardHeader>

        <CardContent>
          {isSeriesError ? (
            <QueryErrorState
              message="Falha ao carregar a série histórica da massa monetária."
              onRetry={() => void refetchSeries()}
            />
          ) : isSeriesLoading ? (
            <div className="flex h-[220px] items-center justify-center text-xs text-ink-dim">
              Carregando série temporal…
            </div>
          ) : timeSeries.length === 0 ? (
            <div className="flex h-[220px] items-center justify-center text-xs text-ink-dim">
              Nenhum snapshot horário acumulado nesta janela.
            </div>
          ) : (
            <div className="h-[220px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={timeSeries}>
                  <defs>
                    <linearGradient id="brassAreaGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#C8A455" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#C8A455" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="#2C2E33" vertical={false} />
                  <XAxis
                    dataKey="timestamp"
                    stroke="#A29F94"
                    fontSize={11}
                    tickLine={false}
                    axisLine={{ stroke: '#2C2E33' }}
                    tickFormatter={(val: string) => {
                      const d = new Date(val);
                      return Number.isNaN(d.getTime())
                        ? ''
                        : `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}h`;
                    }}
                  />
                  <YAxis
                    stroke="#A29F94"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value: number) =>
                      value >= 1_000_000
                        ? `R$${(value / 1_000_000).toFixed(1)}M`
                        : value >= 1000
                          ? `R$${Math.round(value / 1000)}k`
                          : `R$${value}`
                    }
                  />
                  <Tooltip
                    labelFormatter={(label) => formatDate(String(label))}
                    formatter={(val) => [formatCurrency(Number(val) || 0), 'Massa Monetária']}
                    contentStyle={{
                      backgroundColor: '#16171A',
                      border: '1px solid #3D4046',
                      borderRadius: '2px',
                      fontSize: '11px',
                      fontFamily: 'var(--font-mono)',
                      color: '#ECE8DC',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke="#C8A455"
                    strokeWidth={1.75}
                    fill="url(#brassAreaGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3">
          <div>
            <CardTitle>Livro-Razão de Transações em Tempo Real</CardTitle>
            <CardDescription>
              Auditoria de salários, bancos, concessionárias, postos, multas e rachas (
              <code className="font-mono text-brass">mta_racing</code>).
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
              {transactions.length}
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
            <TransactionTable transactions={transactions} showDate />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
