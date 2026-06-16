import { useEffect, useCallback, useState } from 'react';
import { createPortal } from 'react-dom';
import type { MarsPhoto } from '@/types/nasa';
import type { RoverName } from '@/types/nasa';
import {
  explainSol,
  explainCamera,
  explainRoverStatus,
  explainFrameId,
  formatEarthDateShort,
} from '@/utils/laypersonLabels';
import { getRoverManifest } from '@/utils/roverCameras';

interface PhotoModalProps {
  photo: MarsPhoto | null;
  rover: RoverName;
  onClose: () => void;
}

export function PhotoModal({ photo, rover, onClose }: PhotoModalProps) {
  const [detailsOpen, setDetailsOpen] = useState(false);
  const handleClose = useCallback(() => onClose(), [onClose]);

  useEffect(() => {
    if (!photo) return;
    setDetailsOpen(false);

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
    };

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKey);

    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', handleKey);
    };
  }, [photo, handleClose]);

  if (!photo) return null;

  const solInfo = explainSol(photo.sol, rover, photo.earth_date);
  const cameraInfo = explainCamera(rover, photo.camera.name);
  const statusInfo = explainRoverStatus(photo.rover.status);
  const roverLabel = getRoverManifest(rover).label;

  return createPortal(
    <div
      className="fixed inset-0 z-[80] flex flex-col bg-black w-screen h-[100dvh] max-h-[100dvh] animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-label="Visualizador de foto em tela cheia"
    >
      {/* Barra superior */}
      <header className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between gap-3 px-4 py-3 pt-[max(0.75rem,env(safe-area-inset-top))] bg-gradient-to-b from-black/90 via-black/50 to-transparent pointer-events-none">
        <div className="min-w-0 pointer-events-auto">
          <p className="text-white text-sm font-medium truncate drop-shadow">{roverLabel}</p>
          <p className="text-white/80 text-xs font-mono truncate drop-shadow">{solInfo.headline}</p>
        </div>
        <button
          type="button"
          onClick={handleClose}
          className="pointer-events-auto flex-shrink-0 w-11 h-11 rounded-full bg-black/50 hover:bg-black/70 text-white text-lg flex items-center justify-center backdrop-blur-sm border border-white/25 transition-colors"
          aria-label="Fechar visualizador"
        >
          ✕
        </button>
      </header>

      {/* Imagem em tela cheia */}
      <div className="absolute inset-0 flex items-center justify-center">
        <img
          src={photo.img_src}
          alt={`Foto ${photo.id} — ${cameraInfo.friendly}`}
          className="w-full h-full object-contain select-none"
          draggable={false}
        />
      </div>

      {/* Painel inferior — cores fixas para legibilidade sobre fundo escuro */}
      <footer className="absolute bottom-0 left-0 right-0 z-20 pb-[env(safe-area-inset-bottom)]">
        <div className="bg-gradient-to-t from-black via-black/95 to-transparent pt-16 sm:pt-20">
          <div className="px-4 sm:px-6 pb-4">
            {/* Resumo sempre visível */}
            <button
              type="button"
              onClick={() => setDetailsOpen((open) => !open)}
              className="w-full text-left rounded-xl bg-white/10 hover:bg-white/15 backdrop-blur-md border border-white/15 p-4 transition-colors"
              aria-expanded={detailsOpen}
            >
              <p className="text-[10px] font-mono uppercase tracking-widest text-mars-300 mb-1">
                Em linguagem simples
              </p>
              <p className="text-base sm:text-lg font-display text-white leading-snug">
                {solInfo.headline}
              </p>
              <p className="text-sm text-zinc-300 mt-2 leading-relaxed line-clamp-2">
                {solInfo.explanation}
              </p>
              <p className="text-xs text-zinc-400 mt-2">
                {detailsOpen ? 'Toque para recolher detalhes ▲' : 'Toque para ver todos os detalhes ▼'}
              </p>
            </button>

            {/* Detalhes expandidos */}
            {detailsOpen && (
              <div className="mt-3 max-h-[40vh] overflow-y-auto rounded-xl bg-zinc-900/95 backdrop-blur-md border border-white/10 p-4 sm:p-5 space-y-4 animate-fade-in">
                <p className="text-sm text-zinc-200 leading-relaxed">{solInfo.explanation}</p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <MetaItem
                    label="Dia em Marte (Sol)"
                    value={solInfo.solLabel}
                    hint="Contagem de dias marcianos desde o pouso do rover."
                  />
                  <MetaItem
                    label="Dia na Terra"
                    value={formatEarthDateShort(photo.earth_date || solInfo.earthDate)}
                    hint={solInfo.earthDateLong}
                  />
                  <MetaItem
                    label="Câmera"
                    value={cameraInfo.friendly}
                    hint={`Código técnico: ${cameraInfo.name}`}
                  />
                  <MetaItem
                    label="Identificador da foto"
                    value={`#${photo.id}`}
                    hint={explainFrameId(photo.id)}
                    mono
                  />
                  <MetaItem
                    label="Rover"
                    value={roverLabel}
                    hint={`Status na época: ${statusInfo.label}`}
                  />
                  <MetaItem
                    label="Situação da missão"
                    value={statusInfo.label}
                    hint={statusInfo.detail}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </footer>
    </div>,
    document.body,
  );
}

function MetaItem({
  label,
  value,
  hint,
  mono = false,
}: {
  label: string;
  value: string;
  hint: string;
  mono?: boolean;
}) {
  return (
    <div className="space-y-1">
      <p className="text-[10px] text-zinc-400 uppercase tracking-wider font-medium">{label}</p>
      <p className={`text-sm text-white leading-snug ${mono ? 'font-mono' : ''}`}>{value}</p>
      <p className="text-xs text-zinc-400 leading-relaxed">{hint}</p>
    </div>
  );
}
