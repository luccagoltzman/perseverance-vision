import type { RoverName } from '@/types/nasa';
import { getRoverManifest } from '@/utils/roverCameras';
import { Badge } from '@/components/ui/Badge';

interface CameraFilterProps {
  rover: RoverName;
  selected: string | null;
  onSelect: (camera: string | null) => void;
  counts: Record<string, number>;
}

export function CameraFilter({ rover, selected, onSelect, counts }: CameraFilterProps) {
  const manifest = getRoverManifest(rover);

  return (
    <div className="space-y-3">
      <h3 className="text-xs text-slate-500 uppercase tracking-wider font-medium">
        Filtrar por Câmera
      </h3>
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={() => onSelect(null)}>
          <Badge variant={selected === null ? 'active' : 'default'} count={counts.all}>
            Todas
          </Badge>
        </button>
        {manifest.cameras.map((camera) => (
          <button key={camera.id} type="button" onClick={() => onSelect(camera.name)}>
            <Badge
              variant={selected === camera.name ? 'active' : 'default'}
              count={counts[camera.name] ?? 0}
            >
              {camera.name}
            </Badge>
          </button>
        ))}
      </div>
    </div>
  );
}
