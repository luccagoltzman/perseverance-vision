import { useState, useMemo, useCallback } from 'react';
import type { MarsPhoto, RoverName } from '@/types/nasa';
import { useRoverPhotos } from '@/hooks/useRoverPhotos';
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll';
import { useOnlineStatus } from '@/hooks/usePWAStatus';
import { RoverSelector } from './RoverSelector';
import { CameraFilter } from './CameraFilter';
import { PhotoGrid } from './PhotoGrid';
import { PhotoModal } from './PhotoModal';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { OfflineScreen } from '@/components/common/OfflineScreen';
import { isNetworkError } from '@/services/api';
import { getCurrentSol, formatSol } from '@/utils/solConverter';

export function GalleryPage() {
  const [rover, setRover] = useState<RoverName>('perseverance');
  const [camera, setCamera] = useState<string | null>(null);
  const [selectedPhoto, setSelectedPhoto] = useState<MarsPhoto | null>(null);
  const [solInput, setSolInput] = useState<string>('');

  const isOnline = useOnlineStatus();
  const currentSol = getCurrentSol(rover);
  const querySol = solInput ? Number(solInput) : currentSol;

  const { data, isLoading, isError, error, fetchNextPage, hasNextPage, isFetchingNextPage, refetch } =
    useRoverPhotos({
      rover,
      sol: querySol,
      camera: camera ?? undefined,
    });

  const allPhotos = useMemo(
    () => data?.pages.flat() ?? [],
    [data],
  );

  const cameraCounts = useMemo(() => {
    const counts: Record<string, number> = { all: allPhotos.length };
    for (const photo of allPhotos) {
      counts[photo.camera.name] = (counts[photo.camera.name] ?? 0) + 1;
    }
    return counts;
  }, [allPhotos]);

  const handleLoadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) fetchNextPage();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const sentinelRef = useInfiniteScroll(handleLoadMore, !!hasNextPage, isFetchingNextPage);

  const handleRoverChange = (newRover: RoverName) => {
    setRover(newRover);
    setCamera(null);
    setSolInput('');
    setSelectedPhoto(null);
  };

  if (isLoading) {
    return <LoadingSpinner label={`Buscando fotos de ${rover}...`} />;
  }

  if (isError && allPhotos.length === 0) {
    const offline = !isOnline || isNetworkError(error);
    return (
      <OfflineScreen
        title={offline ? 'Galeria indisponível offline' : 'Erro ao carregar fotos'}
        message={
          offline
            ? `As fotos do ${formatSol(querySol)} ainda não foram salvas localmente.`
            : 'Não foi possível obter imagens da NASA. Verifique sua conexão.'
        }
        onRetry={() => refetch()}
      />
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <section>
        <h2 className="font-display text-2xl text-white tracking-wide mb-2">
          Exploração Visual
        </h2>
        <p className="text-sm text-slate-500 mb-4">
          Registros fotográficos dos robôs exploradores — {formatSol(querySol)}
        </p>
        <RoverSelector selected={rover} onChange={handleRoverChange} />
      </section>

      <section className="flex flex-col sm:flex-row gap-4 items-start sm:items-end">
        <div className="flex-1">
          <label htmlFor="sol-input" className="text-xs text-slate-500 uppercase tracking-wider">
            Buscar por Sol
          </label>
          <div className="flex gap-2 mt-1">
            <input
              id="sol-input"
              type="number"
              min={0}
              placeholder={`Sol atual: ${currentSol}`}
              value={solInput}
              onChange={(e) => setSolInput(e.target.value)}
              className="flex-1 bg-space-800 border border-space-700 rounded-lg px-4 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-mars-500/50"
            />
            {solInput && (
              <button
                type="button"
                onClick={() => setSolInput('')}
                className="px-3 py-2 text-xs text-slate-400 hover:text-white"
              >
                Limpar
              </button>
            )}
          </div>
        </div>
      </section>

      <CameraFilter
        rover={rover}
        selected={camera}
        onSelect={setCamera}
        counts={cameraCounts}
      />

      <PhotoGrid photos={allPhotos} rover={rover} onPhotoClick={setSelectedPhoto} />

      <div ref={sentinelRef} className="h-4">
        {isFetchingNextPage && (
          <LoadingSpinner size="sm" label="Carregando mais fotos..." />
        )}
      </div>

      <PhotoModal
        photo={selectedPhoto}
        rover={rover}
        onClose={() => setSelectedPhoto(null)}
      />
    </div>
  );
}
