import { useEffect } from 'react';
import type { MarsPhoto } from '@/types/nasa';
import { getCameraLabel } from '@/utils/roverCameras';
import type { RoverName } from '@/types/nasa';
import { formatSol } from '@/utils/solConverter';

interface PhotoModalProps {
  photo: MarsPhoto | null;
  rover: RoverName;
  onClose: () => void;
}

export function PhotoModal({ photo, rover, onClose }: PhotoModalProps) {
  useEffect(() => {
    if (!photo) return;

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKey);

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKey);
    };
  }, [photo, onClose]);

  if (!photo) return null;

  const meta = [
    { label: 'Frame ID', value: `#${photo.id}`, mono: true },
    { label: 'Sol marciano', value: formatSol(photo.sol), accent: true },
    {
      label: 'Data terrestre',
      value: new Date(photo.earth_date).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      }),
    },
    { label: 'Câmera', value: getCameraLabel(rover, photo.camera.name) },
    { label: 'Status', value: photo.rover.status },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/85 backdrop-blur-md animate-fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Visualizador de foto"
    >
      <div
        className="relative w-full sm:max-w-4xl max-h-[95vh] sm:max-h-[90vh] bg-space-900 sm:rounded-2xl border-t sm:border border-space-700 overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-space-800 sm:hidden">
          <p className="text-sm font-medium text-white">Detalhes da foto</p>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-space-800 text-slate-400 flex items-center justify-center"
            aria-label="Fechar"
          >
            ✕
          </button>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="hidden sm:flex absolute top-3 right-3 z-10 w-9 h-9 rounded-full bg-space-800/90 text-slate-400 hover:text-white items-center justify-center border border-space-700"
          aria-label="Fechar"
        >
          ✕
        </button>

        <div className="flex-1 overflow-auto bg-black/40">
          <img
            src={photo.img_src}
            alt={`Foto ${photo.id} — ${photo.camera.full_name}`}
            className="w-full h-auto max-h-[55vh] sm:max-h-[60vh] object-contain mx-auto"
          />
        </div>

        <div className="p-4 sm:p-5 border-t border-space-700 bg-space-900/95">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {meta.map((item) => (
              <div key={item.label}>
                <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">
                  {item.label}
                </p>
                <p
                  className={`text-sm leading-snug ${
                    item.accent
                      ? 'font-mono text-mars-400'
                      : item.mono
                        ? 'font-mono text-white'
                        : 'text-white capitalize'
                  }`}
                >
                  {item.value}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
