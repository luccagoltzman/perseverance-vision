import { Link } from 'react-router-dom';
import type { WeatherSnapshot } from '@/types/nasa';
import { MarsWindVegetation } from './MarsWindVegetation';
import { MarsDustField } from './MarsDustField';
import { WindCompass } from './WindCompass';
import { useAnimatedValue } from '@/hooks/useAnimatedValue';
import { formatSol } from '@/utils/solConverter';
import { getWindIntensityLabel } from '@/utils/windPhysics';
import { Button } from '@/components/ui/Button';

interface MarsWindHeroProps {
  weather: WeatherSnapshot;
}

export function MarsWindHero({ weather }: MarsWindHeroProps) {
  const animatedSpeed = useAnimatedValue(weather.windSpeed, 1400);
  const animatedTemp = useAnimatedValue(weather.tempAvg, 1400);
  const intensity = getWindIntensityLabel(weather.windSpeed);

  return (
    <section className="relative -mx-4 sm:mx-0 sm:rounded-2xl overflow-hidden min-h-[min(72vh,520px)] border-y sm:border border-mars-200 shadow-xl shadow-mars-100/50 dark:border-mars-900/40 dark:shadow-mars-950/50 transition-colors">
      {/* Céu — claro: pôr do sol terrestre; escuro: céu marciano */}
      <div
        className="absolute inset-0 bg-gradient-to-b from-mars-50 via-mars-100 to-emerald-50 dark:from-[#0a0612] dark:via-[#1a0a08] dark:to-[#0d1a12]"
        aria-hidden
      />
      <div
        className="absolute inset-0 opacity-100 dark:opacity-0"
        style={{
          background:
            'linear-gradient(180deg, transparent 40%, rgba(255,200,170,0.4) 65%, rgba(180,220,180,0.5) 100%)',
        }}
        aria-hidden
      />
      <div
        className="absolute inset-0 opacity-0 dark:opacity-100"
        style={{
          background:
            'linear-gradient(180deg, #0a0612 0%, #1a0a08 28%, #3d1810 52%, #5c2818 68%, #0d1a12 100%)',
        }}
        aria-hidden
      />

      <div
        className="absolute left-1/2 -translate-x-1/2 w-[140%] h-[45%] top-[18%] rounded-[50%] opacity-30 dark:opacity-40"
        style={{
          background:
            'radial-gradient(ellipse at center, rgba(249,74,26,0.25) 0%, rgba(249,74,26,0.08) 45%, transparent 70%)',
        }}
        aria-hidden
      />

      <MarsDustField windSpeed={weather.windSpeed} windDirection={weather.windDirection} />
      <MarsWindVegetation
        windSpeed={weather.windSpeed}
        windDirection={weather.windDirection}
      />

      <div className="absolute inset-0 bg-gradient-to-t from-surface/90 via-transparent to-transparent dark:from-space-950 dark:via-space-950/20 pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-r from-surface/50 via-transparent to-surface/30 dark:from-space-950/60 dark:to-space-950/40 pointer-events-none" />

      <div className="relative z-10 flex flex-col justify-between h-full min-h-[inherit] p-5 sm:p-8">
        <div className="space-y-3 max-w-xl">
          <p className="text-[10px] sm:text-xs font-mono text-mars-600 dark:text-mars-400/90 tracking-[0.35em] uppercase animate-fade-in">
            Experiência imersiva · InSight Lander
          </p>
          <h1 className="font-display text-3xl sm:text-5xl lg:text-6xl text-content dark:text-white leading-[1.05] tracking-wide text-glow-mars">
            <span className="block">Se o vento de</span>
            <span className="block text-mars-600 dark:text-mars-400">Marte</span>
            <span className="block text-lg sm:text-2xl text-content-muted dark:text-slate-400 font-normal mt-2 tracking-normal font-sans">
              agitasse a vegetação da Terra
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-content-muted dark:text-slate-400/90 leading-relaxed max-w-md">
            Cada movimento das folhas responde à telemetria real de{' '}
            <strong className="text-content dark:text-slate-300">{formatSol(weather.sol)}</strong> em
            Elysium Planitia — {intensity.toLowerCase()}, direção {weather.windDirection}.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-6 mt-8">
          <div className="flex items-end gap-6 sm:gap-10">
            <WindCompass
              windSpeed={weather.windSpeed}
              windDirection={weather.windDirection}
            />
            <div className="space-y-3 pb-5">
              <TelemetryReadout
                label="Vento"
                value={`${animatedSpeed.toFixed(1)} m/s`}
                sub={weather.windDirection}
              />
              <TelemetryReadout
                label="Temperatura"
                value={`${animatedTemp.toFixed(1)}°C`}
                sub={weather.season}
              />
            </div>
          </div>

          <Link to="/gallery" className="w-full sm:w-auto">
            <Button className="w-full sm:w-auto shadow-lg shadow-mars-200/50 dark:shadow-mars-900/40">
              Explorar superfície →
            </Button>
          </Link>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-mars-400/50 to-transparent scan-line" />
    </section>
  );
}

function TelemetryReadout({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub: string;
}) {
  return (
    <div>
      <p className="text-[10px] font-mono text-content-subtle uppercase tracking-widest">{label}</p>
      <p className="font-display text-xl sm:text-2xl text-content dark:text-white tabular-nums">{value}</p>
      <p className="text-[10px] text-mars-600 dark:text-mars-500/80 font-mono capitalize">{sub}</p>
    </div>
  );
}
