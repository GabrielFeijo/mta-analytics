import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Users, Activity, DollarSign, AlertTriangle } from 'lucide-react';
import { analyticsApi } from '@/lib/api';
import { useAnalyticsSocket } from '@/hooks/useAnalyticsSocket';
import { useDashboardStore } from '@/stores/dashboardStore';
import { formatNumber, formatCurrency } from '@/lib/utils';

export default function Dashboard() {
    const { socket, isConnected, subscribe } = useAnalyticsSocket();
    const { stats, setStats, addEvent, updatePlayerCount } = useDashboardStore();

    const { data: initialData, isLoading } = useQuery({
        queryKey: ['dashboard-stats'],
        queryFn: analyticsApi.getDashboardStats,
        refetchInterval: 30000,
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
                <div className="text-xl">Loading dashboard...</div>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
                    <p className="text-muted-foreground">
                        Real-time server monitoring and insights
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <div
                        className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'
                            }`}
                    />
                    <span className="text-sm">
                        {isConnected ? 'Live' : 'Disconnected'}
                    </span>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatsCard
                    title="Total Players"
                    value={formatNumber(stats?.totalPlayers || 0)}
                    icon={Users}
                    trend={+5.2}
                />
                <StatsCard
                    title="Online Now"
                    value={formatNumber(stats?.onlinePlayers || 0)}
                    icon={Activity}
                    trend={+12.3}
                    highlight
                />
                <StatsCard
                    title="Money in Circulation"
                    value={formatCurrency(stats?.economicSnapshot?.moneyInCirc || 0)}
                    icon={DollarSign}
                    trend={-2.1}
                />
                <StatsCard
                    title="Risk Alerts"
                    value="15"
                    icon={AlertTriangle}
                    trend={+8.5}
                    variant="destructive"
                />
            </div>

            <div className="bg-card border border-border rounded-lg p-6">
                <h2 className="text-xl font-bold mb-4">Recent Events</h2>
                <div className="space-y-2">
                    {stats?.recentEvents?.slice(0, 10).map((event: any, i: number) => (
                        <div key={i} className="flex items-center justify-between p-3 bg-background rounded-lg">
                            <div>
                                <p className="font-medium">{event.eventType}</p>
                                <p className="text-sm text-muted-foreground">
                                    {event.player?.lastUsername || 'Unknown'}
                                </p>
                            </div>
                            <span className="text-xs text-muted-foreground">
                                {new Date(event.timestamp).toLocaleTimeString()}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

interface StatsCardProps {
    title: string;
    value: string;
    icon: any;
    trend?: number;
    highlight?: boolean;
    variant?: 'default' | 'destructive';
}

function StatsCard({ title, value, icon: Icon, trend, highlight, variant = 'default' }: StatsCardProps) {
    return (
        <div className={`bg-card border rounded-lg p-6 ${highlight ? 'border-primary' : 'border-border'}`}>
            <div className="flex items-center justify-between mb-4">
                <span className="text-sm text-muted-foreground">{title}</span>
                <Icon className={`w-5 h-5 ${variant === 'destructive' ? 'text-destructive' : 'text-primary'}`} />
            </div>
            <div className="space-y-1">
                <p className="text-2xl font-bold">{value}</p>
                {trend !== undefined && (
                    <p className={`text-sm ${trend >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {trend >= 0 ? '+' : ''}{trend}% from last week
                    </p>
                )}
            </div>
        </div>
    );
}
