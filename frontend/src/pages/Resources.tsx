import { useQuery } from '@tanstack/react-query';
import { ShoppingCart, Car, Flag } from 'lucide-react';
import { analyticsApi } from '@/lib/api';
import { formatCurrency, formatTime } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TransactionTable } from '@/components/economy/TransactionTable';
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
  const { data, isLoading } = useQuery({
    queryKey: ['resources-stats'],
    queryFn: () => analyticsApi.getResourcesStats(24),
    refetchInterval: 30000,
  });

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
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <div className="rounded-md border border-line bg-bg1 px-4 py-3">
          <div className="flex items-center justify-between text-2xs text-ink-faint">
            <span>CORRIDAS & APOSTAS (MTA_RACING)</span>
            <Flag className="h-3.5 w-3.5 text-signal" strokeWidth={1.75} />
          </div>
          <div className="mt-1 font-mono text-2xl font-medium tabular-nums text-brass">
            {formatCurrency(stats.raceVolume || 0)}
          </div>
          <div className="mt-0.5 flex items-center justify-between text-2xs text-ink-dim">
            <span>Inscrições, prêmios e apostas</span>
            <span className="font-mono text-ink">{stats.raceCount || 0} operações</span>
          </div>
        </div>

        <div className="rounded-md border border-line bg-bg1 px-4 py-3">
          <div className="flex items-center justify-between text-2xs text-ink-faint">
            <span>CONCESSIONÁRIAS (VEÍCULOS)</span>
            <Car className="h-3.5 w-3.5 text-brass" strokeWidth={1.75} />
          </div>
          <div className="mt-1 font-mono text-2xl font-medium tabular-nums text-ink">
            {formatCurrency(stats.vehicleRevenue || 0)}
          </div>
          <div className="mt-0.5 flex items-center justify-between text-2xs text-ink-dim">
            <span>Aquisições na spc_carshop</span>
            <span className="font-mono text-brass">{stats.vehicleCount || 0} veículos</span>
          </div>
        </div>

        <div className="rounded-md border border-line bg-bg1 px-4 py-3">
          <div className="flex items-center justify-between text-2xs text-ink-faint">
            <span>LOJAS, OFICINAS & POSTOS</span>
            <ShoppingCart className="h-3.5 w-3.5 text-ink-dim" strokeWidth={1.75} />
          </div>
          <div className="mt-1 font-mono text-2xl font-medium tabular-nums text-ink">
            {formatCurrency(stats.shopRevenue || 0)}
          </div>
          <div className="mt-0.5 flex items-center justify-between text-2xs text-ink-dim">
            <span>Consumo de itens e serviços</span>
            <span className="font-mono text-ink">{stats.shopCount || 0} vendas</span>
          </div>
        </div>
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
                <CardTitle>Telemetria Financeira — Underground Racing (`mta_racing`)</CardTitle>
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
                  Nenhuma movimentação de corrida registrada nas últimas 24h.
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
                    {raceActivity.map((item: any, idx: number) => {
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
                            {formatTime(item.timestamp)}
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
                Compras registradas via `logVehiclePurchase` (`spc_carshop`).
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="py-10 text-center text-xs text-ink-dim">Carregando…</div>
              ) : (
                <TransactionTable
                  transactions={vehiclePurchases.map((tx: any) => ({
                    id: tx.id,
                    type: 'SPEND',
                    amount: tx.amount,
                    source: 'spc_carshop',
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
                Transações comerciais registradas via `logTransaction`.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="py-10 text-center text-xs text-ink-dim">Carregando…</div>
              ) : (
                <TransactionTable
                  transactions={shopPurchases.map((tx: any) => ({
                    id: tx.id,
                    type: 'SPEND',
                    amount: tx.amount,
                    source: 'comercio_rp',
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
