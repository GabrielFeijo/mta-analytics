import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { useQuery } from "@tanstack/react-query"
import { playersApi } from "@/lib/api"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Player } from "@/lib/types"

interface PlayerDetailsDialogProps {
    playerId: number | null
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function PlayerDetailsDialog({ playerId, open, onOpenChange }: PlayerDetailsDialogProps) {
    const { data: player, isLoading } = useQuery<Player>({
        queryKey: ['player', playerId],
        queryFn: () => playersApi.getPlayer(playerId!),
        enabled: !!playerId && open,
    });

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Detalhes do Jogador</DialogTitle>
                    <DialogDescription>
                        Informações detalhadas e estatísticas.
                    </DialogDescription>
                </DialogHeader>

                {isLoading ? (
                    <div className="py-8 text-center">Carregando dados do jogador...</div>
                ) : player ? (
                    <div className="grid gap-4 py-4">
                        <div className="flex items-center gap-4">
                            <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center text-2xl font-bold">
                                {player.lastUsername?.[0]?.toUpperCase()}
                            </div>
                            <div>
                                <h3 className="font-bold text-lg">{player.lastUsername}</h3>
                                <p className="text-sm text-muted-foreground">{player.serial}</p>
                            </div>
                        </div>

                        <Separator />

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <p className="text-sm font-medium text-muted-foreground">Dinheiro</p>
                                <p className="font-bold text-green-500">${(player.money || 0).toLocaleString()}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-sm font-medium text-muted-foreground">Banco</p>
                                <p className="font-bold text-blue-500">${(player.bank || 0).toLocaleString()}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-sm font-medium text-muted-foreground">Emprego</p>
                                <Badge variant="outline">{player.job || 'Desempregado'}</Badge>
                            </div>
                            <div className="space-y-1">
                                <p className="text-sm font-medium text-muted-foreground">Nível / XP</p>
                                <p className="text-sm font-bold">Lvl {player.level || 1} <span className="text-xs font-normal text-muted-foreground">({player.experience || 0} XP)</span></p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-sm font-medium text-muted-foreground">Fome / Sede</p>
                                <div className="flex gap-2">
                                    <Badge variant={player.hunger < 30 ? "destructive" : "secondary"}>🍖 {Math.floor(player.hunger || 0)}%</Badge>
                                    <Badge variant={player.thirst < 30 ? "destructive" : "secondary"}>💧 {Math.floor(player.thirst || 0)}%</Badge>
                                </div>
                            </div>
                            <div className="space-y-1">
                                <p className="text-sm font-medium text-muted-foreground">Vpoints</p>
                                <p className="font-bold text-yellow-500">{player.premiumPoints || 0} VP</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-sm font-medium text-muted-foreground">Tempo Total</p>
                                <p className="font-bold">{Math.floor((player.totalPlaytime || 0) / 60)}h</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-sm font-medium text-muted-foreground">Score de Risco</p>
                                <Badge variant={player.riskScore > 0.7 ? "destructive" : "secondary"}>
                                    {(player.riskScore * 100).toFixed(0)}%
                                </Badge>
                            </div>
                        </div>

                        <Separator />

                        <div>
                            <h4 className="font-semibold mb-2">Atividade Recente</h4>
                            <ScrollArea className="h-[150px] w-full rounded-md border p-4">
                                {/* Placeholder for activity log - API endpoint might be needed */}
                                <div className="text-sm text-muted-foreground">
                                    Nenhuma atividade recente registrada nesta sessão.
                                </div>
                            </ScrollArea>
                        </div>

                    </div>
                ) : (
                    <div className="py-8 text-center text-muted-foreground">Jogador não encontrado</div>
                )}
            </DialogContent>
        </Dialog>
    )
}
