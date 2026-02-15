import {
    Avatar,
    AvatarFallback,
    AvatarImage,
} from "@/components/ui/avatar"

export function RecentActivity({ events }: { events: any[] }) {
    if (!events || events.length === 0) {
        return <div className="text-sm text-muted-foreground">No recent activity</div>
    }

    return (
        <div className="space-y-8">
            {events.slice(0, 5).map((event, i) => (
                <div key={i} className="flex items-center">
                    <Avatar className="h-9 w-9">
                        <AvatarImage src={`https://avatar.vercel.sh/${event.player?.lastUsername || 'unknown'}.png`} alt="Avatar" />
                        <AvatarFallback>{event.player?.lastUsername?.[0]?.toUpperCase() || '?'}</AvatarFallback>
                    </Avatar>
                    <div className="ml-4 space-y-1">
                        <p className="text-sm font-medium leading-none">{event.eventType}</p>
                        <p className="text-sm text-muted-foreground">
                            {event.player?.lastUsername || 'Unknown Player'}
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
