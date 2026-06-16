import { createPortal } from 'react-dom';

interface MarsFieldPhotoViewerProps {
  imageUrl: string | null;
  caption: string;
  onClose: () => void;
}

export function MarsFieldPhotoViewer({ imageUrl, caption, onClose }: MarsFieldPhotoViewerProps) {
  if (!imageUrl) return null;

  const download = () => {
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = `mars-field-${Date.now()}.png`;
    link.click();
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[95] flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Foto capturada no campo marciano"
    >
      <div className="w-full max-w-3xl space-y-4">
        <div className="rounded-xl overflow-hidden border border-white/15 shadow-2xl">
          <img src={imageUrl} alt="Registro do campo marciano" className="w-full h-auto block" />
        </div>
        <p className="text-xs font-mono text-zinc-400 text-center">{caption}</p>
        <div className="flex flex-wrap justify-center gap-2">
          <button
            type="button"
            onClick={download}
            className="px-5 py-2 rounded-lg bg-mars-600 hover:bg-mars-500 text-white text-sm font-medium"
          >
            Baixar foto
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white text-sm border border-white/20"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
