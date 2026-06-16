import { useEffect, useState } from 'react';
import { MAX_HP } from '@/constants/fieldCombat';

interface MarsFieldCombatHudProps {
  hp: number;
  alive: boolean;
  respawnAt: number;
  laserEquipped: boolean;
}

export function MarsFieldCombatHud({ hp, alive, respawnAt, laserEquipped }: MarsFieldCombatHudProps) {
  const [, tick] = useState(0);

  useEffect(() => {
    if (alive) return;
    const id = window.setInterval(() => tick((n) => n + 1), 250);
    return () => window.clearInterval(id);
  }, [alive, respawnAt]);

  const pct = Math.max(0, Math.min(MAX_HP, hp));
  const respawnSec =
    !alive && respawnAt > Date.now() ? Math.ceil((respawnAt - Date.now()) / 1000) : 0;

  return (
    <>
      <div className="absolute left-4 bottom-[max(5rem,env(safe-area-inset-bottom))] z-20 pointer-events-none w-[min(100vw-8rem,220px)]">
        <div className="rounded-xl bg-black/55 backdrop-blur-md border border-white/15 px-3 py-2">
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <p className="text-[10px] font-mono uppercase tracking-wider text-zinc-400">Vida</p>
            <p className="text-xs font-mono text-white tabular-nums">{pct}%</p>
          </div>
          <div className="h-2 rounded-full bg-white/10 overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${
                pct > 50 ? 'bg-emerald-500' : pct > 25 ? 'bg-amber-500' : 'bg-red-500'
              }`}
              style={{ width: `${pct}%` }}
            />
          </div>
          {laserEquipped && alive && (
            <p className="text-[10px] font-mono text-cyan-400 mt-2 uppercase tracking-wider">
              Laser equipado · Q ou clique para atirar
            </p>
          )}
        </div>
      </div>

      {!alive && (
        <div className="absolute inset-0 z-30 flex items-center justify-center pointer-events-none bg-black/45">
          <div className="text-center px-6 py-5 rounded-2xl bg-black/70 border border-red-500/30 backdrop-blur-md">
            <p className="font-display text-xl text-red-400 tracking-wide">Eliminado</p>
            <p className="text-sm text-zinc-300 mt-2">
              Respawn em{' '}
              <span className="text-white font-mono tabular-nums">{respawnSec || 0}</span>s
            </p>
          </div>
        </div>
      )}
    </>
  );
}
