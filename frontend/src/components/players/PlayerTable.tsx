import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Eye } from "lucide-react"
import { Player } from "@/lib/types"

interface PlayerTableProps {
    players: Player[]
    onViewPlayer: (player: Player) => void
}

export function PlayerTable({ players, onViewPlayer }: PlayerTableProps) {
    if (!players || players.length === 0) {
        return <div className="text-center py-8 text-muted-foreground">Nenhum jogador encontrado</div>
    }

    return (
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Usuário</TableHead>
                        <TableHead>Nível</TableHead>
                        <TableHead>Emprego</TableHead>
                        <TableHead>Serial</TableHead>
                        <TableHead>Visto por último</TableHead>
                        <TableHead>Risco</TableHead>
                        <TableHead className="text-right">Tempo de Jogo</TableHead>
                        <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {players.map((player) => (
                        <TableRow key={player.id}>
                            <TableCell className="font-medium max-w-[150px] truncate" title={player.lastUsername || "Desconhecido"}>
                                {player.lastUsername || "Desconhecido"}
                            </TableCell>
                            <TableCell>{player.level || 1}</TableCell>
                            <TableCell className="max-w-[120px] truncate" title={player.job || "Desempregado"}>{player.job || "Desempregado"}</TableCell>
                            <TableCell>
                                <code className="relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-xs font-semibold">
                                    {player.serial.substring(0, 12)}...
                                </code>
                            </TableCell>
                            <TableCell>{new Date(player.lastSeen).toLocaleDateString()}</TableCell>
                            <TableCell>
                                <Badge variant={player.riskScore > 0.7 ? "destructive" : player.riskScore > 0.3 ? "secondary" : "outline"}>
                                    {(player.riskScore * 100).toFixed(0)}%
                                </Badge>
                            </TableCell>
                            <TableCell className="text-right">{Math.floor((player.totalPlaytime || 0) / 60)}h</TableCell>
                            <TableCell>
                                <Button variant="ghost" size="icon" onClick={() => onViewPlayer(player)}>
                                    <Eye className="h-4 w-4" />
                                </Button>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    )
}
