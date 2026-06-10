interface OfflineScreenProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
}

export function OfflineScreen({
  title = 'Sem conexão',
  message = 'Este conteúdo ainda não foi salvo localmente. Conecte-se à internet para buscar novos dados de Marte.',
  onRetry,
}: OfflineScreenProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[40vh] p-8 text-center animate-fade-in">
      <div className="w-20 h-20 mb-6 rounded-full bg-space-800 border border-space-700 flex items-center justify-center">
        <svg
          className="w-10 h-10 text-mars-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M18.364 5.636a9 9 0 010 12.728M5.636 5.636a9 9 0 000 12.728M12 12h.01M8.5 12a3.5 3.5 0 107 0 3.5 3.5 0 00-7 0z"
          />
        </svg>
      </div>
      <h2 className="font-display text-xl text-white mb-2">{title}</h2>
      <p className="text-slate-400 max-w-md text-sm leading-relaxed mb-6">{message}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="px-6 py-2.5 bg-mars-600 hover:bg-mars-500 text-white rounded-lg font-medium transition-colors"
        >
          Tentar novamente
        </button>
      )}
    </div>
  );
}
