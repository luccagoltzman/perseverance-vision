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
import { useTheme } from '@/context/ThemeContext';

interface TemperatureChartProps {
  history: WeatherSnapshot[];
}

export function TemperatureChart({ history }: TemperatureChartProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const chartTheme = {
    grid: isDark ? '#334155' : '#e2e8f0',
    tick: isDark ? '#94a3b8' : '#64748b',
    tooltipBg: isDark ? '#1e293b' : '#ffffff',
    tooltipBorder: isDark ? '#334155' : '#fed7c6',
    label: isDark ? '#f1f5f9' : '#1e293b',
    legend: isDark ? '#94a3b8' : '#64748b',
  };

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
            <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.grid} />
            <XAxis
              dataKey="label"
              tick={{ fill: chartTheme.tick, fontSize: 11 }}
              tickLine={false}
              axisLine={{ stroke: chartTheme.grid }}
            />
            <YAxis
              tick={{ fill: chartTheme.tick, fontSize: 11 }}
              tickLine={false}
              axisLine={{ stroke: chartTheme.grid }}
              unit="°C"
            />
            <Tooltip
              contentStyle={{
                backgroundColor: chartTheme.tooltipBg,
                border: `1px solid ${chartTheme.tooltipBorder}`,
                borderRadius: '8px',
                fontSize: '12px',
              }}
              labelStyle={{ color: chartTheme.label }}
            />
            <Legend wrapperStyle={{ fontSize: '12px', color: chartTheme.legend }} />
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
              stroke="#0ea5e9"
              strokeWidth={2}
              dot={{ fill: '#0ea5e9', r: 3 }}
            />
            <Line
              type="monotone"
              dataKey="avg"
              name="Média"
              stroke={isDark ? '#94a3b8' : '#64748b'}
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
