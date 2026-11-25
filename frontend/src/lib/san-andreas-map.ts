import { HeatmapPoint } from '@/types/telemetry';

const WORLD_SPAN = 6000;
const WORLD_HALF = 3000;

export const HOT_INTENSITY_THRESHOLD = 0.65;

export function resolveRegionLabel(x: number, y: number): string {
  if (x > 1650 && y < -1750) return 'El Corona / Docas LS';
  if (x > 1100 && y < -450) return 'Los Santos (Centro / Leste)';
  if (x > 0 && y < -450) return 'Los Santos Oeste / Rodeo';
  if (x <= 0 && y < -600) return 'Flint / Whetstone';
  if (x < -1150 && y >= -600 && y < 1500) return 'San Fierro';
  if (x < -600 && y >= 1500) return 'Tierra Robada / Bayside';
  if (x > 0 && y >= -450 && y <= 550) return 'Red County / Palomino';
  if (x >= 850 && y > 550) return 'Las Venturas';
  if (x >= -600 && x < 850 && y > 550) return 'Bone County / Deserto';
  return 'Interior de San Andreas';
}

export function worldToCanvas(x: number, y: number, canvasSize: number) {
  const scale = canvasSize / WORLD_SPAN;
  return {
    px: (x + WORLD_HALF) * scale,
    py: (WORLD_HALF - y) * scale,
  };
}

export function canvasToWorld(normX: number, normY: number) {
  const x = Math.round(normX * WORLD_SPAN - WORLD_HALF);
  const y = Math.round(WORLD_HALF - normY * WORLD_SPAN);
  return {
    x,
    y,
    zone: resolveRegionLabel(x, y),
  };
}

export function renderHeatmapCanvas(
  ctx: CanvasRenderingContext2D,
  size: number,
  points: HeatmapPoint[],
  mapImage: HTMLImageElement | null,
): void {
  ctx.clearRect(0, 0, size, size);
  ctx.fillStyle = '#0D0F12';
  ctx.fillRect(0, 0, size, size);

  if (mapImage) {
    ctx.drawImage(mapImage, 0, 0, size, size);
  }

  ctx.strokeStyle = 'rgba(200, 164, 85, 0.08)';
  ctx.lineWidth = 1;
  const step = size / 6;
  for (let i = 1; i < 6; i += 1) {
    ctx.beginPath();
    ctx.moveTo(i * step, 0);
    ctx.lineTo(i * step, size);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(0, i * step);
    ctx.lineTo(size, i * step);
    ctx.stroke();
  }

  for (const point of points) {
    const { px, py } = worldToCanvas(Number(point.x) || 0, Number(point.y) || 0, size);
    const intensity = Math.max(0.15, Math.min(1, Number(point.intensity) || 0.25));
    const radius = 16 + intensity * 20;
    const isHot = intensity >= HOT_INTENSITY_THRESHOLD;

    const gradient = ctx.createRadialGradient(px, py, 0, px, py, radius);
    if (isHot) {
      gradient.addColorStop(0, `rgba(217, 72, 47, ${Math.min(0.92, intensity + 0.25)})`);
      gradient.addColorStop(0.45, `rgba(200, 164, 85, ${intensity * 0.55})`);
      gradient.addColorStop(1, 'rgba(200, 164, 85, 0)');
    } else {
      gradient.addColorStop(0, `rgba(212, 155, 63, ${Math.min(0.75, intensity + 0.22)})`);
      gradient.addColorStop(0.5, `rgba(200, 164, 85, ${intensity * 0.4})`);
      gradient.addColorStop(1, 'rgba(200, 164, 85, 0)');
    }

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(px, py, radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ECE8DC';
    ctx.beginPath();
    ctx.arc(px, py, 2.2, 0, Math.PI * 2);
    ctx.fill();
  }
}
