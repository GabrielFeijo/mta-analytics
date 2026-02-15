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

interface PlayerDetailsDialogProps {
    playerId: number | null
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function PlayerDetailsDialog({ playerId, open, onOpenChange }: PlayerDetailsDialogProps) {
    const { data: player, isLoading } = useQuery({
        queryKey: ['player', playerId],
        queryFn: () => playersApi.getPlayer(playerId!),
        enabled: !!playerId && open,
    });

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Player Details</DialogTitle>
                    <DialogDescription>
                        Detailed information and statistics.
                    </DialogDescription>
                </DialogHeader>

                {isLoading ? (
                    <div className="py-8 text-center">Loading player data...</div>
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
                                <p className="text-sm font-medium text-muted-foreground">Total Playtime</p>
                                <p className="font-bold">{Math.floor((player.totalPlaytime || 0) / 60)}h</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-sm font-medium text-muted-foreground">Risk Score</p>
                                <Badge variant={player.riskScore > 0.7 ? "destructive" : "secondary"}>
                                    {(player.riskScore * 100).toFixed(0)}%
                                </Badge>
                            </div>
                            <div className="space-y-1">
                                <p className="text-sm font-medium text-muted-foreground">Last Seen</p>
                                <p className="text-sm">{new Date(player.lastSeen).toLocaleString()}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-sm font-medium text-muted-foreground">IP Address</p>
                                <p className="text-sm font-mono">{player.ip || 'Hidden'}</p>
                            </div>
                        </div>

                        <Separator />

                        <div>
                            <h4 className="font-semibold mb-2">Recent Activity</h4>
                            <ScrollArea className="h-[150px] w-full rounded-md border p-4">
                                {/* Placeholder for activity log - API endpoint might be needed */}
                                <div className="text-sm text-muted-foreground">
                                    No recent activity recorded in this session.
                                </div>
                            </ScrollArea>
                        </div>

                    </div>
                ) : (
                    <div className="py-8 text-center text-muted-foreground">Player not found</div>
                )}
            </DialogContent>
        </Dialog>
    )
}
