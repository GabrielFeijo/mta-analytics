import { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Compass, Flame, Layers } from 'lucide-react';
import { analyticsApi } from '@/services/analytics-api';
import {
  canvasToWorld,
  renderHeatmapCanvas,
  resolveRegionLabel,
} from '@/lib/san-andreas-map';
import { HeatmapPoint } from '@/types/telemetry';
import { TimeWindowSelector } from '@/components/common/time-window-selector';
import { QueryErrorState } from '@/components/common/query-error-state';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const EVENT_LAYERS = [
  { key: 'player_position', label: 'Fluxo de Jogadores' },
  { key: 'player_transaction', label: 'Rachas & Economia' },
  { key: 'fine_issued', label: 'Multas de Radar' },
  { key: 'player_wasted', label: 'Combate & Óbitos' },
  { key: 'vehicle_purchase', label: 'Concessionárias' },
] as const;

export function HeatmapView() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mapImageRef = useRef<HTMLImageElement | null>(null);
  const [selectedLayer, setSelectedLayer] = useState<string>('player_position');
  const [windowHours, setWindowHours] = useState<number>(24);
  const [hoverCoords, setHoverCoords] = useState<{ x: number; y: number; zone: string } | null>(
    null,
  );
  const [mapReady, setMapReady] = useState(false);

  const {
    data: heatmapData = [],
    isLoading,
    isError,
    refetch,
  } = useQuery<HeatmapPoint[]>({
    queryKey: ['player-heatmap', selectedLayer, windowHours],
    queryFn: () =>
      analyticsApi.getHeatmapData({
        eventType: selectedLayer,
        startDate: new Date(Date.now() - windowHours * 60 * 60 * 1000),
        endDate: new Date(),
      }),
    refetchInterval: 60000,
  });

  useEffect(() => {
    const img = new Image();
    img.src = '/assets/map-garage-night.png';
    img.onload = () => {
      mapImageRef.current = img;
      setMapReady(true);
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    renderHeatmapCanvas(ctx, canvas.width, heatmapData, mapImageRef.current);
  }, [heatmapData, mapReady]);

  const handleMouseMove = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const normX = (event.clientX - rect.left) / rect.width;
    const normY = (event.clientY - rect.top) / rect.height;
    setHoverCoords(canvasToWorld(normX, normY));
  };

  if (isError) {
    return (
      <QueryErrorState
        message="Erro ao carregar a malha espacial do mapa de calor."
        onRetry={() => void refetch()}
      />
    );
  }

  const totalOccurrences = heatmapData.reduce(
    (acc, spot) => acc + (Number(spot.count) || 0),
    0,
  );

  const topHotspots = [...heatmapData]
    .sort((a, b) => (Number(b.count) || 0) - (Number(a.count) || 0))
    .slice(0, 6);

  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
      <Card className="xl:col-span-8">
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Compass className="h-4 w-4 text-brass" strokeWidth={1.75} />
            <CardTitle>Cartografia Térmica de San Andreas (Garage Night)</CardTitle>
          </div>

          <TimeWindowSelector value={windowHours} onChange={setWindowHours} />
        </CardHeader>

        <CardContent className="space-y-3">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="mr-1 flex items-center gap-1 text-2xs text-ink-faint">
              <Layers className="h-3.5 w-3.5" strokeWidth={1.75} /> Camada:
            </span>
            {EVENT_LAYERS.map((layer) => {
              const active = selectedLayer === layer.key;
              return (
                <button
                  key={layer.key}
                  type="button"
                  onClick={() => setSelectedLayer(layer.key)}
                  className={`h-7 rounded-sm border px-2.5 text-xs font-medium transition-colors ${
                    active
                      ? 'border-signal bg-signal/15 text-ink'
                      : 'border-line bg-bg2 text-ink-dim hover:border-line-strong hover:text-ink'
                  }`}
                >
                  {layer.label}
                </button>
              );
            })}
          </div>

          <div className="relative flex items-center justify-center overflow-hidden rounded-sm border border-line-strong bg-[#0D0F12]">
            {isLoading && (
              <div className="absolute inset-0 z-10 flex items-center justify-center bg-bg0/80 text-xs text-ink-dim">
                Sincronizando malha espacial…
              </div>
            )}

            <canvas
              ref={canvasRef}
              width={640}
              height={640}
              onMouseMove={handleMouseMove}
              onMouseLeave={() => setHoverCoords(null)}
              className="aspect-square w-full max-w-[600px] cursor-crosshair"
            />

            <div className="pointer-events-none absolute bottom-2.5 left-2.5 flex items-center gap-2 rounded-sm border border-line-strong bg-bg1/95 px-2.5 py-1 font-mono text-2xs text-ink">
              {hoverCoords ? (
                <>
                  <span className="text-brass">{hoverCoords.zone}</span>
                  <span className="text-ink-faint">|</span>
                  <span className="tabular-nums">
                    X:{hoverCoords.x} Y:{hoverCoords.y}
                  </span>
                </>
              ) : (
                <span className="text-ink-dim">
                  Passe o cursor sobre o mapa para inspecionar coordenadas (-3000 a +3000)
                </span>
              )}
            </div>

            <div className="pointer-events-none absolute bottom-2.5 right-2.5 flex items-center gap-2 rounded-sm border border-line bg-bg1/95 px-2.5 py-1 text-2xs text-ink-dim">
              <span>Baixa</span>
              <span className="h-2 w-16 rounded-sm bg-gradient-to-r from-brass/40 via-brass to-signal" />
              <span>Crítica</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="self-start xl:col-span-4">
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Flame className="h-4 w-4 text-signal" strokeWidth={1.75} />
            <CardTitle>Zonas de Maior Concentração</CardTitle>
          </div>
          <div className="flex items-center gap-1.5">
            <Badge variant="outline" className="font-mono">
              {totalOccurrences} {totalOccurrences === 1 ? 'ocorrência' : 'ocorrências'}
            </Badge>
            <Badge variant="brass" className="font-mono">
              {heatmapData.length} {heatmapData.length === 1 ? 'célula' : 'células'}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-2.5">
          {topHotspots.length === 0 ? (
            <div className="py-8 text-center text-xs text-ink-dim">
              Nenhuma célula térmica registrada nesta camada.
            </div>
          ) : (
            topHotspots.map((spot, idx) => {
              const x = Math.round(Number(spot.x) || 0);
              const y = Math.round(Number(spot.y) || 0);
              const count = Number(spot.count) || 0;
              const zone = spot.label || resolveRegionLabel(x, y);
              const pct = Math.round(Math.min(1, Number(spot.intensity) || 0) * 100);
              const isHot = pct >= 75;

              return (
                <div
                  key={`${x}-${y}-${idx}`}
                  className="rounded-sm border border-line bg-bg2 p-2.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex min-w-0 items-center gap-2">
                      <span className="font-mono text-xs font-semibold tabular-nums text-brass">
                        #{idx + 1}
                      </span>
                      <span className="truncate text-xs font-medium text-ink">
                        {zone}
                      </span>
                    </div>
                    <Badge variant={isHot ? 'default' : 'brass'} className="shrink-0 whitespace-nowrap">
                      {count} {count === 1 ? 'ocorrência' : 'ocorrências'}
                    </Badge>
                  </div>

                  <div className="mt-2 flex items-center gap-2">
                    <div className="h-[3px] flex-1 overflow-hidden rounded-full bg-line">
                      <div
                        className={`h-full ${isHot ? 'bg-signal' : 'bg-brass'}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="font-mono text-2xs tabular-nums text-ink-faint">
                      X:{x} Y:{y}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>
    </div>
  );
}
