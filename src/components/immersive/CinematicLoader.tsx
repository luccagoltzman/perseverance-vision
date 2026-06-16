interface CinematicLoaderProps {
  label?: string;
}

export function CinematicLoader({ label = 'Estabelecendo uplink com Marte...' }: CinematicLoaderProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] gap-8 animate-fade-in">
      <div className="relative w-24 h-24">
        <div className="absolute inset-0 rounded-full border border-mars-200 dark:border-mars-600/20" />
        <div className="absolute inset-2 rounded-full border border-mars-300 dark:border-mars-500/30 boot-pulse" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-mars-400 to-mars-600 shadow-[0_0_30px_rgba(249,74,26,0.25)] dark:from-mars-400 dark:to-mars-800 dark:shadow-[0_0_30px_rgba(249,74,26,0.4)]" />
        </div>
        <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 100 100" aria-hidden>
          <circle
            cx="50"
            cy="50"
            r="46"
            fill="none"
            stroke="url(#marsGrad)"
            strokeWidth="1.5"
            strokeDasharray="80 200"
            className="origin-center animate-spin-slow"
          />
          <defs>
            <linearGradient id="marsGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#f94a1a" stopOpacity="0" />
              <stop offset="50%" stopColor="#f94a1a" />
              <stop offset="100%" stopColor="#f94a1a" stopOpacity="0" />
            </linearGradient>
          </defs>
        </svg>
      </div>
      <div className="text-center space-y-2">
        <p className="font-display text-sm text-mars-600 dark:text-mars-400 tracking-widest uppercase">
          Sincronizando
        </p>
        <p className="text-sm text-content-subtle font-mono">{label}</p>
      </div>
    </div>
  );
}
