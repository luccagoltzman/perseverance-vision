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
    <div
      className={`bg-space-800/60 backdrop-blur-sm border border-space-700/50 rounded-xl p-5 ${className}`}
    >
      {(title || icon) && (
        <div className="flex items-start gap-3 mb-4">
          {icon && (
            <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-mars-600/20 flex items-center justify-center text-mars-400">
              {icon}
            </div>
          )}
          <div>
            {title && <h3 className="font-display text-sm text-white tracking-wide">{title}</h3>}
            {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
          </div>
        </div>
      )}
      {children}
    </div>
  );
}
