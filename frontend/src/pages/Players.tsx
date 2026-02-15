import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search } from 'lucide-react';
import { playersApi } from '@/lib/api';

export default function Players() {
    const [searchQuery, setSearchQuery] = useState('');

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

    return (
        <div className="p-6 space-y-6">
            <div>
                <h1 className="text-3xl font-bold">Players</h1>
                <p className="text-muted-foreground">
                    Manage and monitor player activity
                </p>
            </div>

            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                    type="text"
                    placeholder="Search players by name or serial..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
            </div>

            <div className="bg-card border border-border rounded-lg overflow-hidden">
                <table className="w-full">
                    <thead className="bg-muted">
                        <tr>
                            <th className="px-6 py-3 text-left text-sm font-medium">Player</th>
                            <th className="px-6 py-3 text-left text-sm font-medium">Serial</th>
                            <th className="px-6 py-3 text-left text-sm font-medium">Last Seen</th>
                            <th className="px-6 py-3 text-left text-sm font-medium">Risk Score</th>
                            <th className="px-6 py-3 text-left text-sm font-medium">Playtime</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {isLoading ? (
                            <tr>
                                <td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">
                                    Loading players...
                                </td>
                            </tr>
                        ) : displayPlayers?.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">
                                    No players found
                                </td>
                            </tr>
                        ) : (
                            displayPlayers?.map((player: any) => (
                                <tr key={player.id} className="hover:bg-accent/50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="font-medium">{player.lastUsername || 'Unknown'}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <code className="text-xs bg-muted px-2 py-1 rounded">
                                            {player.serial.substring(0, 16)}...
                                        </code>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-muted-foreground">
                                        {new Date(player.lastSeen).toLocaleString()}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span
                                            className={`inline-flex px-2 py-1 text-xs font-medium rounded ${player.riskScore > 0.7
                                                ? 'bg-red-500/10 text-red-500'
                                                : player.riskScore > 0.3
                                                    ? 'bg-yellow-500/10 text-yellow-500'
                                                    : 'bg-green-500/10 text-green-500'
                                                }`}
                                        >
                                            {(player.riskScore * 100).toFixed(0)}%
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-muted-foreground">
                                        {Math.floor((player.totalPlaytime || 0) / 60)}h
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
