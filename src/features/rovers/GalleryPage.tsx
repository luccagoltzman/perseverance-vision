import { useState, useMemo, useCallback, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { MarsPhoto, RoverName } from '@/types/nasa';
import { useRoverPhotos } from '@/hooks/useRoverPhotos';
import { useRoverMaxSol } from '@/hooks/useRoverMaxSol';
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll';
import { useOnlineStatus } from '@/hooks/usePWAStatus';
import { RoverSelector } from './RoverSelector';
import { CameraFilter } from './CameraFilter';
import { PhotoGrid } from './PhotoGrid';
import { PhotoModal } from './PhotoModal';
import { PhotoSkeleton } from '@/components/ui/PhotoSkeleton';
import { OfflineScreen } from '@/components/common/OfflineScreen';
import { GalleryAtmosphere } from '@/components/immersive/GalleryAtmosphere';
import { useMarsWeather } from '@/hooks/useMarsWeather';
import { SectionTitle } from '@/components/ui/SectionTitle';
import { Badge } from '@/components/ui/Badge';
import { isNetworkError } from '@/services/api';
import { getCurrentSol, formatSol } from '@/utils/solConverter';
import { getDefaultEarthDate } from '@/services/marsPhotos';
import { isMarsPhotosServiceError } from '@/services/marsPhotosErrors';
import { hasMarsVistaKey } from '@/services/marsVistaPhotos';
import { getRoverManifest } from '@/utils/roverCameras';
import { explainSol } from '@/utils/laypersonLabels';

const VALID_ROVERS: RoverName[] = ['perseverance', 'curiosity', 'opportunity', 'spirit'];

function getPhotosErrorMessage(error: unknown): { title: string; message: string } {
  if (isMarsPhotosServiceError(error)) {
    switch (error.code) {
      case 'NASA_UNAVAILABLE':
        return { title: 'API NASA indisponível', message: error.message };
      case 'RATE_LIMIT':
        return { title: 'Limite de requisições', message: error.message };
      case 'UNAUTHORIZED':
        return { title: 'Chave inválida', message: error.message };
      case 'NO_PROVIDER':
        return { title: 'Provedor não configurado', message: error.message };
    }
  }
  return {
    title: 'Erro ao carregar fotos',
    message: 'Não foi possível obter imagens. Verifique sua conexão e as chaves no .env.',
  };
}

export function GalleryPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const roverParam = searchParams.get('rover') as RoverName | null;
  const initialRover =
    roverParam && VALID_ROVERS.includes(roverParam) ? roverParam : 'perseverance';

  const [rover, setRover] = useState<RoverName>(initialRover);
  const [camera, setCamera] = useState<string | null>(null);
  const [selectedPhoto, setSelectedPhoto] = useState<MarsPhoto | null>(null);
  const [solInput, setSolInput] = useState<string>('');

  const isOnline = useOnlineStatus();
  const { data: marsWeather } = useMarsWeather();
  const estimatedSol = getCurrentSol(rover);
  const { data: maxSol } = useRoverMaxSol(rover);
  const displaySol = maxSol ?? estimatedSol;
  const roverInfo = getRoverManifest(rover);

  const querySol = solInput ? Number(solInput) : undefined;
  const queryEarthDate = !solInput ? getDefaultEarthDate() : undefined;

  useEffect(() => {
    if (roverParam && VALID_ROVERS.includes(roverParam) && roverParam !== rover) {
      setRover(roverParam);
    }
  }, [roverParam, rover]);

  const { data, isLoading, isError, error, fetchNextPage, hasNextPage, isFetchingNextPage, refetch, isFetching } =
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
    setSearchParams({ rover: newRover });
  };

  const filterLabel = solInput
    ? formatSol(Number(solInput))
    : `recentes · ${queryEarthDate}`;

  if (isLoading) {
    return (
      <div>
        <GalleryAtmosphere title="Galeria Marciana" subtitle="Sincronizando feed de imagens..." />
        <PhotoSkeleton count={8} />
      </div>
    );
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
    <div className="space-y-8">
      <GalleryAtmosphere
        title="Galeria Marciana"
        subtitle={`${roverInfo.label} · ${filterLabel} · ${allPhotos.length} registros`}
        windSpeed={marsWeather?.windSpeed}
        windDirection={marsWeather?.windDirection}
      />

      <div className="flex flex-wrap gap-2 px-1">
        <Badge variant="active">{allPhotos.length} fotos</Badge>
        {isFetching && !isLoading && <Badge variant="default">Atualizando…</Badge>}
      </div>

      {!hasMarsVistaKey() && (
        <div className="text-xs text-amber-900 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 dark:text-amber-200/90 dark:bg-amber-500/10 dark:border-amber-500/20">
          Configure <code className="font-mono text-amber-700 dark:text-amber-300">VITE_MARSVISTA_API_KEY</code>{' '}
          para fotos estáveis.{' '}
          <a href="https://marsvista.dev/signin" target="_blank" rel="noopener noreferrer" className="underline">
            Obter chave gratuita
          </a>
        </div>
      )}

      <section className="glass-panel p-4 sm:p-5 space-y-5">
        <SectionTitle title="Rover" subtitle="Selecione o veículo explorador" />
        <RoverSelector selected={rover} onChange={handleRoverChange} />

        <div>
          <label htmlFor="sol-input" className="text-xs text-content-subtle uppercase tracking-wider font-medium">
            Filtrar por Sol (dia em Marte)
          </label>
          <p className="text-[11px] text-content-muted mt-1 mb-2 leading-relaxed">
            Um Sol é um dia marciano (~24h39min). Deixe vazio para ver fotos recentes.
          </p>
          <div className="flex gap-2 mt-1">
            <input
              id="sol-input"
              type="number"
              min={0}
              max={displaySol}
              placeholder={`Ex: ${displaySol.toLocaleString('pt-BR')}`}
              value={solInput}
              onChange={(e) => setSolInput(e.target.value)}
              className="input-field flex-1"
            />
            {solInput && (
              <button
                type="button"
                onClick={() => setSolInput('')}
                className="px-4 py-2 text-xs font-medium text-content-muted hover:text-content rounded-xl border border-border hover:border-mars-300 transition-colors"
              >
                Limpar
              </button>
            )}
          </div>
          {solInput && Number(solInput) > 0 && (
            <p className="text-xs text-mars-700 dark:text-mars-400 mt-2 font-medium">
              {explainSol(Number(solInput), rover).headline}
            </p>
          )}
        </div>

        <CameraFilter
          rover={rover}
          selected={camera}
          onSelect={setCamera}
          counts={cameraCounts}
        />
      </section>

      <section>
        <SectionTitle
          title="Registros"
          subtitle="Toque para ampliar e ver metadados"
          trailing={
            hasNextPage ? (
              <span className="text-[10px] text-slate-500">Role para carregar mais</span>
            ) : allPhotos.length > 0 ? (
              <span className="text-[10px] text-slate-500">Fim da lista</span>
            ) : null
          }
        />
        <PhotoGrid
          photos={allPhotos}
          onPhotoClick={setSelectedPhoto}
          onClearFilters={() => {
            setCamera(null);
            setSolInput('');
          }}
        />
      </section>

      <div ref={sentinelRef} className="h-2">
        {isFetchingNextPage && (
          <div className="pt-4">
            <PhotoSkeleton count={4} />
          </div>
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
