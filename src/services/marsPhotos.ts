import type { MarsPhoto, MarsPhotosResponse, RoverName } from '@/types/nasa';
import { nasaApi } from './api';
import { fetchRoverPhotosFromMarsVista, hasMarsVistaKey } from './marsVistaPhotos';
import { MarsPhotosServiceError, parseNasaPhotosError } from './marsPhotosErrors';

export interface PhotoQueryParams {
  rover: RoverName;
  sol?: number;
  earthDate?: string;
  camera?: string;
  page?: number;
}

export function getDefaultEarthDate(): string {
  const date = new Date();
  date.setDate(date.getDate() - 3);
  return date.toISOString().split('T')[0];
}

async function fetchRoverPhotosFromNasa(params: PhotoQueryParams): Promise<MarsPhoto[]> {
  const { rover, sol, earthDate, camera, page = 1 } = params;

  const queryParams: Record<string, string | number> = { page };
  if (sol !== undefined) queryParams.sol = sol;
  if (earthDate) queryParams.earth_date = earthDate;
  if (camera) queryParams.camera = camera;

  if (sol === undefined && !earthDate) {
    queryParams.earth_date = getDefaultEarthDate();
  }

  try {
    const { data } = await nasaApi.get<MarsPhotosResponse>(
      `/mars-photos/api/v1/rovers/${rover}/photos`,
      { params: queryParams },
    );
    return data.photos;
  } catch (error) {
    throw parseNasaPhotosError(error);
  }
}

export async function fetchRoverPhotos(params: PhotoQueryParams): Promise<MarsPhoto[]> {
  if (hasMarsVistaKey()) {
    return fetchRoverPhotosFromMarsVista(params);
  }

  try {
    return await fetchRoverPhotosFromNasa(params);
  } catch (error) {
    if (error instanceof MarsPhotosServiceError && error.code === 'NASA_UNAVAILABLE') {
      throw new MarsPhotosServiceError(
        'NASA_UNAVAILABLE',
        `${error.message} Obtenha uma chave gratuita em marsvista.dev e configure VITE_MARSVISTA_API_KEY no .env.`,
      );
    }
    throw error;
  }
}

export async function fetchPhotosBySol(
  rover: RoverName,
  sol: number,
  camera?: string,
  page = 1,
): Promise<MarsPhoto[]> {
  return fetchRoverPhotos({ rover, sol, camera, page });
}
