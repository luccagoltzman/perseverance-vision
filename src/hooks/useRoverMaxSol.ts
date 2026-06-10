import { useQuery } from '@tanstack/react-query';
import type { RoverName } from '@/types/nasa';
import { fetchRoverMaxSol, hasMarsVistaKey } from '@/services/marsVistaPhotos';

export function useRoverMaxSol(rover: RoverName) {
  return useQuery({
    queryKey: ['rover-max-sol', rover],
    queryFn: () => fetchRoverMaxSol(rover),
    enabled: hasMarsVistaKey(),
    staleTime: 1000 * 60 * 60 * 24,
  });
}
