import type { MarsPhoto, MarsPhotosResponse, RoverName } from '@/types/nasa';
import { nasaApi } from './api';

export interface PhotoQueryParams {
  rover: RoverName;
  sol?: number;
  earthDate?: string;
  camera?: string;
  page?: number;
}

export async function fetchRoverPhotos(
  params: PhotoQueryParams,
): Promise<MarsPhoto[]> {
  const { rover, sol, earthDate, camera, page = 1 } = params;

  const queryParams: Record<string, string | number> = { page };
  if (sol !== undefined) queryParams.sol = sol;
  if (earthDate) queryParams.earth_date = earthDate;
  if (camera) queryParams.camera = camera;

  const { data } = await nasaApi.get<MarsPhotosResponse>(
    `/mars-photos/api/v1/rovers/${rover}/photos`,
    { params: queryParams },
  );

  return data.photos;
}

export async function fetchPhotosBySol(
  rover: RoverName,
  sol: number,
  camera?: string,
  page = 1,
): Promise<MarsPhoto[]> {
  return fetchRoverPhotos({ rover, sol, camera, page });
}
