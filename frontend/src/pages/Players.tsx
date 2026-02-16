import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search } from 'lucide-react';
import { playersApi } from '@/lib/api';
import { Input } from "@/components/ui/input"
import { PlayerTable } from "@/components/players/PlayerTable"
import { PlayerDetailsDialog } from "@/components/players/PlayerDetailsDialog"

export default function Players() {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedPlayerId, setSelectedPlayerId] = useState<number | null>(null);
    const [detailsOpen, setDetailsOpen] = useState(false);

    const { data: onlinePlayers, isLoading } = useQuery({
        queryKey: ['online-players'],
        queryFn: playersApi.getOnlinePlayers,
        refetchInterval: 10000,
    });

    const { data: searchResults } = useQuery({
        queryKey: ['search-players', searchQuery],
        queryFn: () => playersApi.searchPlayers(searchQuery),
        enabled: searchQuery.length > 2,
    });

    const displayPlayers = searchQuery.length > 2 ? searchResults : onlinePlayers;

    const handleViewPlayer = (player: any) => {
        setSelectedPlayerId(player.id);
        setDetailsOpen(true);
    };

    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Jogadores</h2>
                    <p className="text-muted-foreground">
                        Gerencie e monitore a atividade dos jogadores
                    </p>
                </div>
            </div>

            <div className="flex items-center space-x-2">
                <Search className="w-5 h-5 text-muted-foreground" />
                <Input
                    type="text"
                    placeholder="Buscar jogadores por nome ou serial..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="max-w-sm"
                />
            </div>

            <div className="rounded-md border">
                {isLoading ? (
                    <div className="p-8 text-center text-muted-foreground">Carregando jogadores...</div>
                ) : (
                    <PlayerTable players={displayPlayers || []} onViewPlayer={handleViewPlayer} />
                )}
            </div>

            <PlayerDetailsDialog
                playerId={selectedPlayerId}
                open={detailsOpen}
                onOpenChange={setDetailsOpen}
            />
        </div>
    );
}
