import { useQuery } from '@tanstack/react-query';
import { ShoppingCart, Car, DollarSign } from 'lucide-react';
import { analyticsApi } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TransactionTable } from "@/components/economy/TransactionTable";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
        totalTransactions: 0,
        vehicleCount: 0,
        shopCount: 0,
    };

    const vehiclePurchases = data?.vehicleSales || [];
    const shopPurchases = data?.shopSales || [];

    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Resources & Shops</h2>
                    <p className="text-muted-foreground">
                        Monitor asset purchases and shop activity (Last 24h)
                    </p>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Vehicle Sales
                        </CardTitle>
                        <Car className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.vehicleCount}</div>
                        <p className="text-xs text-muted-foreground">
                            Revenue: ${stats.vehicleRevenue.toLocaleString()}
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Shop Sales
                        </CardTitle>
                        <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.shopCount}</div>
                        <p className="text-xs text-muted-foreground">
                            Revenue: ${stats.shopRevenue.toLocaleString()}
                        </p>
                    </CardContent>
                </Card>
            </div>

            <Tabs defaultValue="vehicles" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="vehicles">Vehicle Sales</TabsTrigger>
                    <TabsTrigger value="shops">Shop Activity</TabsTrigger>
                </TabsList>
                <TabsContent value="vehicles" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Recent Vehicle Purchases</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {isLoading ? <div>Loading...</div> :
                                <TransactionTable transactions={vehiclePurchases.map((tx: any) => ({
                                    id: tx.id,
                                    type: 'SPEND',
                                    amount: tx.amount,
                                    source: tx.vehicleName || 'Car Shop',
                                    timestamp: tx.timestamp,
                                    player: { lastUsername: tx.player },
                                    newBalance: 0
                                }))} />
                            }
                        </CardContent>
                    </Card>
                </TabsContent>
                <TabsContent value="shops" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Recent Shop Purchases</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {isLoading ? <div>Loading...</div> :
                                <TransactionTable transactions={shopPurchases.map((tx: any) => ({
                                    id: tx.id,
                                    type: 'SPEND',
                                    amount: tx.amount,
                                    source: tx.itemName || 'Shop',
                                    timestamp: tx.timestamp,
                                    player: { lastUsername: tx.player },
                                    newBalance: 0
                                }))} />
                            }
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
