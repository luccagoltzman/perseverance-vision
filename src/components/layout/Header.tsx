import { Link, useLocation } from 'react-router-dom';
import { useOnlineStatus, usePWAInstall } from '@/hooks/usePWAStatus';
import { Button } from '@/components/ui/Button';

const navItems = [
  { path: '/', label: 'Dashboard' },
  { path: '/gallery', label: 'Galeria' },
];

export function Header() {
  const location = useLocation();
  const isOnline = useOnlineStatus();
  const { canInstall, promptInstall } = usePWAInstall();

  return (
    <header className="sticky top-0 z-40 bg-space-950/80 backdrop-blur-md border-b border-space-800">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-mars-500 to-mars-700 flex items-center justify-center shadow-lg shadow-mars-900/30">
            <span className="text-white text-xs font-display font-bold">M</span>
          </div>
          <div>
            <h1 className="font-display text-sm text-white tracking-wider group-hover:text-mars-300 transition-colors">
              MARS TELEMETRY
            </h1>
            <p className="text-[10px] text-slate-500 tracking-widest uppercase">Centro de Comando</p>
          </div>
        </Link>

        <nav className="flex items-center gap-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-mars-600/20 text-mars-300'
                    : 'text-slate-400 hover:text-white hover:bg-space-800'
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5" title={isOnline ? 'Online' : 'Offline'}>
            <span
              className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-400 animate-pulse-slow' : 'bg-amber-400'}`}
            />
            <span className="text-xs text-slate-500 hidden sm:inline">
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
