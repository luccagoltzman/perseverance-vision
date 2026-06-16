import { Link, useLocation } from 'react-router-dom';
import { useOnlineStatus, usePWAInstall } from '@/hooks/usePWAStatus';
import { Button } from '@/components/ui/Button';
import { ThemeToggle } from '@/components/theme/ThemeToggle';

export function Header() {
  const location = useLocation();
  const isOnline = useOnlineStatus();
  const { canInstall, promptInstall } = usePWAInstall();

  return (
    <header className="sticky top-0 z-40 bg-surface-elevated/90 backdrop-blur-xl border-b border-border transition-colors duration-300">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between gap-3">
        <Link to="/" className="flex items-center gap-2.5 group min-w-0">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-mars-400 to-mars-600 flex items-center justify-center shadow-md shadow-mars-300/40 ring-1 ring-mars-300/30 dark:shadow-mars-900/40 dark:ring-mars-500/20">
            <span className="text-white text-[10px] font-display font-bold">M</span>
          </div>
          <div className="min-w-0 hidden sm:block">
            <p className="font-display text-xs text-content tracking-widest truncate group-hover:text-mars-600 dark:group-hover:text-mars-300 transition-colors">
              MARS TELEMETRY
            </p>
          </div>
        </Link>

        <nav className="hidden md:flex items-center gap-1" aria-label="Navegação desktop">
          <NavLink to="/" label="Comando" active={location.pathname === '/'} />
          <NavLink to="/gallery" label="Galeria" active={location.pathname === '/gallery'} />
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          <ThemeToggle />
          <div
            className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-surface-muted border border-border"
            title={isOnline ? 'Conectado' : 'Modo offline'}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-emerald-500 animate-pulse-slow' : 'bg-amber-500'}`}
            />
            <span className="text-[10px] text-content-subtle font-medium hidden sm:inline">
              {isOnline ? 'Online' : 'Offline'}
            </span>
          </div>
          {canInstall && (
            <Button variant="secondary" size="sm" onClick={() => promptInstall()}>
              Instalar
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}

function NavLink({ to, label, active }: { to: string; label: string; active: boolean }) {
  return (
    <Link
      to={to}
      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
        active
          ? 'bg-mars-100 text-mars-700 dark:bg-mars-600/20 dark:text-mars-300'
          : 'text-content-muted hover:text-content hover:bg-surface-muted'
      }`}
    >
      {label}
    </Link>
  );
}
