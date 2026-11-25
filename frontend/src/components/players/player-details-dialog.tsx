import { useQuery } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { TelemetryMeter } from './telemetry-meter';
import { analyticsApi } from '@/services/analytics-api';
import { playersApi } from '@/services/players-api';
import { Player, PlayerActivityEvent } from '@/types/telemetry';
import { QueryErrorState } from '@/components/common/query-error-state';
import {
  formatCurrency,
  formatPlaytimeHours,
  formatTime,
  resolvePlayerPlaytime,
} from '@/lib/formatters';

interface PlayerDetailsDialogProps {
  playerId: number | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PlayerDetailsDialog({
  playerId,
  open,
  onOpenChange,
}: PlayerDetailsDialogProps) {
  const {
    data: player,
    isLoading,
    isError,
    refetch,
  } = useQuery<Player>({
    queryKey: ['player', playerId],
    queryFn: () => playersApi.getPlayer(playerId!),
    enabled: Boolean(playerId) && open,
  });

  const { data: activity = [] } = useQuery<PlayerActivityEvent[]>({
    queryKey: ['player-activity', playerId],
    queryFn: () => analyticsApi.getPlayerActivity(playerId!, 24),
    enabled: Boolean(playerId) && open,
  });

  const riskPct = Math.round((Number(player?.riskScore) || 0) * 100);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[540px]">
        <DialogHeader>
          <DialogTitle>Ficha de Telemetria do Piloto</DialogTitle>
          <DialogDescription>
            Auditoria financeira, status vital e histórico de eventos nas últimas 24h.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="py-10 text-center text-xs text-ink-dim">
            Carregando telemetria do jogador…
          </div>
        ) : isError ? (
          <QueryErrorState
            message="Falha ao carregar os dados de telemetria deste piloto."
            onRetry={() => void refetch()}
          />
        ) : player ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-3 rounded-sm border border-line bg-bg2 p-3">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-sm border border-line-strong bg-bg3 font-display text-xl font-bold text-brass">
                  {player.lastUsername?.[0]?.toUpperCase() || '?'}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="truncate text-sm font-semibold text-ink">
                      {player.lastUsername || 'Desconhecido'}
                    </h3>
                    <Badge variant="brass" className="font-mono">
                      ID #{player.characterId || player.id}
                    </Badge>
                  </div>
                  <p className="mt-0.5 truncate font-mono text-2xs text-ink-faint">
                    {player.serial}
                  </p>
                </div>
              </div>

              <Badge variant={riskPct >= 70 ? 'default' : riskPct >= 30 ? 'warn' : 'ok'}>
                Risco {riskPct}%
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
              <div className="rounded-sm border border-line bg-bg2 p-2.5">
                <div className="text-2xs text-ink-faint">Dinheiro em Mãos</div>
                <div className="mt-0.5 font-mono text-[13px] font-medium tabular-nums text-ok">
                  {formatCurrency(player.money || 0)}
                </div>
                {(player.dirtyMoney ?? 0) > 0 && (
                  <div className="mt-0.5 font-mono text-[10px] text-warn">
                    {formatCurrency(player.dirtyMoney || 0)} sujo
                  </div>
                )}
              </div>
              <div className="rounded-sm border border-line bg-bg2 p-2.5">
                <div className="text-2xs text-ink-faint">Saldo Bancário</div>
                <div className="mt-0.5 font-mono text-[13px] font-medium tabular-nums text-brass">
                  {formatCurrency(player.bank || 0)}
                </div>
              </div>
              <div className="rounded-sm border border-line bg-bg2 p-2.5">
                <div className="text-2xs text-ink-faint">Nível / XP</div>
                <div className="mt-0.5 font-mono text-[13px] font-medium tabular-nums text-ink">
                  Lv.{player.level || 1}{' '}
                  <span className="text-2xs text-ink-faint">({player.experience || 0})</span>
                </div>
              </div>
              <div className="rounded-sm border border-line bg-bg2 p-2.5">
                <div className="text-2xs text-ink-faint">VPoints / Tempo</div>
                <div className="mt-0.5 font-mono text-[13px] font-medium tabular-nums text-brass">
                  {player.premiumPoints || 0} VP ·{' '}
                  <span className="text-ink">
                    {formatPlaytimeHours(resolvePlayerPlaytime(player))}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 rounded-sm border border-line bg-bg2 p-3 sm:grid-cols-2">
              <div className="space-y-2">
                <div className="text-2xs font-medium uppercase tracking-wider text-ink-faint">
                  Status Vital & Risco
                </div>
                <TelemetryMeter label="Saciedade" value={player.hunger ?? 100} />
                <TelemetryMeter label="Hidratação" value={player.thirst ?? 100} />
                <TelemetryMeter
                  label="Anomalia"
                  value={riskPct}
                  tone={riskPct >= 70 ? 'signal' : riskPct >= 30 ? 'warn' : 'ok'}
                />
              </div>

              <div className="space-y-1.5 border-t border-line pt-2 sm:border-l sm:border-t-0 sm:pl-3 sm:pt-0">
                <div className="text-2xs font-medium uppercase tracking-wider text-ink-faint">
                  Vínculo Operacional
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-ink-dim">Ocupação</span>
                  <span className="font-medium text-ink">{player.job || 'Desempregado'}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-ink-dim">Facção / Equipe</span>
                  <span className="font-mono text-brass">{player.faction || 'Civil'}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-ink-dim">Status Conta</span>
                  <span className={player.isBanned ? 'text-signal' : 'text-ok'}>
                    {player.isBanned ? 'Bloqueado' : 'Regular'}
                  </span>
                </div>
              </div>
            </div>

            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-ink-dim">
                  Timeline de Eventos (24h)
                </h4>
                <span className="font-mono text-2xs text-ink-faint">
                  {activity.length} registros
                </span>
              </div>
              <div className="max-h-[150px] space-y-1.5 overflow-y-auto rounded-sm border border-line bg-bg0 p-2.5">
                {activity.length === 0 ? (
                  <div className="py-4 text-center text-2xs text-ink-dim">
                    Nenhuma atividade registrada nesta janela.
                  </div>
                ) : (
                  activity.map((ev, idx) => {
                    const desc = ev.data?.description;
                    const vehicle = ev.data?.vehicleName;
                    const label =
                      (typeof desc === 'string' && desc) ||
                      (typeof vehicle === 'string' && vehicle) ||
                      (ev.positionX !== undefined && ev.positionX !== null
                        ? `Posição X:${Math.round(ev.positionX)} Y:${Math.round(ev.positionY ?? 0)}`
                        : 'Evento registrado');

                    return (
                      <div
                        key={ev.id || idx}
                        className="flex items-center justify-between gap-2 border-b border-line/50 pb-1.5 text-xs last:border-b-0 last:pb-0"
                      >
                        <div className="min-w-0">
                          <span className="font-mono text-2xs text-brass">
                            [{ev.eventType}]
                          </span>{' '}
                          <span className="text-ink-dim">{label}</span>
                        </div>
                        <span className="shrink-0 font-mono text-2xs tabular-nums text-ink-faint">
                          {formatTime(ev.timestamp)}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="py-8 text-center text-xs text-ink-dim">
            Jogador não encontrado.
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
