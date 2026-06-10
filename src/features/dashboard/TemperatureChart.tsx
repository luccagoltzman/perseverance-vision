import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { Card } from '@/components/ui/Card';
import type { WeatherSnapshot } from '@/types/nasa';
import { formatSol } from '@/utils/solConverter';

interface TemperatureChartProps {
  history: WeatherSnapshot[];
}

export function TemperatureChart({ history }: TemperatureChartProps) {
  const data = history.map((w) => ({
    sol: w.sol,
    label: formatSol(w.sol),
    max: w.tempMax,
    min: w.tempMin,
    avg: w.tempAvg,
  }));

  return (
    <Card title="Tendência de Temperatura" subtitle="Últimos 7 Sols — Elysium Planitia">
      <div className="h-56 sm:h-64 w-full mt-2 -mx-1">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis
              dataKey="label"
              tick={{ fill: '#94a3b8', fontSize: 11 }}
              tickLine={false}
              axisLine={{ stroke: '#334155' }}
            />
            <YAxis
              tick={{ fill: '#94a3b8', fontSize: 11 }}
              tickLine={false}
              axisLine={{ stroke: '#334155' }}
              unit="°C"
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1e293b',
                border: '1px solid #334155',
                borderRadius: '8px',
                fontSize: '12px',
              }}
              labelStyle={{ color: '#f1f5f9' }}
            />
            <Legend wrapperStyle={{ fontSize: '12px', color: '#94a3b8' }} />
            <Line
              type="monotone"
              dataKey="max"
              name="Máx"
              stroke="#f94a1a"
              strokeWidth={2}
              dot={{ fill: '#f94a1a', r: 3 }}
              activeDot={{ r: 5 }}
            />
            <Line
              type="monotone"
              dataKey="min"
              name="Mín"
              stroke="#38bdf8"
              strokeWidth={2}
              dot={{ fill: '#38bdf8', r: 3 }}
            />
            <Line
              type="monotone"
              dataKey="avg"
              name="Média"
              stroke="#94a3b8"
              strokeWidth={1.5}
              strokeDasharray="4 4"
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
