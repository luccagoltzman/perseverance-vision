import type { CaptureMatchState, FieldTeam } from '@/types/multiplayer';
import { TEAM_LABELS } from '@/constants/fieldCapture';

interface MarsFieldCaptureHudProps {
  capture: CaptureMatchState | null;
  myTeam: FieldTeam | null;
}

function formatTimeLeft(endsAt: number): string {
  const sec = Math.max(0, Math.ceil((endsAt - Date.now()) / 1000));
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function MarsFieldCaptureHud({ capture, myTeam }: MarsFieldCaptureHudProps) {
  if (!capture || capture.phase === 'idle') {
    return (
      <div className="absolute top-24 left-4 z-20 pointer-events-none">
        <div className="rounded-xl bg-black/55 backdrop-blur-md border border-white/15 px-3 py-2 max-w-[220px]">
          <p className="text-[10px] font-mono uppercase tracking-widest text-zinc-400">Captura de sinal</p>
          <p className="text-xs text-zinc-300 mt-1">Aguardando 2+ exploradores…</p>
        </div>
      </div>
    );
  }

  const alpha = capture.scores.alpha;
  const beta = capture.scores.beta;
  const total = Math.max(1, alpha + beta);
  const alphaPct = Math.round((alpha / total) * 100);
  const betaPct = 100 - alphaPct;

  return (
    <div className="absolute top-24 left-4 z-20 pointer-events-none w-[min(100vw-2rem,280px)]">
      <div className="rounded-xl bg-black/60 backdrop-blur-md border border-white/15 px-3 py-2.5 space-y-2">
        <div className="flex items-center justify-between gap-2">
          <p className="text-[10px] font-mono uppercase tracking-widest text-mars-300">
            Captura de sinal
          </p>
          {capture.phase === 'active' && (
            <span className="text-[10px] font-mono text-zinc-300 tabular-nums">
              {formatTimeLeft(capture.endsAt)}
            </span>
          )}
          {capture.phase === 'ended' && (
            <span className="text-[10px] font-mono text-amber-300 uppercase">Encerrada</span>
          )}
        </div>

        {myTeam && (
          <p className="text-[10px] text-zinc-400">
            Sua equipe:{' '}
            <span className={myTeam === 'alpha' ? 'text-blue-300' : 'text-emerald-300'}>
              {TEAM_LABELS[myTeam]}
            </span>
          </p>
        )}

        <div className="space-y-1">
          <div className="flex justify-between text-[10px] font-mono text-zinc-400">
            <span className="text-blue-300">Alpha {alpha}s</span>
            <span className="text-emerald-300">Beta {beta}s</span>
          </div>
          <div className="h-2 rounded-full overflow-hidden flex bg-white/10">
            <div className="bg-blue-500/80 transition-all duration-500" style={{ width: `${alphaPct}%` }} />
            <div className="bg-emerald-500/80 transition-all duration-500" style={{ width: `${betaPct}%` }} />
          </div>
        </div>

        <div className="space-y-1 pt-1 border-t border-white/10">
          {capture.zones.map((zone) => (
            <p key={zone.id} className="text-[10px] text-zinc-400 leading-snug">
              <span className="text-zinc-200">{zone.label}</span>
              {' · '}
              {zone.status === 'contested' && (
                <span className="text-amber-300">disputado</span>
              )}
              {zone.status === 'neutral' && <span>neutro</span>}
              {zone.status === 'alpha' && (
                <span className="text-blue-300">Alpha hackeando ({zone.hackersAlpha})</span>
              )}
              {zone.status === 'beta' && (
                <span className="text-emerald-300">Beta hackeando ({zone.hackersBeta})</span>
              )}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
}
