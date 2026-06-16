export function PhotoSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="aspect-square rounded-xl bg-surface-muted border border-border animate-pulse dark:bg-space-800/60 dark:border-space-700/40"
          style={{ animationDelay: `${i * 80}ms` }}
        />
      ))}
    </div>
  );
}
