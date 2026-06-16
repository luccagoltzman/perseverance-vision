import { Link } from 'react-router-dom';
import { ROVER_LIST } from '@/utils/roverCameras';
import type { RoverName } from '@/types/nasa';
import { getCurrentSol, formatSol } from '@/utils/solConverter';
import { Badge } from '@/components/ui/Badge';

const roverInitial: Record<RoverName, string> = {
  perseverance: 'P',
  curiosity: 'C',
  opportunity: 'O',
  spirit: 'S',
};

export function RoverStatusGrid() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {ROVER_LIST.map((rover) => (
        <Link
          key={rover.name}
          to={`/gallery?rover=${rover.name}`}
          className="group flex items-start gap-4 p-4 rounded-xl bg-surface-card border border-border hover:border-mars-300 hover:shadow-md hover:shadow-mars-100/50 transition-all dark:bg-space-800/40 dark:border-space-700/50 dark:hover:border-mars-600/40 dark:hover:shadow-none"
        >
          <span
            className="flex-shrink-0 w-10 h-10 rounded-lg bg-gradient-to-br from-mars-100 to-mars-50 border border-mars-200 flex items-center justify-center font-display text-sm text-mars-700 dark:from-mars-600/30 dark:to-space-800 dark:border-mars-600/20 dark:text-mars-300"
            aria-hidden
          >
            {roverInitial[rover.name]}
          </span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2 mb-1">
              <span className="font-display text-sm text-content group-hover:text-mars-600 dark:group-hover:text-mars-300 transition-colors">
                {rover.label}
              </span>
              <Badge variant={rover.status === 'active' ? 'active' : 'inactive'}>
                {rover.status === 'active' ? 'Ativo' : 'Arquivo'}
              </Badge>
            </div>
            <p className="text-xs text-content-muted">
              {formatSol(getCurrentSol(rover.name))} · Pouso{' '}
              {new Date(rover.landingDate).toLocaleDateString('pt-BR')}
            </p>
            <p className="text-[11px] text-mars-600 dark:text-mars-500/80 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
              Ver fotos →
            </p>
          </div>
        </Link>
      ))}
    </div>
  );
}
