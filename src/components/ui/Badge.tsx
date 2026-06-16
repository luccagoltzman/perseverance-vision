import type { ReactNode } from 'react';

interface BadgeProps {
  children: ReactNode;
  variant?: 'default' | 'active' | 'inactive';
  count?: number;
}

const variants = {
  default: 'bg-surface-muted text-content-muted border-border dark:bg-space-700 dark:text-slate-300 dark:border-space-600',
  active: 'bg-mars-100 text-mars-800 border-mars-200 dark:bg-mars-600/30 dark:text-mars-300 dark:border-mars-600/50',
  inactive: 'bg-slate-100 text-slate-500 border-slate-200 dark:bg-slate-800 dark:text-slate-500 dark:border-slate-700',
};

export function Badge({ children, variant = 'default', count }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${variants[variant]}`}
    >
      {children}
      {count !== undefined && (
        <span className="bg-surface-elevated/80 dark:bg-space-900/50 px-1.5 py-0.5 rounded-full text-[10px] font-mono">
          {count}
        </span>
      )}
    </span>
  );
}
