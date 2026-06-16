import { useMemo } from 'react';
import type { MarsPhoto } from '@/types/nasa';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatEarthDateShort } from '@/utils/laypersonLabels';

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
      {uniquePhotos.map((photo, index) => {
        const earthHint = formatEarthDateShort(photo.earth_date);
        return (
          <button
            key={photo.id}
            type="button"
            onClick={() => onPhotoClick(photo)}
            className="photo-reveal group relative aspect-square rounded-xl overflow-hidden bg-surface-muted border border-border hover:border-mars-400 hover:shadow-lg hover:shadow-mars-100/60 transition-all duration-500 focus:outline-none focus:ring-2 focus:ring-mars-400/60 active:scale-[0.98] dark:bg-space-800 dark:hover:border-mars-500/60 dark:hover:shadow-mars-900/20"
            style={{ animationDelay: `${Math.min(index, 16) * 50}ms` }}
            aria-label={`Sol ${photo.sol}, ${earthHint}, câmera ${photo.camera.name}`}
          >
            <img
              src={photo.img_src}
              alt=""
              loading="lazy"
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-content/80 via-transparent to-mars-500/5 opacity-80 group-hover:opacity-100 transition-opacity dark:from-space-950/90 dark:to-mars-900/10" />
            <div className="absolute inset-x-0 bottom-0 p-2.5 text-left">
              <p className="text-[11px] text-white font-mono font-medium tracking-wide">
                Sol {photo.sol}
              </p>
              <p className="text-[10px] text-mars-100 dark:text-mars-200/90">
                ≈ {earthHint}
              </p>
              <p className="text-[10px] text-white/70 truncate mt-0.5">{photo.camera.name}</p>
            </div>
          </button>
        );
      })}
    </div>
  );
}
