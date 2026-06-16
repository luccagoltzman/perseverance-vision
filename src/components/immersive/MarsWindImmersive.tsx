import { useEffect, useCallback, useRef, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import type { WeatherSnapshot } from '@/types/nasa';
import type { FieldChatMessage } from '@/types/multiplayer';
import { createMarsFieldScene } from './marsFieldScene';
import { FieldInputController } from './marsFieldInput';
import { MarsFieldTouchControls } from './MarsFieldTouchControls';
import { MarsFieldChat } from './MarsFieldChat';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';
import { formatSol } from '@/utils/solConverter';
import type { MarsFieldMultiplayerClient } from '@/services/marsFieldMultiplayer';

interface MarsWindImmersiveProps {
  weather: WeatherSnapshot;
  open: boolean;
  onClose: () => void;
  playerName: string;
  multiplayer: MarsFieldMultiplayerClient;
}

export function MarsWindImmersive({
  weather,
  open,
  onClose,
  playerName,
  multiplayer,
}: MarsWindImmersiveProps) {
  const reducedMotion = usePrefersReducedMotion();
  const input = useMemo(() => new FieldInputController(), []);
  const [chatOpen, setChatOpen] = useState(false);
  const [messages, setMessages] = useState<FieldChatMessage[]>([]);
  const [onlineCount, setOnlineCount] = useState(1);

  const handleClose = useCallback(() => {
    multiplayer.disconnect();
    onClose();
  }, [multiplayer, onClose]);

  useEffect(() => {
    if (!open) return;

    const remove = multiplayer.addCallbacks({
      onChat: (message) => setMessages((prev) => [...prev, message].slice(-80)),
      onOnlineCount: (count) => setOnlineCount(count),
    });

    return remove;
  }, [open, multiplayer]);

  useEffect(() => {
    if (!open) return;

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
      if (e.key === 'Enter' && !chatOpen && document.activeElement?.tagName !== 'INPUT') {
        e.preventDefault();
        setChatOpen(true);
      }
    };

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKey);

    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', handleKey);
    };
  }, [open, handleClose, chatOpen]);

  if (!open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[85] bg-black w-screen h-[100dvh] max-h-[100dvh]"
      role="dialog"
      aria-modal="true"
      aria-label="Campo 3D — vento marciano"
    >
      <MarsFieldCanvas
        windSpeed={weather.windSpeed}
        windDirection={weather.windDirection}
        reducedMotion={reducedMotion}
        input={input}
        multiplayer={multiplayer}
      />

      <MarsFieldTouchControls input={input} />

      <MarsFieldChat
        open={chatOpen}
        onToggle={() => setChatOpen((v) => !v)}
        messages={messages}
        playerName={playerName}
        onlineCount={onlineCount}
        onSend={(text) => multiplayer.sendChat(text)}
      />

      <header className="absolute top-0 left-0 right-0 z-10 flex items-start justify-between gap-3 p-4 pt-[max(0.75rem,env(safe-area-inset-top))] bg-gradient-to-b from-black/75 to-transparent pointer-events-none">
        <div className="pointer-events-auto min-w-0">
          <p className="text-[10px] font-mono text-mars-300 uppercase tracking-[0.3em]">
            Campo imersivo — Elysium Planitia
          </p>
          <h2 className="font-display text-lg sm:text-xl text-white tracking-wide mt-1">
            Vento de Marte
          </h2>
          <p className="text-xs text-zinc-300 mt-1 max-w-sm leading-relaxed hidden sm:block">
            <span className="text-white font-medium">W A S D</span> ou setas para andar ·{' '}
            <span className="text-white font-medium">Shift</span> correr ·{' '}
            <span className="text-white font-medium">Espaço</span> pular ·{' '}
            <span className="text-white font-medium">E</span> acenar
          </p>
        </div>
        <button
          type="button"
          onClick={handleClose}
          className="pointer-events-auto flex-shrink-0 w-11 h-11 rounded-full bg-black/50 hover:bg-black/70 text-white text-lg flex items-center justify-center backdrop-blur-sm border border-white/25 transition-colors"
          aria-label="Sair do campo 3D"
        >
          ✕
        </button>
      </header>

      <footer className="absolute bottom-0 left-0 right-0 z-10 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] bg-gradient-to-t from-black/80 via-black/40 to-transparent pointer-events-none">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="flex gap-4 sm:gap-10">
            <HudStat label="Vento" value={`${weather.windSpeed.toFixed(1)} m/s`} />
            <HudStat label="Direção" value={weather.windDirection} />
            <HudStat label="Sol" value={formatSol(weather.sol)} />
          </div>
          <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest hidden md:block">
            Shift correr · Espaço pular · E acenar · Esc sair
          </p>
        </div>
      </footer>
    </div>,
    document.body,
  );
}

function MarsFieldCanvas({
  windSpeed,
  windDirection,
  reducedMotion,
  input,
  multiplayer,
}: {
  windSpeed: number;
  windDirection: string;
  reducedMotion: boolean;
  input: FieldInputController;
  multiplayer: MarsFieldMultiplayerClient;
}) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = containerRef.current;
    if (!node) return;

    const dispose = createMarsFieldScene({
      container: node,
      windSpeed,
      windDirection,
      reducedMotion,
      input,
      multiplayer,
    });

    return dispose;
  }, [windSpeed, windDirection, reducedMotion, input, multiplayer]);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 w-full h-full outline-none"
      tabIndex={0}
      aria-label="Campo 3D interativo"
    />
  );
}

function HudStat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest">{label}</p>
      <p className="font-display text-base sm:text-lg text-white tabular-nums">{value}</p>
    </div>
  );
}
