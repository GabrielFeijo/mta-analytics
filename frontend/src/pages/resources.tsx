import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Car, Flag, ShoppingCart } from 'lucide-react';
import { analyticsApi } from '@/services/analytics-api';
import { formatCurrency, formatDate, formatTime } from '@/lib/formatters';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MetricCard } from '@/components/dashboard/metric-card';
import { TimeWindowSelector } from '@/components/common/time-window-selector';
import { QueryErrorState } from '@/components/common/query-error-state';
import { TransactionTable } from '@/components/economy/transaction-table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export default function Resources() {
  const [windowHours, setWindowHours] = useState<number>(24);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['resources-stats', windowHours],
    queryFn: () => analyticsApi.getResourcesStats(windowHours),
    refetchInterval: 30000,
  });

  if (isError) {
    return (
      <QueryErrorState
        message="Erro ao carregar telemetria de recursos, lojas e corridas."
        onRetry={() => void refetch()}
      />
    );
  }

  const stats = data?.stats || {
    totalRevenue: 0,
    vehicleRevenue: 0,
    shopRevenue: 0,
    raceVolume: 0,
    totalTransactions: 0,
    vehicleCount: 0,
    shopCount: 0,
    raceCount: 0,
  };

  const vehiclePurchases = data?.vehicleSales || [];
  const shopPurchases = data?.shopSales || [];
  const raceActivity = data?.raceActivity || [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <span className="text-2xs uppercase tracking-wider text-ink-faint">
          Janela de Telemetria
        </span>
        <TimeWindowSelector value={windowHours} onChange={setWindowHours} />
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <MetricCard
          label="CORRIDAS & APOSTAS (MTA_RACING)"
          value={formatCurrency(stats.raceVolume || 0)}
          icon={Flag}
          iconClassName="text-signal"
          valueClassName="text-brass"
          footerLeft="Inscrições, prêmios e apostas"
          footerRight={<span className="font-mono text-ink">{stats.raceCount || 0} operações</span>}
        />

        <MetricCard
          label="CONCESSIONÁRIAS (VEÍCULOS)"
          value={formatCurrency(stats.vehicleRevenue || 0)}
          icon={Car}
          iconClassName="text-brass"
          footerLeft="Aquisições na spc_carshop"
          footerRight={
            <span className="font-mono text-brass">{stats.vehicleCount || 0} veículos</span>
          }
        />

        <MetricCard
          label="LOJAS, OFICINAS & POSTOS"
          value={formatCurrency(stats.shopRevenue || 0)}
          icon={ShoppingCart}
          footerLeft="Consumo de itens e serviços"
          footerRight={<span className="font-mono text-ink">{stats.shopCount || 0} vendas</span>}
        />
      </div>

      <Tabs defaultValue="racing" className="space-y-3">
        <TabsList>
          <TabsTrigger value="racing">
            Corridas Clandestinas ({raceActivity.length})
          </TabsTrigger>
          <TabsTrigger value="vehicles">
            Concessionárias ({vehiclePurchases.length})
          </TabsTrigger>
          <TabsTrigger value="shops">
            Lojas & Oficinas ({shopPurchases.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="racing">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>
                  Telemetria Financeira — Underground Racing (
                  <code className="font-mono text-brass">mta_racing</code>)
                </CardTitle>
                <CardDescription>
                  Movimentação de dinheiro limpo e dinheiro sujo (blocos) em baterias e apostas paralelas.
                </CardDescription>
              </div>
              <Badge variant="brass" className="font-mono">
                Garage Night
              </Badge>
            </CardHeader>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="py-10 text-center text-xs text-ink-dim">Carregando…</div>
              ) : raceActivity.length === 0 ? (
                <div className="py-10 text-center text-xs text-ink-dim">
                  Nenhuma movimentação de corrida registrada neste período.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Piloto</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Moeda</TableHead>
                      <TableHead>Circuito / Operação</TableHead>
                      <TableHead className="text-right">Valor</TableHead>
                      <TableHead className="text-right">Horário</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {raceActivity.map((item, idx) => {
                      const isEarn = item.type === 'EARN';
                      return (
                        <TableRow key={item.id || idx}>
                          <TableCell className="font-medium text-ink">
                            {item.player}
                          </TableCell>
                          <TableCell>
                            <Badge variant={isEarn ? 'ok' : 'default'} className="font-mono">
                              {isEarn ? 'PRÊMIO / GANHO' : 'GRID / APOSTA'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={item.currency === 'dirty' ? 'warn' : 'brass'}
                              className="font-mono"
                            >
                              {item.currency === 'dirty' ? 'SUJO (BLOCOS)' : 'LIMPO (R$)'}
                            </Badge>
                          </TableCell>
                          <TableCell className="max-w-[300px] truncate text-ink-dim">
                            {item.description}
                          </TableCell>
                          <TableCell
                            className={`whitespace-nowrap text-right font-mono font-medium tabular-nums ${
                              isEarn ? 'text-ok' : 'text-signal'
                            }`}
                          >
                            {isEarn ? '+' : '-'} {formatCurrency(Number(item.amount) || 0)}
                          </TableCell>
                          <TableCell className="whitespace-nowrap text-right font-mono text-2xs tabular-nums text-ink-faint">
                            {windowHours > 24
                              ? formatDate(item.timestamp)
                              : formatTime(item.timestamp)}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="vehicles">
          <Card>
            <CardHeader>
              <CardTitle>Aquisições Recentes em Concessionárias</CardTitle>
              <CardDescription>
                Compras registradas via{' '}
                <code className="font-mono text-brass">logVehiclePurchase</code> (
                <code className="font-mono text-ink">spc_carshop</code>).
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="py-10 text-center text-xs text-ink-dim">Carregando…</div>
              ) : (
                <TransactionTable
                  showDate={windowHours > 24}
                  transactions={vehiclePurchases.map((tx) => ({
                    id: tx.id,
                    type: 'SPEND',
                    amount: tx.amount,
                    source: tx.source || 'spc_carshop',
                    description: tx.vehicleName || 'Veículo',
                    timestamp: tx.timestamp,
                    player: { lastUsername: tx.player },
                    balance: 0,
                  }))}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="shops">
          <Card>
            <CardHeader>
              <CardTitle>Consumo em Lojas, Oficinas e Postos</CardTitle>
              <CardDescription>
                Transações comerciais registradas via{' '}
                <code className="font-mono text-brass">logTransaction</code>.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="py-10 text-center text-xs text-ink-dim">Carregando…</div>
              ) : (
                <TransactionTable
                  showDate={windowHours > 24}
                  transactions={shopPurchases.map((tx) => ({
                    id: tx.id,
                    type: 'SPEND',
                    amount: tx.amount,
                    source: tx.source || 'comercio_rp',
                    description: tx.itemName || 'Item comercial',
                    timestamp: tx.timestamp,
                    player: { lastUsername: tx.player },
                    balance: 0,
                  }))}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
