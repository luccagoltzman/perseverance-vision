import type { ReactNode } from 'react';
import { useTheme } from '@/context/ThemeContext';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <div
      className="flex items-center p-0.5 rounded-full bg-surface-muted border border-border"
      role="group"
      aria-label="Tema da interface"
    >
      <ThemeOption
        label="Claro"
        active={theme === 'light'}
        onClick={() => setTheme('light')}
        icon={
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
            />
          </svg>
        }
      />
      <ThemeOption
        label="Escuro"
        active={theme === 'dark'}
        onClick={() => setTheme('dark')}
        icon={
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
            />
          </svg>
        }
      />
    </div>
  );
}

function ThemeOption({
  label,
  active,
  onClick,
  icon,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  icon: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-[10px] font-medium transition-all ${
        active
          ? 'bg-surface-elevated text-content shadow-sm border border-border'
          : 'text-content-subtle hover:text-content-muted'
      }`}
    >
      {icon}
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}
