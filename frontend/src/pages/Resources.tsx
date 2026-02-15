import { useQuery } from '@tanstack/react-query';
import { ShoppingCart, Car, DollarSign } from 'lucide-react';
import { economyApi } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TransactionTable } from "@/components/economy/TransactionTable";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Resources() {
    const { data: transactions, isLoading } = useQuery({
        queryKey: ['recent-transactions-resources'],
        queryFn: () => economyApi.getRecentTransactions(100),
        refetchInterval: 30000,
    });

    const vehiclePurchases = transactions?.filter(
        (tx: any) => tx.source === 'Car Shop' || tx.source === 'vehicle_purchase' || tx.metadata?.vehicleModel
    ) || [];

    const shopPurchases = transactions?.filter(
        (tx: any) => (tx.source === 'Shop' || tx.source === 'shop_purchase') && !tx.metadata?.vehicleModel
    ) || [];

    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Resources & Shops</h2>
                    <p className="text-muted-foreground">
                        Monitor asset purchases and shop activity
                    </p>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Starting Vehicle Sales
                        </CardTitle>
                        <Car className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{vehiclePurchases.length}</div>
                        <p className="text-xs text-muted-foreground">
                            Recent purchases
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Shop Revenue
                        </CardTitle>
                        <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            ${shopPurchases.reduce((acc: number, tx: any) => acc + (Math.abs(tx.amount) || 0), 0).toLocaleString()}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Total recent revenue
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
                                <TransactionTable transactions={vehiclePurchases} />
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
                                <TransactionTable transactions={shopPurchases} />
                            }
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
