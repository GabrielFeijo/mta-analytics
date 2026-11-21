import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { formatCurrency } from '@/lib/formatters';
import { OverviewDayPoint } from '@/types/telemetry';

const C_BRASS = '#C8A455';
const C_SIGNAL = '#D9482F';
const C_DIM = '#A29F94';
const C_LINE = '#2C2E33';

export function EconomyOverviewChart({ data }: { data: OverviewDayPoint[] }) {
  if (!data || data.length === 0) {
    return (
      <div className="flex h-[320px] items-center justify-center text-xs text-ink-dim">
        Sem dados financeiros registrados neste período.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} barGap={4}>
            <CartesianGrid stroke={C_LINE} vertical={false} />
            <XAxis
              dataKey="name"
              stroke={C_DIM}
              fontSize={11}
              tickLine={false}
              axisLine={{ stroke: C_LINE }}
            />
            <YAxis
              stroke={C_DIM}
              fontSize={11}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value: number) =>
                value >= 1000 ? `R$${Math.round(value / 1000)}k` : `R$${value}`
              }
            />
            <Tooltip
              cursor={{ fill: 'rgba(255,255,255,0.03)' }}
              formatter={(val, name) => [
                formatCurrency(Number(val) || 0),
                String(name),
              ]}
              contentStyle={{
                backgroundColor: '#16171A',
                border: '1px solid #3D4046',
                borderRadius: '2px',
                fontSize: '11px',
                fontFamily: 'var(--font-mono)',
                color: '#ECE8DC',
              }}
            />
            <Bar
              dataKey="earn"
              fill={C_BRASS}
              radius={[2, 2, 0, 0]}
              name="Entradas / Receita"
            />
            <Bar
              dataKey="spend"
              fill={C_SIGNAL}
              radius={[2, 2, 0, 0]}
              name="Saídas / Gastos"
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line pt-2.5 text-2xs text-ink-dim">
        <div className="flex flex-wrap items-center gap-4">
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-sm bg-brass" /> Entradas (Empregos, Prêmios, Bancos)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-sm bg-signal" /> Saídas (Concessionária, Lojas, Multas, Grid)
          </span>
        </div>
        <span className="font-mono text-ink-faint">Janela: 7 dias</span>
      </div>
    </div>
  );
}
