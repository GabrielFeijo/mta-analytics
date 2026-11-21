import { HeatmapPoint } from '@/types/telemetry';

const WORLD_SPAN = 6000;
const WORLD_HALF = 3000;

export function resolveRegionLabel(x: number, y: number): string {
  if (x > 1800 && y < -1800) return 'El Corona / Docas LS';
  if (x > 500 && y < -800) return 'Los Santos (Urbano)';
  if (x < -1200 && y > -800 && y < 1500) return 'San Fierro';
  if (x > 900 && y > 600) return 'Las Venturas';
  if (x > 1200 && y > -400 && y <= 600) return 'Red County / Palomino';
  if (x <= 900 && y > 600) return 'Bone County / Rota 69';
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
    const intensity = Math.max(0.18, Math.min(1, Number(point.intensity) || 0.4));
    const radius = 18 + intensity * 18;

    const gradient = ctx.createRadialGradient(px, py, 0, px, py, radius);
    gradient.addColorStop(0, `rgba(217, 72, 47, ${Math.min(0.92, intensity + 0.25)})`);
    gradient.addColorStop(0.45, `rgba(200, 164, 85, ${intensity * 0.55})`);
    gradient.addColorStop(1, 'rgba(200, 164, 85, 0)');

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
