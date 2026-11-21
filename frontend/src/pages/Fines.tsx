import { useQuery } from '@tanstack/react-query';
import { FileWarning, DollarSign, Users, Gauge } from 'lucide-react';
import { analyticsApi } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export default function Fines() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['fines-stats'],
    queryFn: () => analyticsApi.getFinesStats(24),
    refetchInterval: 10000,
  });

  const totalFines = Number(stats?.summary?.totalFines) || 0;
  const totalAmount = Number(stats?.summary?.totalAmount) || 0;
  const avgFine = totalFines > 0 ? Math.round(totalAmount / totalFines) : 0;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <div className="rounded-md border border-line bg-bg1 px-4 py-3">
          <div className="flex items-center justify-between text-2xs text-ink-faint">
            <span>INFRAÇÕES REGISTRADAS (24H)</span>
            <FileWarning className="h-3.5 w-3.5 text-signal" strokeWidth={1.75} />
          </div>
          <div className="mt-1 font-mono text-2xl font-medium tabular-nums text-ink">
            {isLoading ? '…' : totalFines}
          </div>
          <div className="mt-0.5 text-2xs text-ink-dim">
            Autuações via radar eletrônico e blitz
          </div>
        </div>

        <div className="rounded-md border border-line bg-bg1 px-4 py-3">
          <div className="flex items-center justify-between text-2xs text-ink-faint">
            <span>VOLUME AUTUADO (24H)</span>
            <DollarSign className="h-3.5 w-3.5 text-brass" strokeWidth={1.75} />
          </div>
          <div className="mt-1 font-mono text-2xl font-medium tabular-nums text-brass">
            {isLoading ? '…' : formatCurrency(totalAmount)}
          </div>
          <div className="mt-0.5 text-2xs text-ink-dim">
            Arrecadação acumulada de multas
          </div>
        </div>

        <div className="rounded-md border border-line bg-bg1 px-4 py-3">
          <div className="flex items-center justify-between text-2xs text-ink-faint">
            <span>VALOR MÉDIO POR AUTUAÇÃO</span>
            <Gauge className="h-3.5 w-3.5 text-ink-dim" strokeWidth={1.75} />
          </div>
          <div className="mt-1 font-mono text-2xl font-medium tabular-nums text-ink">
            {isLoading ? '…' : formatCurrency(avgFine)}
          </div>
          <div className="mt-0.5 text-2xs text-ink-dim">
            Severidade média das infrações
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        <Card className="xl:col-span-8">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Registro de Autuações de Trânsito</CardTitle>
              <CardDescription>
                Infrações capturadas por radares (`spc_trafi` / `placa`).
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
                {stats?.recentFines?.map((fine: any, idx: number) => (
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
                      Nenhuma multa registrada nas últimas 24 horas.
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
              <CardTitle>Maiores Infratores (24h)</CardTitle>
            </div>
            <Badge variant="brass">Top {stats?.topPlayers?.length || 0}</Badge>
          </CardHeader>

          <CardContent className="space-y-2">
            {stats?.topPlayers?.map((player: any, index: number) => (
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
