import { Link, useLocation } from 'react-router-dom';

const navItems = [
  {
    path: '/',
    label: 'Comando',
    icon: (active: boolean) => (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={active ? 2 : 1.5}
          d="M4 5a1 1 0 011-1h4a1 1 0 011 1v5a1 1 0 01-1 1H5a1 1 0 01-1-1V5zm10 0a1 1 0 011-1h4a1 1 0 011 1v2a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zm0 6a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1h-4a1 1 0 01-1-1v-7zm-10 3a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4z"
        />
      </svg>
    ),
  },
  {
    path: '/gallery',
    label: 'Galeria',
    icon: (active: boolean) => (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={active ? 2 : 1.5}
          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
        />
      </svg>
    ),
  },
];

export function BottomNav() {
  const location = useLocation();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 md:hidden border-t border-space-800/80 bg-space-950/90 backdrop-blur-xl pb-[env(safe-area-inset-bottom)]"
      aria-label="Navegação principal"
    >
      <div className="flex items-stretch justify-around max-w-lg mx-auto">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`relative flex flex-1 flex-col items-center gap-1 py-3 px-4 transition-colors ${
                isActive ? 'text-mars-400' : 'text-slate-500 active:text-slate-300'
              }`}
            >
              {item.icon(isActive)}
              <span className="text-[10px] font-medium tracking-wide">{item.label}</span>
              {isActive && (
                <span className="absolute bottom-1 w-8 h-0.5 rounded-full bg-mars-500" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
