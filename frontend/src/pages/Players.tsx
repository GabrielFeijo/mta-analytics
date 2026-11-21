import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, Users } from 'lucide-react';
import { playersApi } from '@/lib/api';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PlayerTable } from '@/components/players/PlayerTable';
import { PlayerDetailsDialog } from '@/components/players/PlayerDetailsDialog';
import { Player } from '@/lib/types';

export default function Players() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPlayerId, setSelectedPlayerId] = useState<number | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const { data: onlinePlayers = [], isLoading } = useQuery({
    queryKey: ['online-players'],
    queryFn: playersApi.getOnlinePlayers,
    refetchInterval: 10000,
  });

  const { data: searchResults = [] } = useQuery({
    queryKey: ['search-players', searchQuery],
    queryFn: () => playersApi.searchPlayers(searchQuery),
    enabled: searchQuery.trim().length > 1,
  });

  const displayPlayers =
    searchQuery.trim().length > 1 ? searchResults : onlinePlayers;

  const handleViewPlayer = (player: Player) => {
    setSelectedPlayerId(player.id);
    setDetailsOpen(true);
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-4 w-4 text-brass" strokeWidth={1.75} />
              Monitoramento de Pilotos & Sessões
            </CardTitle>
            <CardDescription>
              Auditoria de patrimônio, ocupação, serial MTA e score de anomalia.
            </CardDescription>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative w-64 sm:w-80">
              <Search
                className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-faint"
                strokeWidth={1.75}
              />
              <Input
                type="text"
                placeholder="Filtrar por nome, serial ou ocupação…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
              />
            </div>

            <Badge variant="ok" className="font-mono">
              {displayPlayers.length} listado(s)
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {isLoading ? (
            <div className="py-12 text-center text-xs text-ink-dim">
              Sincronizando lista de jogadores…
            </div>
          ) : (
            <PlayerTable players={displayPlayers} onViewPlayer={handleViewPlayer} />
          )}
        </CardContent>
      </Card>

      <PlayerDetailsDialog
        playerId={selectedPlayerId}
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
      />
    </div>
  );
}
