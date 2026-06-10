import type { RoverName } from '@/types/nasa';
import { getRoverManifest } from '@/utils/roverCameras';

interface CameraFilterProps {
  rover: RoverName;
  selected: string | null;
  onSelect: (camera: string | null) => void;
  counts: Record<string, number>;
}

export function CameraFilter({ rover, selected, onSelect, counts }: CameraFilterProps) {
  const manifest = getRoverManifest(rover);

  return (
    <div>
      <p className="text-xs text-slate-500 uppercase tracking-wider font-medium mb-2">
        Câmera
      </p>
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-none">
        <FilterChip
          label="Todas"
          count={counts.all}
          active={selected === null}
          onClick={() => onSelect(null)}
        />
        {manifest.cameras.map((camera) => (
          <FilterChip
            key={camera.id}
            label={camera.name}
            count={counts[camera.name] ?? 0}
            active={selected === camera.name}
            onClick={() => onSelect(camera.name)}
          />
        ))}
      </div>
    </div>
  );
}

function FilterChip({
  label,
  count,
  active,
  onClick,
}: {
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`chip flex-shrink-0 ${active ? 'chip-active' : 'chip-default'}`}
    >
      {label}
      <span
        className={`min-w-[1.25rem] px-1.5 py-0.5 rounded-full text-[10px] font-mono ${
          active ? 'bg-mars-900/40' : 'bg-space-900/60'
        }`}
      >
        {count}
      </span>
    </button>
  );
}
