import { useMemo } from 'react';
import type { MarsPhoto } from '@/types/nasa';
import { EmptyState } from '@/components/ui/EmptyState';

interface PhotoGridProps {
  photos: MarsPhoto[];
  onPhotoClick: (photo: MarsPhoto) => void;
  onClearFilters?: () => void;
}

export function PhotoGrid({ photos, onPhotoClick, onClearFilters }: PhotoGridProps) {
  const uniquePhotos = useMemo(() => {
    const seen = new Set<number>();
    return photos.filter((p) => {
      if (seen.has(p.id)) return false;
      seen.add(p.id);
      return true;
    });
  }, [photos]);

  if (uniquePhotos.length === 0) {
    return (
      <EmptyState
        title="Nenhuma foto encontrada"
        message="Tente outro Sol, remova o filtro de câmera ou selecione fotos recentes."
        actionLabel="Limpar filtros"
        onAction={onClearFilters}
      />
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-3">
      {uniquePhotos.map((photo, index) => (
        <button
          key={photo.id}
          type="button"
          onClick={() => onPhotoClick(photo)}
          className="group relative aspect-square rounded-xl overflow-hidden bg-space-800 border border-space-700/50 hover:border-mars-500/50 hover:shadow-lg hover:shadow-mars-900/20 transition-all focus:outline-none focus:ring-2 focus:ring-mars-500/60 active:scale-[0.98]"
          style={{ animationDelay: `${Math.min(index, 12) * 40}ms` }}
        >
          <img
            src={photo.img_src}
            alt={`Sol ${photo.sol} — ${photo.camera.name}`}
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent p-2.5 pt-8 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
            <p className="text-[11px] text-white font-mono font-medium">Sol {photo.sol}</p>
            <p className="text-[10px] text-slate-300 truncate">{photo.camera.name}</p>
          </div>
        </button>
      ))}
    </div>
  );
}
