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

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Visualizador de foto"
    >
      <div
        className="relative max-w-4xl w-full max-h-[90vh] bg-space-900 rounded-xl border border-space-700 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-space-800/80 text-slate-400 hover:text-white flex items-center justify-center"
          aria-label="Fechar"
        >
          ✕
        </button>

        <div className="overflow-auto max-h-[60vh]">
          <img
            src={photo.img_src}
            alt={`Foto ${photo.id} — ${photo.camera.full_name}`}
            className="w-full h-auto"
          />
        </div>

        <div className="p-5 border-t border-space-700 grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
          <div>
            <p className="text-slate-500 text-xs uppercase tracking-wider mb-1">Frame ID</p>
            <p className="font-mono text-white">#{photo.id}</p>
          </div>
          <div>
            <p className="text-slate-500 text-xs uppercase tracking-wider mb-1">Sol Marciano</p>
            <p className="font-mono text-mars-400">{formatSol(photo.sol)}</p>
          </div>
          <div>
            <p className="text-slate-500 text-xs uppercase tracking-wider mb-1">Data Terrestre</p>
            <p className="text-white">
              {new Date(photo.earth_date).toLocaleDateString('pt-BR')}
            </p>
          </div>
          <div>
            <p className="text-slate-500 text-xs uppercase tracking-wider mb-1">Câmera</p>
            <p className="text-white text-xs leading-snug">
              {getCameraLabel(rover, photo.camera.name)}
            </p>
          </div>
          <div className="col-span-2 sm:col-span-4">
            <p className="text-slate-500 text-xs uppercase tracking-wider mb-1">
              Status do Veículo
            </p>
            <p className="text-white capitalize">{photo.rover.status}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
