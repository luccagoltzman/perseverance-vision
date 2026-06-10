import { Card } from '@/components/ui/Card';
import type { WeatherSnapshot } from '@/types/nasa';
import { formatSol } from '@/utils/solConverter';

interface WeatherCardsProps {
  weather: WeatherSnapshot;
}

function TempIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
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
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14 5l-1 1m0 0l-1 1m1-1v6m0 0l1 1m-1-1l-1 1M4 9h1m15 0h1M4 15h1m15 0h1" />
    </svg>
  );
}

export function WeatherCards({ weather }: WeatherCardsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card title="Temperatura Máx" subtitle={formatSol(weather.sol)} icon={<TempIcon />}>
        <p className="text-3xl font-display text-mars-400">
          {weather.tempMax.toFixed(1)}
          <span className="text-lg text-slate-500 ml-1">°C</span>
        </p>
      </Card>

      <Card title="Temperatura Mín" subtitle={`Média: ${weather.tempAvg.toFixed(1)}°C`} icon={<TempIcon />}>
        <p className="text-3xl font-display text-sky-400">
          {weather.tempMin.toFixed(1)}
          <span className="text-lg text-slate-500 ml-1">°C</span>
        </p>
      </Card>

      <Card title="Pressão Atmosférica" subtitle="Elysium Planitia (InSight)" icon={<PressureIcon />}>
        <p className="text-3xl font-display text-white">
          {weather.pressure.toFixed(1)}
          <span className="text-lg text-slate-500 ml-1">Pa</span>
        </p>
      </Card>

      <Card title="Vento" subtitle={`Direção: ${weather.windDirection}`} icon={<WindIcon />}>
        <p className="text-3xl font-display text-white">
          {weather.windSpeed.toFixed(1)}
          <span className="text-lg text-slate-500 ml-1">m/s</span>
        </p>
        <p className="text-xs text-slate-500 mt-2">Estação: {weather.season}</p>
      </Card>
    </div>
  );
}
