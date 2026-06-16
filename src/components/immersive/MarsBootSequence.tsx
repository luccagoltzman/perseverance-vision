import { useEffect, useState } from 'react';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';

const BOOT_KEY = 'mars-telemetry-boot-v1';

const LINES = [
  'INICIALIZANDO UPLINK...',
  'SINCRONIZANDO COM ELYSIUM PLANITIA...',
  'CALIBRANDO SENSORES ATMOSFÉRICOS...',
  'VENTO MARCIANO DETECTADO',
];

export function MarsBootSequence() {
  const reducedMotion = usePrefersReducedMotion();
  const [visible, setVisible] = useState(
    () => !reducedMotion && !sessionStorage.getItem(BOOT_KEY),
  );
  const [lineIndex, setLineIndex] = useState(0);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    if (!visible || reducedMotion) return;

    if (lineIndex < LINES.length - 1) {
      const t = setTimeout(() => setLineIndex((i) => i + 1), 700);
      return () => clearTimeout(t);
    }

    const done = setTimeout(() => {
      setFadeOut(true);
      setTimeout(() => {
        sessionStorage.setItem(BOOT_KEY, '1');
        setVisible(false);
      }, 600);
    }, 900);

    return () => clearTimeout(done);
  }, [lineIndex, visible, reducedMotion]);

  if (!visible) return null;

  return (
    <div
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-center bg-surface dark:bg-space-950 transition-opacity duration-600 ${
        fadeOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
      role="status"
      aria-live="polite"
    >
      <div className="absolute inset-0 stars-bg opacity-40" aria-hidden />
      <div
        className="absolute inset-0 opacity-40 dark:opacity-30"
        style={{
          background:
            'radial-gradient(ellipse at center, rgba(249,74,26,0.2) 0%, transparent 60%)',
        }}
        aria-hidden
      />

      <div className="relative text-center px-6">
        <div className="w-16 h-16 mx-auto mb-8 rounded-full border-2 border-mars-300 dark:border-mars-600/40 flex items-center justify-center boot-pulse">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-mars-400 to-mars-700 shadow-lg shadow-mars-200/60 dark:from-mars-500 dark:to-mars-800 dark:shadow-mars-900/60" />
        </div>

        <p className="font-display text-xs text-mars-600 dark:text-mars-500 tracking-[0.4em] mb-4">
          MARS TELEMETRY
        </p>

        <p className="font-mono text-sm sm:text-base text-content-muted dark:text-slate-300 h-6 transition-all duration-300">
          {LINES[lineIndex]}
        </p>

        <div className="mt-8 w-48 h-0.5 mx-auto bg-surface-muted dark:bg-space-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-mars-500 to-mars-400 transition-all duration-500 ease-out"
            style={{ width: `${((lineIndex + 1) / LINES.length) * 100}%` }}
          />
        </div>

        <button
          type="button"
          onClick={() => {
            sessionStorage.setItem(BOOT_KEY, '1');
            setFadeOut(true);
            setTimeout(() => setVisible(false), 300);
          }}
          className="mt-10 text-[10px] text-content-subtle hover:text-content-muted uppercase tracking-widest transition-colors"
        >
          Pular intro
        </button>
      </div>
    </div>
  );
}
