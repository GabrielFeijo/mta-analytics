import {
    Avatar,
    AvatarFallback,
    AvatarImage,
} from "@/components/ui/avatar"

export function RecentActivity({ events }: { events: any[] }) {
    if (!events || events.length === 0) {
        return <div className="text-sm text-muted-foreground">Nenhuma atividade recente</div>
    }

    const getEventTranslation = (type: string) => {
        const types: Record<string, string> = {
            'player_join': 'Entrou no servidor',
            'player_quit': 'Saiu do servidor',
            'player_death': 'Morreu',
            'player_spawn': 'Nasceu',
            'transaction': 'Transação bancária',
            'vehicle_purchase': 'Comprou veículo',
            'shop_purchase': 'Comprou item',
            'risk_alert': 'Alerta de risco'
        };
        return types[type] || type;
    };

    return (
        <div className="space-y-8">
            {events.slice(0, 5).map((event, i) => (
                <div key={i} className="flex items-center">
                    <Avatar className="h-9 w-9">
                        <AvatarImage src={`https://avatar.vercel.sh/${event.player?.lastUsername || 'unknown'}.png`} alt="Avatar" />
                        <AvatarFallback>{event.player?.lastUsername?.[0]?.toUpperCase() || '?'}</AvatarFallback>
                    </Avatar>
                    <div className="ml-4 space-y-1">
                        <p className="text-sm font-medium leading-none">{getEventTranslation(event.eventType)}</p>
                        <p className="text-sm text-muted-foreground">
                            {event.player?.lastUsername || 'Jogador Desconhecido'}
                        </p>
                    </div>
                    <div className="ml-auto font-medium">
                        {new Date(event.timestamp).toLocaleTimeString()}
                    </div>
                </div>
            ))}
        </div>
    )
}
