interface WindCompassProps {
  windSpeed: number;
  windDirection: string;
  className?: string;
}

const COMPASS_FROM: Record<string, number> = {
  N: 0, NNE: 22.5, NE: 45, ENE: 67.5, E: 90,
  ESE: 112.5, SE: 135, SSE: 157.5, S: 180,
  SSW: 202.5, SW: 225, WSW: 247.5, W: 270,
  WNW: 292.5, NW: 315, NNW: 337.5,
};

export function WindCompass({ windSpeed, windDirection, className = '' }: WindCompassProps) {
  const fromDeg = COMPASS_FROM[windDirection.toUpperCase()] ?? 0;
  const needleRotation = (fromDeg + 180) % 360;

  return (
    <div
      className={`relative w-20 h-20 sm:w-24 sm:h-24 flex-shrink-0 ${className}`}
      role="img"
      aria-label={`Vento ${windSpeed.toFixed(1)} m/s, direção ${windDirection}`}
    >
      <div className="absolute inset-0 rounded-full border border-mars-300 bg-white/70 backdrop-blur-md shadow-sm dark:border-mars-500/30 dark:bg-space-950/60 dark:shadow-inner dark:shadow-mars-900/20" />
      <div className="absolute inset-[18%] rounded-full border border-border dark:border-space-600/40" />

      <span className="absolute top-1.5 left-1/2 -translate-x-1/2 text-[8px] font-mono text-content-subtle">N</span>
      <span className="absolute bottom-1.5 left-1/2 -translate-x-1/2 text-[8px] font-mono text-content-subtle">S</span>
      <span className="absolute left-1.5 top-1/2 -translate-y-1/2 text-[8px] font-mono text-content-subtle">O</span>
      <span className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[8px] font-mono text-content-subtle">L</span>

      <div
        className="absolute inset-0 flex items-center justify-center transition-transform duration-1000 ease-out"
        style={{ transform: `rotate(${needleRotation}deg)` }}
      >
        <div className="relative flex flex-col items-center">
          <div className="w-0 h-0 border-l-[4px] border-r-[4px] border-b-[8px] border-l-transparent border-r-transparent border-b-mars-500 -mb-0.5" />
          <div className="w-0.5 h-7 sm:h-8 bg-gradient-to-t from-mars-600 to-mars-400 rounded-full shadow-[0_0_14px_rgba(249,74,26,0.35)]" />
        </div>
      </div>

      <p className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[10px] font-mono text-mars-600 dark:text-mars-400 whitespace-nowrap tabular-nums">
        {windSpeed.toFixed(1)} m/s
      </p>
    </div>
  );
}
