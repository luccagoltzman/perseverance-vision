import type { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  title?: string;
  subtitle?: string;
  icon?: ReactNode;
}

export function Card({ children, className = '', title, subtitle, icon }: CardProps) {
  return (
    <div className={`glass-panel p-4 sm:p-5 ${className}`}>
      {(title || icon) && (
        <div className="flex items-start gap-3 mb-3">
          {icon && (
            <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-mars-100 flex items-center justify-center text-mars-600 ring-1 ring-mars-200 dark:bg-mars-600/15 dark:text-mars-400 dark:ring-mars-600/20">
              {icon}
            </div>
          )}
          <div className="min-w-0">
            {title && (
              <h3 className="font-display text-xs sm:text-sm text-content tracking-wide">{title}</h3>
            )}
            {subtitle && <p className="text-[11px] text-content-subtle mt-0.5 truncate">{subtitle}</p>}
          </div>
        </div>
      )}
      {children}
    </div>
  );
}
