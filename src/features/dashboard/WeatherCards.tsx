import { Card } from '@/components/ui/Card';
import type { WeatherSnapshot } from '@/types/nasa';
import { formatSol } from '@/utils/solConverter';

interface WeatherCardsProps {
  weather: WeatherSnapshot;
}

function TempIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9a3 3 0 00-3 3v6a3 3 0 106 0v-6a3 3 0 00-3-3z M12 5v2" />
    </svg>
  );
}

function PressureIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
    </svg>
  );
}

function WindIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.59 4.59A2 2 0 1111 8H2m10.59 11.41A2 2 0 1014 16H2m15.73-8.27A2.5 2.5 0 1119.5 12H2" />
    </svg>
  );
}

export function WeatherCards({ weather }: WeatherCardsProps) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      <Card title="Máxima" subtitle={formatSol(weather.sol)} icon={<TempIcon />} className="hover:border-mars-600/30 transition-colors">
        <p className="text-2xl sm:text-3xl font-display text-mars-400 tabular-nums">
          {weather.tempMax.toFixed(1)}
          <span className="text-base text-slate-500 ml-1">°C</span>
        </p>
      </Card>

      <Card title="Mínima" subtitle={`Média ${weather.tempAvg.toFixed(1)}°C`} icon={<TempIcon />} className="hover:border-sky-600/30 transition-colors">
        <p className="text-2xl sm:text-3xl font-display text-sky-400 tabular-nums">
          {weather.tempMin.toFixed(1)}
          <span className="text-base text-slate-500 ml-1">°C</span>
        </p>
      </Card>

      <Card title="Pressão" subtitle="Atmosfera local" icon={<PressureIcon />} className="hover:border-space-600/50 transition-colors">
        <p className="text-2xl sm:text-3xl font-display text-white tabular-nums">
          {weather.pressure.toFixed(0)}
          <span className="text-base text-slate-500 ml-1">Pa</span>
        </p>
      </Card>

      <Card title="Vento" subtitle={weather.windDirection} icon={<WindIcon />} className="hover:border-space-600/50 transition-colors">
        <p className="text-2xl sm:text-3xl font-display text-white tabular-nums">
          {weather.windSpeed.toFixed(1)}
          <span className="text-base text-slate-500 ml-1">m/s</span>
        </p>
        <p className="text-[11px] text-slate-500 mt-2 capitalize">{weather.season}</p>
      </Card>
    </div>
  );
}
