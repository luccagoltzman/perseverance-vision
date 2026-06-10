import type { RoverName } from '@/types/nasa';
import { ROVER_LIST } from '@/utils/roverCameras';

interface RoverSelectorProps {
  selected: RoverName;
  onChange: (rover: RoverName) => void;
}

export function RoverSelector({ selected, onChange }: RoverSelectorProps) {
  return (
    <div
      className="flex gap-1 p-1 rounded-xl bg-space-900/60 border border-space-700/50 overflow-x-auto scrollbar-none"
      role="tablist"
      aria-label="Selecionar rover"
    >
      {ROVER_LIST.map((rover) => {
        const isActive = selected === rover.name;
        return (
          <button
            key={rover.name}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(rover.name)}
            className={`flex-shrink-0 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
              isActive
                ? 'bg-mars-600 text-white shadow-md shadow-mars-900/40'
                : 'text-slate-400 hover:text-white hover:bg-space-800/80'
            }`}
          >
            {rover.label}
            {rover.status === 'completed' && (
              <span className={`ml-1.5 text-[10px] ${isActive ? 'text-mars-200' : 'text-slate-600'}`}>
                · arquivo
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
