export function formatNumber(num: number): string {
  const safe = Number.isFinite(num) ? num : 0;
  return new Intl.NumberFormat('pt-BR').format(safe);
}

export function formatCurrency(amount: number): string {
  const safe = Number.isFinite(amount) ? amount : 0;
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0,
  }).format(safe);
}

export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return '—';
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return '—';
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(parsed);
}

export function formatTime(date: Date | string | null | undefined): string {
  if (!date) return '—';
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return '—';
  return new Intl.DateTimeFormat('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(parsed);
}

export function formatPlaytimeHours(minutes?: number): string {
  const totalMin = Math.max(0, Number(minutes) || 0);
  const hours = Math.floor(totalMin / 60);
  const remMin = totalMin % 60;
  if (hours === 0) return `${remMin}m`;
  return remMin > 0 ? `${hours}h ${remMin}m` : `${hours}h`;
}
