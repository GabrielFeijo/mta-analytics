import { useQuery } from '@tanstack/react-query';
import { TrendingUp, DollarSign } from 'lucide-react';
import { economyApi } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TransactionTable } from "@/components/economy/TransactionTable";

export default function Economy() {
    const { data: snapshot, isLoading } = useQuery({
        queryKey: ['economy-snapshot'],
        queryFn: economyApi.getSnapshot,
        refetchInterval: 30000,
    });

    const { data: transactions, isLoading: isTxLoading } = useQuery({
        queryKey: ['recent-transactions'],
        // Using the new endpoint we just added
        queryFn: () => economyApi.getRecentTransactions(20),
        refetchInterval: 10000,
    });

    if (isLoading) {
        return <div className="p-8">Loading economy stats...</div>
    }

    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">Economy</h2>
                <div className="flex items-center space-x-2">

                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Total Money
                        </CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatCurrency(snapshot?.totalMoney || 0)}</div>
                        <p className={`text-xs ${snapshot?.inflationRate >= 0 ? "text-red-500" : "text-green-500"}`}>
                            Inflation: {snapshot?.inflationRate}%
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Money in Circulation
                        </CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatCurrency(snapshot?.moneyInCirc || 0)}</div>
                        <p className="text-xs text-muted-foreground">
                            Liquid cash usually
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Avg Player Wealth
                        </CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatCurrency(snapshot?.avgPlayerWealth || 0)}</div>
                        <p className="text-xs text-muted-foreground">
                            Per active player
                        </p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-1">
                <Card>
                    <CardHeader>
                        <CardTitle>Recent Transactions</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {isTxLoading ? <div>Loading transactions...</div> :
                            <TransactionTable transactions={transactions || []} />
                        }
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
