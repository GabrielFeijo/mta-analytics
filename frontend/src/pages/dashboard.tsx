import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Activity, DollarSign, Flag, ShieldAlert, Users } from 'lucide-react';
import { analyticsApi } from '@/services/analytics-api';
import { useAnalyticsSocket } from '@/hooks/use-analytics-socket';
import { useDashboardStore } from '@/stores/dashboard-store';
import { formatCurrency, formatNumber } from '@/lib/formatters';
import { DashboardStats, EconomicSnapshot, RecentEvent } from '@/types/telemetry';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { MetricCard } from '@/components/dashboard/metric-card';
import { EconomyOverviewChart } from '@/components/dashboard/economy-overview-chart';
import { RecentActivity } from '@/components/dashboard/recent-activity';
import { HeatmapView } from '@/components/dashboard/heatmap-view';
import { QueryErrorState } from '@/components/common/query-error-state';

export default function Dashboard() {
  const { socket, subscribe } = useAnalyticsSocket();
  const {
    stats,
    setStats,
    addEvent,
    updatePlayerCount,
    adjustPlayerCount,
    updateEconomicSnapshot,
  } = useDashboardStore();

  const {
    data: initialData,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: analyticsApi.getDashboardStats,
    refetchInterval: 30000,
  });

  const {
    data: overviewData = [],
    isError: isOverviewError,
    refetch: refetchOverview,
  } = useQuery({
    queryKey: ['dashboard-overview'],
    queryFn: analyticsApi.getOverviewStats,
    refetchInterval: 60000,
  });

  const { data: resourcesData, isError: isResourcesError } = useQuery({
    queryKey: ['resources-stats', 24],
    queryFn: () => analyticsApi.getResourcesStats(24),
    refetchInterval: 60000,
  });

  useEffect(() => {
    if (initialData) {
      setStats(initialData);
    }
  }, [initialData, setStats]);

  useEffect(() => {
    if (!socket) return undefined;

    const cleanups = [
      subscribe<DashboardStats>('initial-data', (data) => setStats(data)),
      subscribe<RecentEvent>('event:new', (event) => addEvent(event)),
      subscribe<{ onlinePlayers?: number }>('player:online', (payload) => {
        if (typeof payload?.onlinePlayers === 'number') {
          updatePlayerCount(payload.onlinePlayers);
        } else {
          adjustPlayerCount(1);
        }
      }),
      subscribe<{ onlinePlayers?: number }>('player:offline', (payload) => {
        if (typeof payload?.onlinePlayers === 'number') {
          updatePlayerCount(payload.onlinePlayers);
        } else {
          adjustPlayerCount(-1);
        }
      }),
      subscribe<EconomicSnapshot>('economy:update', (data) => updateEconomicSnapshot(data)),
    ];

    return () => {
      cleanups.forEach((unsub) => unsub());
    };
  }, [
    socket,
    subscribe,
    setStats,
    addEvent,
    updatePlayerCount,
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

  if (isError && !stats) {
    return (
      <QueryErrorState
        message="Falha ao sincronizar a telemetria inicial do dashboard."
        onRetry={() => void refetch()}
      />
    );
  }

  const currentStats = stats || initialData;
  const riskAlertsCount = Number(currentStats?.riskAlerts) || 0;
  const rawGrowth = currentStats?.trends?.playerGrowth || '+0.0%';
  const formattedGrowth = rawGrowth.endsWith('%') ? rawGrowth : `${rawGrowth}%`;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="TOTAL DE PILOTOS"
          value={formatNumber(currentStats?.totalPlayers || 0)}
          icon={Users}
          footerLeft="Base cadastrada"
          footerRight={
            <span className="font-mono text-ok">
              {formattedGrowth} (24h)
            </span>
          }
        />

        <MetricCard
          label="ONLINE AGORA"
          value={formatNumber(currentStats?.onlinePlayers || 0)}
          icon={Activity}
          iconClassName="text-ok"
          valueClassName="text-ok"
          footerLeft="Sessões ativas"
          footerRight={
            <span className="font-mono text-ink">
              {currentStats?.trends?.onlineTrend || '0%'} vs 1h
            </span>
          }
        />

        <MetricCard
          label="LIQUIDEZ EM CIRCULAÇÃO"
          value={formatCurrency(currentStats?.economicSnapshot?.moneyInCirc || 0)}
          icon={DollarSign}
          iconClassName="text-brass"
          valueClassName="text-brass"
          footerLeft="Snapshot monetário"
          footerRight={
            <span className="font-mono text-ink-faint">
              Média {formatCurrency(currentStats?.economicSnapshot?.avgPlayerWealth || 0)}
            </span>
          }
        />

        <MetricCard
          label="VOLUME LOJAS & RACHAS (24H)"
          value={isResourcesError ? '—' : formatCurrency(resourcesData?.stats?.totalRevenue || 0)}
          icon={Flag}
          iconClassName="text-signal"
          footerLeft={
            isResourcesError ? (
              <span className="text-signal">Falha ao consultar</span>
            ) : (
              <>
                Rachas:{' '}
                <span className="font-mono text-brass">
                  {formatCurrency(resourcesData?.stats?.raceVolume || 0)}
                </span>
              </>
            )
          }
          footerRight={
            riskAlertsCount > 0 ? (
              <span className="flex items-center gap-1 font-mono text-signal">
                <ShieldAlert className="h-3 w-3" /> {riskAlertsCount} alerta(s)
              </span>
            ) : null
          }
        />
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
                {isOverviewError ? (
                  <QueryErrorState
                    message="Falha ao carregar o comparativo de 7 dias."
                    onRetry={() => void refetchOverview()}
                  />
                ) : (
                  <EconomyOverviewChart data={overviewData} />
                )}
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
