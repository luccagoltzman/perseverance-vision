import { useState, useMemo, useCallback } from 'react';
import type { MarsPhoto, RoverName } from '@/types/nasa';
import { useRoverPhotos } from '@/hooks/useRoverPhotos';
import { useRoverMaxSol } from '@/hooks/useRoverMaxSol';
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
import { getDefaultEarthDate } from '@/services/marsPhotos';
import { isMarsPhotosServiceError } from '@/services/marsPhotosErrors';
import { hasMarsVistaKey } from '@/services/marsVistaPhotos';

function getPhotosErrorMessage(error: unknown): { title: string; message: string } {
  if (isMarsPhotosServiceError(error)) {
    switch (error.code) {
      case 'NASA_UNAVAILABLE':
        return {
          title: 'API NASA indisponível',
          message: error.message,
        };
      case 'RATE_LIMIT':
        return {
          title: 'Limite de requisições',
          message: error.message,
        };
      case 'UNAUTHORIZED':
        return {
          title: 'Chave inválida',
          message: error.message,
        };
      case 'NO_PROVIDER':
        return {
          title: 'Provedor de fotos não configurado',
          message: error.message,
        };
    }
  }

  return {
    title: 'Erro ao carregar fotos',
    message: 'Não foi possível obter imagens. Verifique sua conexão e as chaves no .env.',
  };
}

export function GalleryPage() {
  const [rover, setRover] = useState<RoverName>('perseverance');
  const [camera, setCamera] = useState<string | null>(null);
  const [selectedPhoto, setSelectedPhoto] = useState<MarsPhoto | null>(null);
  const [solInput, setSolInput] = useState<string>('');

  const isOnline = useOnlineStatus();
  const estimatedSol = getCurrentSol(rover);
  const { data: maxSol } = useRoverMaxSol(rover);
  const displaySol = maxSol ?? estimatedSol;

  const querySol = solInput ? Number(solInput) : undefined;
  const queryEarthDate = !solInput ? getDefaultEarthDate() : undefined;

  const { data, isLoading, isError, error, fetchNextPage, hasNextPage, isFetchingNextPage, refetch } =
    useRoverPhotos({
      rover,
      sol: querySol,
      earthDate: queryEarthDate,
      camera: camera ?? undefined,
    });

  const allPhotos = useMemo(() => data?.pages.flat() ?? [], [data]);

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

  const filterLabel = solInput
    ? formatSol(Number(solInput))
    : `fotos recentes (${queryEarthDate})`;

  if (isLoading) {
    return <LoadingSpinner label={`Buscando fotos de ${rover}...`} />;
  }

  if (isError && allPhotos.length === 0) {
    const offline = !isOnline || isNetworkError(error);
    if (offline && !isMarsPhotosServiceError(error)) {
      return (
        <OfflineScreen
          title="Galeria indisponível offline"
          message={`As fotos de ${filterLabel} ainda não foram salvas localmente.`}
          onRetry={() => refetch()}
        />
      );
    }

    const { title, message } = getPhotosErrorMessage(error);
    return <OfflineScreen title={title} message={message} onRetry={() => refetch()} />;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <section>
        <h2 className="font-display text-2xl text-white tracking-wide mb-2">
          Exploração Visual
        </h2>
        <p className="text-sm text-slate-500 mb-4">
          Registros fotográficos dos robôs exploradores — {filterLabel}
        </p>
        {!hasMarsVistaKey() && (
          <p className="text-xs text-amber-500/90 bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2 mb-4">
            A API Mars Photos da NASA está fora do ar. Para fotos estáveis, obtenha uma chave
            gratuita em{' '}
            <a
              href="https://marsvista.dev/signin"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-amber-400"
            >
              marsvista.dev
            </a>{' '}
            e adicione <code className="text-amber-300">VITE_MARSVISTA_API_KEY</code> no .env.
          </p>
        )}
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
              placeholder={`Sol ~${displaySol.toLocaleString('pt-BR')} (deixe vazio para recentes)`}
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
