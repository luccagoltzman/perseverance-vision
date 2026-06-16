import type { ButtonHTMLAttributes, ReactNode } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  children: ReactNode;
}

const variants = {
  primary: 'bg-mars-500 hover:bg-mars-600 text-white border-mars-400 shadow-sm shadow-mars-200/50 dark:bg-mars-600 dark:hover:bg-mars-500 dark:border-mars-500 dark:shadow-mars-900/30',
  secondary: 'bg-surface-muted hover:bg-mars-50 text-content border-border dark:bg-space-700 dark:hover:bg-space-600 dark:text-slate-200 dark:border-space-600',
  ghost: 'bg-transparent hover:bg-surface-muted text-content-muted border-transparent dark:hover:bg-space-800 dark:text-slate-300',
};

const sizes = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-3 text-base',
};

export function Button({
  variant = 'primary',
  size = 'md',
  className = '',
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      type="button"
      className={`inline-flex items-center justify-center gap-2 font-medium rounded-lg border transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
