interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  label?: string;
}

const sizes = { sm: 'w-5 h-5', md: 'w-8 h-8', lg: 'w-12 h-12' };

export function LoadingSpinner({ size = 'md', label = 'Carregando...' }: LoadingSpinnerProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-8" role="status">
      <div
        className={`${sizes[size]} border-2 border-mars-200 border-t-mars-500 dark:border-mars-600/30 dark:border-t-mars-500 rounded-full animate-spin`}
      />
      <span className="text-sm text-content-subtle">{label}</span>
    </div>
  );
}
