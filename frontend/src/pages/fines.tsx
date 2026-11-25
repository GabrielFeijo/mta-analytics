import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { DollarSign, FileWarning, Gauge, Users } from 'lucide-react';
import { analyticsApi } from '@/services/analytics-api';
import { formatCurrency, formatDate } from '@/lib/formatters';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MetricCard } from '@/components/dashboard/metric-card';
import { TimeWindowSelector } from '@/components/common/time-window-selector';
import { QueryErrorState } from '@/components/common/query-error-state';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export default function Fines() {
  const [windowHours, setWindowHours] = useState<number>(24);

  const {
    data: stats,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['fines-stats', windowHours],
    queryFn: () => analyticsApi.getFinesStats(windowHours),
    refetchInterval: 10000,
  });

  if (isError) {
    return (
      <QueryErrorState
        message="Erro ao carregar estatísticas do radar de multas."
        onRetry={() => void refetch()}
      />
    );
  }

  const totalFines = Number(stats?.summary?.totalFines) || 0;
  const totalAmount = Number(stats?.summary?.totalAmount) || 0;
  const avgFine = totalFines > 0 ? Math.round(totalAmount / totalFines) : 0;
  const windowLabel = windowHours === 168 ? '7D' : `${windowHours}H`;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <span className="text-2xs uppercase tracking-wider text-ink-faint">
          Janela de Auditoria
        </span>
        <TimeWindowSelector value={windowHours} onChange={setWindowHours} />
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <MetricCard
          label={`INFRAÇÕES REGISTRADAS (${windowLabel})`}
          value={isLoading ? '…' : totalFines}
          icon={FileWarning}
          iconClassName="text-signal"
          footerLeft="Autuações via radar eletrônico e blitz"
        />

        <MetricCard
          label={`VOLUME AUTUADO (${windowLabel})`}
          value={isLoading ? '…' : formatCurrency(totalAmount)}
          icon={DollarSign}
          iconClassName="text-brass"
          valueClassName="text-brass"
          footerLeft="Arrecadação acumulada de multas"
        />

        <MetricCard
          label="VALOR MÉDIO POR AUTUAÇÃO"
          value={isLoading ? '…' : formatCurrency(avgFine)}
          icon={Gauge}
          footerLeft="Severidade média das infrações"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        <Card className="xl:col-span-8">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Registro de Autuações de Trânsito</CardTitle>
              <CardDescription>
                Infrações capturadas por radares (
                <code className="font-mono text-brass">spc_trafi</code> /{' '}
                <code className="font-mono text-brass">placa</code>).
              </CardDescription>
            </div>
            <Badge variant="default" className="font-mono">
              {stats?.recentFines?.length || 0} registros
            </Badge>
          </CardHeader>

          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Infrator</TableHead>
                  <TableHead>Placa</TableHead>
                  <TableHead>Enquadramento / Motivo</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                  <TableHead className="text-right">Horário</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stats?.recentFines?.map((fine, idx) => (
                  <TableRow key={fine.id || idx}>
                    <TableCell className="whitespace-nowrap font-medium text-ink">
                      {fine.player || 'Desconhecido'}
                    </TableCell>
                    <TableCell>
                      <span className="inline-flex items-center rounded-sm border border-line-strong bg-bg2 px-2 py-0.5 font-mono text-xs font-semibold tracking-wider text-brass">
                        {fine.plate || 'SEM-PLACA'}
                      </span>
                    </TableCell>
                    <TableCell
                      className="max-w-[260px] truncate text-ink-dim"
                      title={fine.reason}
                    >
                      {fine.reason || 'Excesso de velocidade'}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-right font-mono font-medium tabular-nums text-signal">
                      {formatCurrency(Number(fine.amount) || 0)}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-right font-mono text-2xs tabular-nums text-ink-faint">
                      {formatDate(fine.timestamp)}
                    </TableCell>
                  </TableRow>
                ))}
                {(!stats?.recentFines || stats.recentFines.length === 0) && (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="py-10 text-center text-xs text-ink-dim"
                    >
                      Nenhuma multa registrada neste período.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card className="self-start xl:col-span-4">
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-brass" strokeWidth={1.75} />
              <CardTitle>Maiores Infratores ({windowLabel})</CardTitle>
            </div>
            <Badge variant="brass">Top {stats?.topPlayers?.length || 0}</Badge>
          </CardHeader>

          <CardContent className="space-y-2">
            {stats?.topPlayers?.map((player, index) => (
              <div
                key={player.username || index}
                className="flex items-center justify-between rounded-sm border border-line bg-bg2 px-3 py-2"
              >
                <div className="flex min-w-0 items-center gap-2.5">
                  <span
                    className={`font-mono text-xs font-semibold tabular-nums ${
                      index === 0 ? 'text-signal' : 'text-brass'
                    }`}
                  >
                    #{index + 1}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-[13px] font-medium text-ink">
                      {player.username}
                    </p>
                    <p className="font-mono text-2xs text-ink-dim">
                      {player.count} autuações
                    </p>
                  </div>
                </div>
                <span className="font-mono text-xs font-medium tabular-nums text-signal">
                  {formatCurrency(Number(player.totalAmount) || 0)}
                </span>
              </div>
            ))}

            {(!stats?.topPlayers || stats.topPlayers.length === 0) && (
              <div className="py-8 text-center text-xs text-ink-dim">
                Sem reincidentes registrados neste período.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
