import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Eye } from 'lucide-react';
import { Player } from '@/lib/types';
import { formatCurrency, formatDate, formatPlaytimeHours } from '@/lib/utils';

interface PlayerTableProps {
  players: Player[];
  onViewPlayer: (player: Player) => void;
}

export function PlayerTable({ players, onViewPlayer }: PlayerTableProps) {
  if (!players || players.length === 0) {
    return (
      <div className="py-10 text-center text-xs text-ink-dim">
        Nenhum jogador encontrado para o filtro informado.
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>ID / Piloto</TableHead>
          <TableHead>Nível</TableHead>
          <TableHead>Ocupação / Facção</TableHead>
          <TableHead>Patrimônio (Mão + Banco)</TableHead>
          <TableHead>Serial MTA</TableHead>
          <TableHead>Risco</TableHead>
          <TableHead className="text-right">Tempo Ativo</TableHead>
          <TableHead className="text-right">Último Pulso</TableHead>
          <TableHead className="w-[48px]" />
        </TableRow>
      </TableHeader>
      <TableBody>
        {players.map((player) => {
          const riskPct = Math.round((Number(player.riskScore) || 0) * 100);
          const riskVariant =
            riskPct >= 70 ? 'default' : riskPct >= 30 ? 'warn' : 'ok';
          const totalWealth = (Number(player.money) || 0) + (Number(player.bank) || 0);

          return (
            <TableRow key={player.id}>
              <TableCell className="whitespace-nowrap">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-2xs tabular-nums text-ink-faint">
                    #{player.characterId || player.id}
                  </span>
                  <span className="font-medium text-ink">
                    {player.lastUsername || 'Desconhecido'}
                  </span>
                </div>
              </TableCell>
              <TableCell className="whitespace-nowrap font-mono tabular-nums text-brass">
                Lv.{player.level || 1}
              </TableCell>
              <TableCell className="max-w-[180px] truncate text-ink-dim">
                <span>{player.job || 'Desempregado'}</span>
                {player.faction && (
                  <span className="ml-1.5 font-mono text-2xs text-ink-faint">
                    [{player.faction}]
                  </span>
                )}
              </TableCell>
              <TableCell className="whitespace-nowrap font-mono tabular-nums text-brass">
                {formatCurrency(totalWealth)}
              </TableCell>
              <TableCell>
                <code className="rounded-sm border border-line bg-bg2 px-1.5 py-0.5 font-mono text-2xs text-ink-dim">
                  {player.serial.substring(0, 12)}…
                </code>
              </TableCell>
              <TableCell>
                <Badge variant={riskVariant} className="font-mono tabular-nums">
                  {riskPct}%
                </Badge>
              </TableCell>
              <TableCell className="whitespace-nowrap text-right font-mono tabular-nums text-ink-dim">
                {formatPlaytimeHours(player.totalPlaytime || player.playedTime)}
              </TableCell>
              <TableCell className="whitespace-nowrap text-right font-mono text-2xs tabular-nums text-ink-faint">
                {formatDate(player.lastSeen)}
              </TableCell>
              <TableCell className="text-right">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => onViewPlayer(player)}
                  title="Inspecionar telemetria do jogador"
                >
                  <Eye className="h-3.5 w-3.5" strokeWidth={1.75} />
                </Button>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
