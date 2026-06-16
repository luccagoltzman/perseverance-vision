import { MarsDustField } from './MarsDustField';

interface GalleryAtmosphereProps {
  title: string;
  subtitle: string;
  windSpeed?: number;
  windDirection?: string;
}

export function GalleryAtmosphere({
  title,
  subtitle,
  windSpeed = 4,
  windDirection = 'NE',
}: GalleryAtmosphereProps) {
  return (
    <section className="relative -mx-4 sm:mx-0 sm:rounded-2xl overflow-hidden min-h-[200px] sm:min-h-[220px] border-y sm:border border-border mb-8 shadow-sm">
      <div
        className="absolute inset-0 bg-gradient-to-br from-mars-50 via-white to-mars-100 dark:from-[#0a0612] dark:via-[#1a0c0a] dark:to-[#0f172a]"
        aria-hidden
      />
      <MarsDustField
        windSpeed={windSpeed}
        windDirection={windDirection}
        density={35}
        className="opacity-40 dark:opacity-50"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-surface/80 via-surface/40 to-transparent dark:from-space-950/80 dark:via-space-950/40" />
      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-surface to-transparent dark:from-space-950" />

      <div className="relative z-10 p-6 sm:p-8 flex flex-col justify-end min-h-[inherit]">
        <p className="text-[10px] font-mono text-mars-600 dark:text-mars-500 tracking-[0.3em] uppercase mb-2">
          Exploração visual
        </p>
        <h1 className="font-display text-2xl sm:text-4xl text-content dark:text-white tracking-wide text-glow-mars">
          {title}
        </h1>
        <p className="text-sm text-content-muted dark:text-slate-400 mt-2 max-w-lg">{subtitle}</p>
      </div>

      <div className="absolute top-4 right-4 sm:top-6 sm:right-6 font-mono text-[10px] text-content-subtle text-right hidden sm:block">
        <p>SURFACE_IMAGING</p>
        <p className="text-mars-500/80 dark:text-mars-600/60">RAW_FEED_ACTIVE</p>
      </div>
    </section>
  );
}
