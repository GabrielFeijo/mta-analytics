import { useQuery } from '@tanstack/react-query';
import { FileWarning, DollarSign, Users, Calendar } from 'lucide-react';
import { analyticsApi } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export default function Fines() {
    const { data: stats, isLoading } = useQuery({
        queryKey: ['fines-stats'],
        queryFn: () => analyticsApi.getFinesStats(24),
        refetchInterval: 10000,
    });

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-xl animate-pulse">Carregando estatísticas de multas...</div>
            </div>
        );
    }

    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Análise de Multas</h2>
                    <p className="text-muted-foreground">
                        Monitoramento de infrações e arrecadação de multas de trânsito.
                    </p>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
                <Card className="bg-gradient-to-br from-card to-destructive/5 border-destructive/20 shadow-lg">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
                            Total de Multas (24h)
                        </CardTitle>
                        <FileWarning className="h-4 w-4 text-destructive" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">{stats?.summary?.totalFines || 0}</div>
                        <p className="text-xs text-muted-foreground mt-1">Infrações registradas no radar</p>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-card to-primary/5 border-primary/20 shadow-lg">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
                            Arrecadação Total (24h)
                        </CardTitle>
                        <DollarSign className="h-4 w-4 text-primary" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-primary">
                            {formatCurrency(stats?.summary?.totalAmount || 0)}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">Volume financeiro acumulado</p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <Card className="col-span-5">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Calendar className="h-5 w-5" />
                            Multas Recentes
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Jogador</TableHead>
                                    <TableHead>Placa</TableHead>
                                    <TableHead>Motivo</TableHead>
                                    <TableHead>Valor</TableHead>
                                    <TableHead className="text-right">Data</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {stats?.recentFines?.map((fine: any) => (
                                    <TableRow key={fine.id}>
                                        <TableCell className="font-medium">{fine.player}</TableCell>
                                        <TableCell>
                                            <span className="bg-accent px-2 py-0.5 rounded text-xs font-mono border border-border">
                                                {fine.plate}
                                            </span>
                                        </TableCell>
                                        <TableCell className="max-w-[200px] truncate" title={fine.reason}>
                                            {fine.reason}
                                        </TableCell>
                                        <TableCell className="text-destructive font-semibold">
                                            {formatCurrency(fine.amount)}
                                        </TableCell>
                                        <TableCell className="text-right text-muted-foreground text-xs">
                                            {formatDate(fine.timestamp)}
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {(!stats?.recentFines || stats.recentFines.length === 0) && (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">
                                            Nenhuma multa registrada nas últimas 24h.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                <Card className="col-span-2">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Users className="h-5 w-5" />
                            Reincidentes
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {stats?.topPlayers?.map((player: any, index: number) => (
                                <div key={player.username} className="flex items-center justify-between p-3 rounded-lg bg-accent/30 border border-border/50">
                                    <div className="flex items-center gap-3">
                                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold text-sm">
                                            #{index + 1}
                                        </div>
                                        <div>
                                            <p className="font-semibold text-sm">{player.username}</p>
                                            <p className="text-xs text-muted-foreground">{player.count} multas</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold text-destructive">{formatCurrency(player.totalAmount)}</p>
                                    </div>
                                </div>
                            ))}
                            {(!stats?.topPlayers || stats.topPlayers.length === 0) && (
                                <div className="text-center py-10 text-muted-foreground">
                                    Sem dados suficientes.
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
