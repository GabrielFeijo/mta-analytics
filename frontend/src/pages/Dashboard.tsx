import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Users, Activity, DollarSign, Flag, ShieldAlert } from 'lucide-react';
import { analyticsApi } from '@/lib/api';
import { useAnalyticsSocket } from '@/hooks/useAnalyticsSocket';
import { useDashboardStore } from '@/stores/dashboardStore';
import { formatNumber, formatCurrency } from '@/lib/utils';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Overview } from '@/components/dashboard/Overview';
import { RecentActivity } from '@/components/dashboard/RecentActivity';
import { HeatmapView } from '@/components/dashboard/HeatmapView';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';

export default function Dashboard() {
  const { socket, isConnected, subscribe } = useAnalyticsSocket();
  const {
    stats,
    setStats,
    addEvent,
    adjustPlayerCount,
    updateEconomicSnapshot,
  } = useDashboardStore();

  const { data: initialData, isLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: analyticsApi.getDashboardStats,
    refetchInterval: 30000,
  });

  const { data: overviewData } = useQuery({
    queryKey: ['dashboard-overview'],
    queryFn: analyticsApi.getOverviewStats,
    refetchInterval: 60000,
  });

  const { data: resourcesData } = useQuery({
    queryKey: ['resources-stats'],
    queryFn: () => analyticsApi.getResourcesStats(24),
    refetchInterval: 60000,
  });

  useEffect(() => {
    if (initialData) {
      setStats(initialData);
    }
  }, [initialData, setStats]);

  useEffect(() => {
    if (!socket || !isConnected) return;

    subscribe('initial-data', (data) => {
      setStats(data);
    });

    subscribe('event:new', (event) => {
      addEvent(event);
    });

    subscribe('player:online', () => {
      adjustPlayerCount(1);
    });

    subscribe('player:offline', () => {
      adjustPlayerCount(-1);
    });

    subscribe('economy:update', (data) => {
      updateEconomicSnapshot(data);
    });
  }, [
    socket,
    isConnected,
    subscribe,
    setStats,
    addEvent,
    adjustPlayerCount,
    updateEconomicSnapshot,
  ]);

  if (isLoading && !stats) {
    return (
      <div className="flex h-[60vh] items-center justify-center text-xs text-ink-dim">
        Sincronizando telemetria do servidor…
      </div>
    );
  }

  const currentStats = stats || initialData;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-md border border-line bg-bg1 px-4 py-3">
          <div className="flex items-center justify-between text-2xs text-ink-faint">
            <span>TOTAL DE PILOTOS</span>
            <Users className="h-3.5 w-3.5 text-ink-dim" strokeWidth={1.75} />
          </div>
          <div className="mt-1 font-mono text-2xl font-medium tabular-nums text-ink">
            {formatNumber(currentStats?.totalPlayers || 0)}
          </div>
          <div className="mt-0.5 flex items-center justify-between text-2xs text-ink-dim">
            <span>Base cadastrada</span>
            <span className="font-mono text-ok">
              {currentStats?.trends?.playerGrowth || '+0'}% (24h)
            </span>
          </div>
        </div>

        <div className="rounded-md border border-line bg-bg1 px-4 py-3">
          <div className="flex items-center justify-between text-2xs text-ink-faint">
            <span>ONLINE AGORA</span>
            <Activity className="h-3.5 w-3.5 text-ok" strokeWidth={1.75} />
          </div>
          <div className="mt-1 font-mono text-2xl font-medium tabular-nums text-ok">
            {formatNumber(currentStats?.onlinePlayers || 0)}
          </div>
          <div className="mt-0.5 flex items-center justify-between text-2xs text-ink-dim">
            <span>Sessões ativas</span>
            <span className="font-mono text-ink">
              {currentStats?.trends?.onlineTrend || '+0%'} vs 1h
            </span>
          </div>
        </div>

        <div className="rounded-md border border-line bg-bg1 px-4 py-3">
          <div className="flex items-center justify-between text-2xs text-ink-faint">
            <span>LIQUIDEZ EM CIRCULAÇÃO</span>
            <DollarSign className="h-3.5 w-3.5 text-brass" strokeWidth={1.75} />
          </div>
          <div className="mt-1 font-mono text-2xl font-medium tabular-nums text-brass">
            {formatCurrency(currentStats?.economicSnapshot?.moneyInCirc || 0)}
          </div>
          <div className="mt-0.5 flex items-center justify-between text-2xs text-ink-dim">
            <span>Snapshot monetário</span>
            <span className="font-mono text-ink-faint">
              Média {formatCurrency(currentStats?.economicSnapshot?.avgPlayerWealth || 0)}
            </span>
          </div>
        </div>

        <div className="rounded-md border border-line bg-bg1 px-4 py-3">
          <div className="flex items-center justify-between text-2xs text-ink-faint">
            <span>VOLUME LOJAS & RACHAS (24H)</span>
            <Flag className="h-3.5 w-3.5 text-signal" strokeWidth={1.75} />
          </div>
          <div className="mt-1 font-mono text-2xl font-medium tabular-nums text-ink">
            {formatCurrency(resourcesData?.stats?.totalRevenue || 0)}
          </div>
          <div className="mt-0.5 flex items-center justify-between text-2xs text-ink-dim">
            <span>
              Rachas:{' '}
              <span className="font-mono text-brass">
                {formatCurrency(resourcesData?.stats?.raceVolume || 0)}
              </span>
            </span>
            {Number(currentStats?.riskAlerts) > 0 && (
              <span className="flex items-center gap-1 font-mono text-signal">
                <ShieldAlert className="h-3 w-3" /> {currentStats.riskAlerts} alerta(s)
              </span>
            )}
          </div>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <TabsList>
            <TabsTrigger value="overview">Fluxo Econômico & Eventos</TabsTrigger>
            <TabsTrigger value="heatmap">Mapa de Calor (San Andreas)</TabsTrigger>
          </TabsList>

          <div className="flex items-center gap-2 text-2xs text-ink-dim">
            <span>Fonte:</span>
            <Badge variant="brass" className="font-mono">
              mta_analytics_resource
            </Badge>
          </div>
        </div>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
            <Card className="xl:col-span-7">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Balanço de Entradas vs Saídas (7 Dias)</CardTitle>
                  <CardDescription>
                    Comparativo diário de emissões monetárias e queima de caixa no servidor.
                  </CardDescription>
                </div>
                <Badge variant="outline" className="font-mono">
                  BRL / R$
                </Badge>
              </CardHeader>
              <CardContent>
                <Overview data={overviewData || []} />
              </CardContent>
            </Card>

            <Card className="xl:col-span-5">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Stream de Eventos em Tempo Real</CardTitle>
                  <CardDescription>
                    Últimas ocorrências capturadas pelos coletores Lua.
                  </CardDescription>
                </div>
                <Badge variant="ok" className="font-mono">
                  {(currentStats?.recentEvents || []).length} eventos
                </Badge>
              </CardHeader>
              <CardContent>
                <RecentActivity events={currentStats?.recentEvents || []} />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="heatmap">
          <HeatmapView />
        </TabsContent>
      </Tabs>
    </div>
  );
}
