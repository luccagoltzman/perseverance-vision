import { useOnlineStatus } from '@/hooks/usePWAStatus';

export function OfflineBanner() {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div
      role="alert"
      className="fixed top-0 left-0 right-0 z-50 bg-amber-600/95 text-white text-center py-2 px-4 text-sm font-medium backdrop-blur-sm"
    >
      Modo offline — exibindo dados em cache
    </div>
  );
}
