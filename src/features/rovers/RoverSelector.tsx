import type { RoverName } from '@/types/nasa';
import { ROVER_LIST } from '@/utils/roverCameras';

interface RoverSelectorProps {
  selected: RoverName;
  onChange: (rover: RoverName) => void;
}

export function RoverSelector({ selected, onChange }: RoverSelectorProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {ROVER_LIST.map((rover) => (
        <button
          key={rover.name}
          type="button"
          onClick={() => onChange(rover.name)}
          className={`px-4 py-2.5 rounded-lg text-sm font-medium border transition-all ${
            selected === rover.name
              ? 'bg-mars-600/20 border-mars-600/50 text-mars-300'
              : 'bg-space-800/40 border-space-700 text-slate-400 hover:text-white hover:border-space-600'
          }`}
        >
          {rover.label}
          {rover.status === 'completed' && (
            <span className="ml-1.5 text-[10px] text-slate-600">(arquivo)</span>
          )}
        </button>
      ))}
    </div>
  );
}
