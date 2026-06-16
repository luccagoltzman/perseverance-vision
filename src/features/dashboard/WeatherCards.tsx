import { Card } from '@/components/ui/Card';
import type { WeatherSnapshot } from '@/types/nasa';
import { formatSol } from '@/utils/solConverter';
import { useAnimatedValue } from '@/hooks/useAnimatedValue';

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
  const tempMax = useAnimatedValue(weather.tempMax);
  const tempMin = useAnimatedValue(weather.tempMin);
  const pressure = useAnimatedValue(weather.pressure);
  const wind = useAnimatedValue(weather.windSpeed);

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      <Card title="Máxima" subtitle={formatSol(weather.sol)} icon={<TempIcon />} className="hover:border-mars-300 dark:hover:border-mars-600/30 transition-colors">
        <p className="text-2xl sm:text-3xl font-display text-mars-600 dark:text-mars-400 tabular-nums">
          {tempMax.toFixed(1)}
          <span className="text-base text-content-subtle ml-1">°C</span>
        </p>
      </Card>

      <Card title="Mínima" subtitle={`Média ${weather.tempAvg.toFixed(1)}°C`} icon={<TempIcon />} className="hover:border-sky-300 dark:hover:border-sky-600/30 transition-colors">
        <p className="text-2xl sm:text-3xl font-display text-sky-600 dark:text-sky-400 tabular-nums">
          {tempMin.toFixed(1)}
          <span className="text-base text-content-subtle ml-1">°C</span>
        </p>
      </Card>

      <Card title="Pressão" subtitle="Atmosfera local" icon={<PressureIcon />} className="hover:border-border transition-colors">
        <p className="text-2xl sm:text-3xl font-display text-content tabular-nums">
          {pressure.toFixed(0)}
          <span className="text-base text-content-subtle ml-1">Pa</span>
        </p>
      </Card>

      <Card
        title="Vento"
        subtitle={weather.windDirection}
        icon={<WindIcon />}
        className="border-mars-200 shadow-md shadow-mars-100/40 hover:border-mars-300 dark:border-mars-600/30 dark:shadow-mars-950/30 dark:hover:border-mars-500/50 transition-all relative overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-mars-100/50 to-transparent pointer-events-none dark:from-mars-600/5" />
        <p className="relative text-2xl sm:text-3xl font-display text-content dark:text-white tabular-nums">
          {wind.toFixed(1)}
          <span className="text-base text-content-subtle ml-1">m/s</span>
        </p>
        <p className="relative text-[11px] text-mars-600 dark:text-mars-400/80 mt-2 capitalize">{weather.season}</p>
      </Card>
    </div>
  );
}
