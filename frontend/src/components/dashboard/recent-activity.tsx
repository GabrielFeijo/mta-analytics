import { Badge } from '@/components/ui/badge';
import { formatCurrency, formatTime } from '@/lib/formatters';
import { RecentEvent } from '@/types/telemetry';

const EVENT_META: Record<
  string,
  { label: string; variant: 'brass' | 'ok' | 'default' | 'warn' | 'secondary' }
> = {
  player_join: { label: 'CONEXÃO', variant: 'ok' },
  player_quit: { label: 'DESCONEXÃO', variant: 'secondary' },
  player_wasted: { label: 'ÓBITO / COMBATE', variant: 'default' },
  player_damage: { label: 'DANO', variant: 'warn' },
  player_spawn: { label: 'SPAWN', variant: 'secondary' },
  player_transaction: { label: 'TRANSAÇÃO', variant: 'brass' },
  player_money_change: { label: 'SALDO', variant: 'brass' },
  vehicle_purchase: { label: 'CONCESSIONÁRIA', variant: 'brass' },
  shop_purchase: { label: 'LOJA', variant: 'secondary' },
  fine_issued: { label: 'MULTA RADAR', variant: 'default' },
  initial_player_sync: { label: 'LOGIN SYNC', variant: 'ok' },
  player_status_sync: { label: 'TELEMETRIA', variant: 'secondary' },
};

export function RecentActivity({ events }: { events: RecentEvent[] }) {
  if (!events || events.length === 0) {
    return (
      <div className="py-10 text-center text-xs text-ink-dim">
        Nenhuma atividade registrada recentemente.
      </div>
    );
  }

  return (
    <div className="divide-y divide-line/60">
      {events.slice(0, 7).map((event, i) => {
        const meta = EVENT_META[event.eventType] || {
          label: String(event.eventType || 'EVENTO').toUpperCase(),
          variant: 'secondary' as const,
        };
        const username = event.player?.lastUsername || event.playerName || 'Jogador';
        const data = event.data || {};
        const rawAmount = data.amount ?? data.price;
        const amount = rawAmount !== undefined && rawAmount !== null ? Number(rawAmount) : undefined;
        const sourceRes = typeof data.source_resource === 'string' ? data.source_resource : undefined;

        return (
          <div
            key={event.id || i}
            className="flex items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0"
          >
            <div className="flex min-w-0 items-center gap-2.5">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-sm border border-line bg-bg2 font-mono text-xs font-semibold text-brass">
                {username[0]?.toUpperCase() || '?'}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="truncate text-[13px] font-medium text-ink">
                    {username}
                  </span>
                  <Badge variant={meta.variant}>{meta.label}</Badge>
                </div>
                <div className="mt-0.5 flex items-center gap-2 text-2xs text-ink-dim">
                  {sourceRes && (
                    <span className="font-mono text-ink-faint">[{sourceRes}]</span>
                  )}
                  {amount !== undefined && Number.isFinite(amount) ? (
                    <span className="font-mono tabular-nums text-brass">
                      {formatCurrency(amount)}
                    </span>
                  ) : event.positionX !== undefined && event.positionX !== null ? (
                    <span className="font-mono tabular-nums text-ink-faint">
                      X:{Math.round(event.positionX)} Y:{Math.round(event.positionY ?? 0)}
                    </span>
                  ) : (
                    <span>Telemetria registrada</span>
                  )}
                </div>
              </div>
            </div>

            <span className="shrink-0 font-mono text-2xs tabular-nums text-ink-faint">
              {formatTime(event.timestamp)}
            </span>
          </div>
        );
      })}
    </div>
  );
}
