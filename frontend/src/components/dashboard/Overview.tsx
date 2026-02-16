import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis } from "recharts"

export function Overview({ data }: { data: any[] }) {
    if (!data || data.length === 0) {
        return <div className="flex h-[350px] items-center justify-center text-muted-foreground text-sm">No data available for this period</div>
    }
    return (
        <ResponsiveContainer width="100%" height={350}>
            <BarChart data={data}>
                <XAxis
                    dataKey="name"
                    stroke="#888888"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                />
                <YAxis
                    stroke="#888888"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `$${value}`}
                />
                <Bar
                    dataKey="earn"
                    fill="#22c55e"
                    radius={[4, 4, 0, 0]}
                    name="Income"
                />
                <Bar
                    dataKey="spend"
                    fill="#ef4444"
                    radius={[4, 4, 0, 0]}
                    name="Expense"
                />
            </BarChart>
        </ResponsiveContainer>
    )
}
