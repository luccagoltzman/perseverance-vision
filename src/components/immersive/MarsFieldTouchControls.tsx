import { useRef, useCallback } from 'react';
import type { FieldInputController } from './marsFieldInput';

interface MarsFieldTouchControlsProps {
  input: FieldInputController;
}

type TouchAction = 'forward' | 'back' | 'left' | 'right' | 'sprint' | 'jump';

export function MarsFieldTouchControls({ input }: MarsFieldTouchControlsProps) {
  const active = useRef(new Set<TouchAction>());

  const apply = useCallback(() => {
    const a = active.current;
    input.touch.forward =
      (a.has('forward') ? 1 : 0) + (a.has('back') ? -1 : 0);
    input.touch.turn =
      (a.has('left') ? 1 : 0) + (a.has('right') ? -1 : 0);
    input.touch.sprint = a.has('sprint');
  }, [input]);

  const start = (action: TouchAction) => (e: React.PointerEvent) => {
    e.preventDefault();
    active.current.add(action);
    if (action === 'jump') input.queueJump();
    apply();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const end = (action: TouchAction) => (e: React.PointerEvent) => {
    active.current.delete(action);
    apply();
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
  };

  const btn =
    'flex items-center justify-center rounded-xl bg-black/45 backdrop-blur-md border border-white/20 text-white active:bg-mars-600/60 active:border-mars-400/50 transition-colors select-none touch-none';

  return (
    <div className="md:hidden absolute inset-0 z-10 pointer-events-none">
      {/* D-pad */}
      <div className="absolute left-4 bottom-[max(5.5rem,env(safe-area-inset-bottom))] grid grid-cols-3 gap-1.5 pointer-events-auto">
        <div />
        <button
          type="button"
          aria-label="Frente"
          className={`${btn} w-14 h-14 text-xl`}
          onPointerDown={start('forward')}
          onPointerUp={end('forward')}
          onPointerCancel={end('forward')}
        >
          ▲
        </button>
        <div />
        <button
          type="button"
          aria-label="Esquerda"
          className={`${btn} w-14 h-14 text-xl`}
          onPointerDown={start('left')}
          onPointerUp={end('left')}
          onPointerCancel={end('left')}
        >
          ◀
        </button>
        <button
          type="button"
          aria-label="Trás"
          className={`${btn} w-14 h-14 text-xl`}
          onPointerDown={start('back')}
          onPointerUp={end('back')}
          onPointerCancel={end('back')}
        >
          ▼
        </button>
        <button
          type="button"
          aria-label="Direita"
          className={`${btn} w-14 h-14 text-xl`}
          onPointerDown={start('right')}
          onPointerUp={end('right')}
          onPointerCancel={end('right')}
        >
          ▶
        </button>
      </div>

      {/* Ações */}
      <div className="absolute right-4 bottom-[max(5.5rem,env(safe-area-inset-bottom))] flex flex-col gap-2 pointer-events-auto">
        <button
          type="button"
          aria-label="Correr"
          className={`${btn} h-12 px-5 text-xs font-mono uppercase tracking-wider`}
          onPointerDown={start('sprint')}
          onPointerUp={end('sprint')}
          onPointerCancel={end('sprint')}
        >
          Correr
        </button>
        <button
          type="button"
          aria-label="Pular"
          className={`${btn} w-16 h-16 text-sm font-display`}
          onPointerDown={start('jump')}
          onPointerUp={end('jump')}
          onPointerCancel={end('jump')}
        >
          Pulo
        </button>
      </div>
    </div>
  );
}
