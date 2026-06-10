import { EmptyState } from '@/components/ui/EmptyState';

interface OfflineScreenProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
}

export function OfflineScreen({
  title = 'Sem conexão',
  message = 'Este conteúdo ainda não foi salvo localmente. Conecte-se à internet para buscar novos dados.',
  onRetry,
}: OfflineScreenProps) {
  return (
    <EmptyState
      icon={
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M18.364 5.636a9 9 0 010 12.728M5.636 5.636a9 9 0 000 12.728M12 12h.01M8.5 12a3.5 3.5 0 107 0 3.5 3.5 0 00-7 0z"
          />
        </svg>
      }
      title={title}
      message={message}
      actionLabel={onRetry ? 'Tentar novamente' : undefined}
      onAction={onRetry}
    />
  );
}
