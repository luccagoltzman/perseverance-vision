import type { ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  description?: string;
  badge?: ReactNode;
  action?: ReactNode;
}

export function PageHeader({ title, description, badge, action }: PageHeaderProps) {
  return (
    <header className="mb-8">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="space-y-2">
          {badge}
          <h1 className="font-display text-2xl sm:text-3xl text-content tracking-wide leading-tight">
            {title}
          </h1>
          {description && (
            <p className="text-sm text-content-muted max-w-2xl leading-relaxed">{description}</p>
          )}
        </div>
        {action && <div className="flex-shrink-0">{action}</div>}
      </div>
      <div className="mt-6 h-px bg-gradient-to-r from-mars-300/60 via-border to-transparent dark:from-mars-600/40" />
    </header>
  );
}
