import { useMemo } from 'react';
import type { MarsPhoto, RoverName } from '@/types/nasa';

interface PhotoGridProps {
  photos: MarsPhoto[];
  rover: RoverName;
  onPhotoClick: (photo: MarsPhoto) => void;
}

export function PhotoGrid({ photos, onPhotoClick }: PhotoGridProps) {
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
      <p className="text-center text-slate-500 py-12">
        Nenhuma foto encontrada para os filtros selecionados.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
      {uniquePhotos.map((photo) => (
        <button
          key={photo.id}
          type="button"
          onClick={() => onPhotoClick(photo)}
          className="group relative aspect-square rounded-lg overflow-hidden bg-space-800 border border-space-700/50 hover:border-mars-600/50 transition-colors focus:outline-none focus:ring-2 focus:ring-mars-500"
        >
          <img
            src={photo.img_src}
            alt={`Sol ${photo.sol} — ${photo.camera.name}`}
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <p className="text-[10px] text-white font-mono">Sol {photo.sol}</p>
            <p className="text-[10px] text-slate-300">{photo.camera.name}</p>
          </div>
        </button>
      ))}
    </div>
  );
}
