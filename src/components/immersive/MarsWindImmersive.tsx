import { useEffect, useCallback, useRef, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import type { WeatherSnapshot } from '@/types/nasa';
import type { CaptureMatchState, FieldChatMessage, LocalCombatState } from '@/types/multiplayer';
import { createMarsFieldScene } from './marsFieldScene';
import { FieldInputController } from './marsFieldInput';
import { MarsFieldTouchControls } from './MarsFieldTouchControls';
import { MarsFieldChat } from './MarsFieldChat';
import { MarsFieldPhotoViewer } from './MarsFieldPhotoViewer';
import { MarsFieldInventory } from './MarsFieldInventory';
import { MarsFieldCombatHud } from './MarsFieldCombatHud';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';
import { formatSol } from '@/utils/solConverter';
import type { MarsFieldMultiplayerClient } from '@/services/marsFieldMultiplayer';
import { createDefaultCombatState } from '@/services/marsFieldMultiplayer';
import { MarsFieldCaptureHud } from './MarsFieldCaptureHud';

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
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [interactionHint, setInteractionHint] = useState<string | null>(null);
  const [inventoryOpen, setInventoryOpen] = useState(false);
  const [combat, setCombat] = useState<LocalCombatState>(createDefaultCombatState);
  const [capture, setCapture] = useState<CaptureMatchState | null>(null);
  const [nearbyCount, setNearbyCount] = useState(0);
  const [myTeam, setMyTeam] = useState(multiplayer.team);

  const photoCaption = useMemo(
    () =>
      `Elysium Planitia · Sol ${formatSol(weather.sol)} · vento ${weather.windSpeed.toFixed(1)} m/s ${weather.windDirection}`,
    [weather],
  );

  const handleClose = useCallback(() => {
    multiplayer.disconnect();
    onClose();
  }, [multiplayer, onClose]);

  useEffect(() => {
    if (!open) return;

    const remove = multiplayer.addCallbacks({
      onChat: (message) => setMessages((prev) => [...prev, message].slice(-80)),
      onOnlineCount: (count) => setOnlineCount(count),
      onCombatChange: (state) => setCombat(state ?? createDefaultCombatState()),
      onCaptureUpdate: (state) => setCapture(state),
      onCaptureEnded: (state) => setCapture(state),
      onNearbyCountChange: (count) => setNearbyCount(count),
    });

    setCapture(multiplayer.captureState);
    setMyTeam(multiplayer.team);
    setNearbyCount(multiplayer.getNearbyCount());

    return remove;
  }, [open, multiplayer]);

  useEffect(() => {
    input.setPaused(chatOpen || !!photoUrl || inventoryOpen);
  }, [chatOpen, photoUrl, inventoryOpen, input]);

  useEffect(() => {
    if (!open) return;

    const isTyping = () => {
      const el = document.activeElement;
      if (!el) return false;
      const tag = el.tagName;
      return tag === 'INPUT' || tag === 'TEXTAREA';
    };

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (photoUrl) {
          setPhotoUrl(null);
          return;
        }
        if (chatOpen) {
          setChatOpen(false);
          return;
        }
        if (inventoryOpen) {
          setInventoryOpen(false);
          return;
        }
        handleClose();
        return;
      }
      if (e.key === 'Enter' && !chatOpen && !isTyping()) {
        e.preventDefault();
        setChatOpen(true);
        return;
      }
      if ((e.key === 'i' || e.key === 'I') && !isTyping()) {
        e.preventDefault();
        setInventoryOpen((v) => !v);
      }
    };

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKey);

    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', handleKey);
    };
  }, [open, handleClose, chatOpen, photoUrl, inventoryOpen]);

  if (!open) return null;

  return createPortal(
    <>
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
        playerName={playerName}
        multiplayer={multiplayer}
        onPhotoCapture={setPhotoUrl}
        onInteractionHint={setInteractionHint}
      />

      <MarsFieldTouchControls input={input} laserEquipped={combat.laserEquipped && combat.alive} />

      <MarsFieldInventory
        open={inventoryOpen}
        onClose={() => setInventoryOpen(false)}
        laserEquipped={combat.laserEquipped}
        alive={combat.alive}
        onEquip={() => multiplayer.equipLaser()}
        onStow={() => multiplayer.stowLaser()}
      />

      <MarsFieldCaptureHud capture={capture} myTeam={myTeam} />

      <MarsFieldCombatHud
        hp={combat.hp}
        alive={combat.alive}
        respawnAt={combat.respawnAt}
        laserEquipped={combat.laserEquipped}
      />

      <MarsFieldChat
        open={chatOpen}
        onToggle={() => setChatOpen((v) => !v)}
        messages={messages}
        playerName={playerName}
        onlineCount={onlineCount}
        nearbyCount={nearbyCount}
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
            Entre como astronauta · <span className="text-white font-medium">I</span> inventário ·{' '}
            <span className="text-white font-medium">Q</span> atirar ·{' '}
            <span className="text-white font-medium">F</span> rover
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
          <div className="text-right space-y-1">
            {interactionHint && (
              <p className="text-xs font-mono text-mars-300 uppercase tracking-wider animate-pulse">
                {interactionHint}
              </p>
            )}
            <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest hidden md:block">
              F rover · I inventário · Q laser · Enter chat · Esc sair
            </p>
          </div>
        </div>
      </footer>
    </div>
    <MarsFieldPhotoViewer
      imageUrl={photoUrl}
      caption={photoCaption}
      onClose={() => setPhotoUrl(null)}
    />
    </>,
    document.body,
  );
}

function MarsFieldCanvas({
  windSpeed,
  windDirection,
  reducedMotion,
  input,
  playerName,
  multiplayer,
  onPhotoCapture,
  onInteractionHint,
}: {
  windSpeed: number;
  windDirection: string;
  reducedMotion: boolean;
  input: FieldInputController;
  playerName: string;
  multiplayer: MarsFieldMultiplayerClient;
  onPhotoCapture: (url: string) => void;
  onInteractionHint: (hint: string | null) => void;
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
      playerName,
      multiplayer,
      onPhotoCapture,
      onInteractionHint,
    });

    return dispose;
  }, [windSpeed, windDirection, reducedMotion, input, playerName, multiplayer, onPhotoCapture, onInteractionHint]);

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
