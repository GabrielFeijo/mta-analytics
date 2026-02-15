import { useQuery } from '@tanstack/react-query';
import { TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import { economyApi } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';

export default function Economy() {
    const { data: snapshot, isLoading } = useQuery({
        queryKey: ['economy-snapshot'],
        queryFn: economyApi.getSnapshot,
        refetchInterval: 30000,
    });

    const { data: transactions } = useQuery({
        queryKey: ['recent-transactions'],
        queryFn: () => economyApi.getTimeSeries('totalMoney', '24h'),
    });

    return (
        <div className="p-6 space-y-6">
            <div>
                <h1 className="text-3xl font-bold">Economy</h1>
                <p className="text-muted-foreground">
                    Monitor server economy and transactions
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <MetricCard
                    title="Total Money"
                    value={formatCurrency(snapshot?.totalMoney || 0)}
                    icon={DollarSign}
                    trend={snapshot?.inflationRate}
                />
                <MetricCard
                    title="Money in Circulation"
                    value={formatCurrency(snapshot?.moneyInCirc || 0)}
                    icon={TrendingUp}
                />
                <MetricCard
                    title="Avg Player Wealth"
                    value={formatCurrency(snapshot?.avgPlayerWealth || 0)}
                    icon={DollarSign}
                />
            </div>

            <div className="bg-card border border-border rounded-lg p-6">
                <h2 className="text-xl font-bold mb-4">Recent Transactions</h2>
                {isLoading ? (
                    <p className="text-center text-muted-foreground py-8">Loading...</p>
                ) : (
                    <div className="space-y-2">
                        {transactions?.slice(0, 10).map((tx: any, i: number) => (
                            <div key={i} className="flex items-center justify-between p-3 bg-background rounded-lg">
                                <div className="flex items-center gap-3">
                                    {tx.value > 0 ? (
                                        <TrendingUp className="w-5 h-5 text-green-500" />
                                    ) : (
                                        <TrendingDown className="w-5 h-5 text-red-500" />
                                    )}
                                    <div>
                                        <p className="font-medium">
                                            {formatCurrency(Math.abs(tx.value))}
                                        </p>
                                        <p className="text-sm text-muted-foreground">
                                            {new Date(tx.timestamp).toLocaleString()}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

interface MetricCardProps {
    title: string;
    value: string;
    icon: any;
    trend?: number;
}

function MetricCard({ title, value, icon: Icon, trend }: MetricCardProps) {
    return (
        <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
                <span className="text-sm text-muted-foreground">{title}</span>
                <Icon className="w-5 h-5 text-primary" />
            </div>
            <div className="space-y-1">
                <p className="text-2xl font-bold">{value}</p>
                {trend !== undefined && (
                    <p className={`text-sm ${trend >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {trend >= 0 ? '+' : ''}{trend.toFixed(2)}% inflation
                    </p>
                )}
            </div>
        </div>
    );
}
