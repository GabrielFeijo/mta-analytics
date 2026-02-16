import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Users, Activity, DollarSign, AlertTriangle } from 'lucide-react';
import { analyticsApi } from '@/lib/api';
import { useAnalyticsSocket } from '@/hooks/useAnalyticsSocket';
import { useDashboardStore } from '@/stores/dashboardStore';
import { formatNumber, formatCurrency } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Overview } from "@/components/dashboard/Overview";
import { RecentActivity } from "@/components/dashboard/RecentActivity";
import { HeatmapView } from "@/components/dashboard/HeatmapView";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Dashboard() {
    const { socket, isConnected, subscribe } = useAnalyticsSocket();
    const { stats, setStats, addEvent, updatePlayerCount } = useDashboardStore();

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
            updatePlayerCount((stats?.onlinePlayers || 0) + 1);
        });

        subscribe('player:offline', () => {
            updatePlayerCount(Math.max((stats?.onlinePlayers || 0) - 1, 0));
        });

        subscribe('economy:update', (data) => {
            setStats({
                ...stats!,
                economicSnapshot: data,
            });
        });
    }, [socket, isConnected, subscribe]);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="text-xl">Carregando painel...</div>
            </div>
        );
    }

    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">Painel</h2>
                <div className="flex items-center space-x-2">
                    <div className={`flex items-center gap-2 px-3 py-1 rounded-full border ${isConnected ? 'bg-green-500/10 border-green-500/20 text-green-500' : 'bg-red-500/10 border-red-500/20 text-red-500'}`}>
                        <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
                        <span className="text-sm font-medium">{isConnected ? 'Ao Vivo' : 'desconectado'}</span>
                    </div>
                </div>
            </div>
            <Tabs defaultValue="overview" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="overview">Visão Geral</TabsTrigger>
                    <TabsTrigger value="heatmap">Mapa de Calor</TabsTrigger>
                </TabsList>
                <TabsContent value="overview" className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">
                                    Total de Jogadores
                                </CardTitle>
                                <Users className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{formatNumber(stats?.totalPlayers || 0)}</div>
                                <p className="text-xs text-muted-foreground">
                                    {stats?.trends?.playerGrowth || 0}% alteração (24h)
                                </p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">
                                    Online Agora
                                </CardTitle>
                                <Activity className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{formatNumber(stats?.onlinePlayers || 0)}</div>
                                <p className="text-xs text-muted-foreground">
                                    {stats?.trends?.onlineTrend || "+0%"} vs última hora
                                </p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Dinheiro em Circulação</CardTitle>
                                <DollarSign className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{formatCurrency(stats?.economicSnapshot?.moneyInCirc || 0)}</div>
                                <p className="text-xs text-muted-foreground">
                                    Instantâneo da Economia
                                </p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">
                                    Alertas de Risco
                                </CardTitle>
                                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{stats?.riskAlerts || 0}</div>
                                <p className="text-xs text-muted-foreground">
                                    Atividades suspeitas
                                </p>
                            </CardContent>
                        </Card>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                        <Card className="col-span-4">
                            <CardHeader>
                                <CardTitle>Visão Geral de Receita</CardTitle>
                            </CardHeader>
                            <CardContent className="pl-2">
                                <Overview data={overviewData || []} />
                            </CardContent>
                        </Card>
                        <Card className="col-span-3">
                            <CardHeader>
                                <CardTitle>Atividade Recente</CardTitle>
                                <CardDescription>
                                    Eventos ao vivo do servidor.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <RecentActivity events={stats?.recentEvents || []} />
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
