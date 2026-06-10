import axios from 'axios';
import type { MarsPhoto, RoverName } from '@/types/nasa';
import type { PhotoQueryParams } from './marsPhotos';
import { MarsPhotosServiceError } from './marsPhotosErrors';

const MARSVISTA_API_KEY = import.meta.env.VITE_MARSVISTA_API_KEY;

const marsVistaApi = axios.create({
  baseURL: 'https://api.marsvista.dev',
  timeout: 20_000,
  headers: MARSVISTA_API_KEY ? { 'X-API-Key': MARSVISTA_API_KEY } : {},
});

interface VistaPhotoResource {
  id: number;
  attributes: {
    sol?: number;
    earth_date?: string;
    img_src?: string;
    images?: { full?: string; large?: string; medium?: string; small?: string };
  };
  relationships?: {
    rover?: { id: string; attributes?: { name?: string; status?: string } };
    camera?: { id: string; attributes?: { full_name?: string; name?: string } };
  };
}

interface VistaPhotosResponse {
  data: VistaPhotoResource[];
  pagination?: { page?: number; per_page?: number; total_pages?: number };
}

function mapVistaPhoto(photo: VistaPhotoResource): MarsPhoto {
  const attrs = photo.attributes;
  const rover = photo.relationships?.rover;
  const camera = photo.relationships?.camera;

  return {
    id: photo.id,
    sol: attrs.sol ?? 0,
    camera: {
      id: 0,
      name: camera?.attributes?.name ?? camera?.id ?? 'UNKNOWN',
      full_name: camera?.attributes?.full_name ?? camera?.id ?? 'Câmera desconhecida',
    },
    img_src:
      attrs.images?.large ??
      attrs.images?.full ??
      attrs.images?.medium ??
      attrs.img_src ??
      '',
    earth_date: attrs.earth_date ?? '',
    rover: {
      name: rover?.attributes?.name ?? rover?.id ?? '',
      status: rover?.attributes?.status === 'complete' ? 'complete' : 'active',
      landing_date: '',
      launch_date: '',
    },
  };
}

export function hasMarsVistaKey(): boolean {
  return Boolean(MARSVISTA_API_KEY);
}

export async function fetchRoverPhotosFromMarsVista(
  params: PhotoQueryParams,
): Promise<MarsPhoto[]> {
  if (!MARSVISTA_API_KEY) {
    throw new MarsPhotosServiceError(
      'NO_PROVIDER',
      'Configure VITE_MARSVISTA_API_KEY no arquivo .env para acessar as fotos.',
    );
  }

  const { rover, sol, earthDate, camera, page = 1 } = params;

  const queryParams: Record<string, string | number> = {
    rovers: rover,
    include: 'rover,camera',
    per_page: 25,
    page,
  };

  if (sol !== undefined) {
    queryParams.sol_min = sol;
    queryParams.sol_max = sol;
  }
  if (earthDate) {
    queryParams.date_min = earthDate;
    queryParams.date_max = earthDate;
  }
  if (camera) {
    queryParams.cameras = camera;
  }

  try {
    const { data } = await marsVistaApi.get<VistaPhotosResponse>('/api/v2/photos', {
      params: queryParams,
    });
    return (data.data ?? []).map(mapVistaPhoto).filter((p) => p.img_src);
  } catch (error) {
    if (axios.isAxiosError(error)) {
      if (error.response?.status === 401) {
        throw new MarsPhotosServiceError(
          'UNAUTHORIZED',
          'Chave Mars Vista inválida. Verifique VITE_MARSVISTA_API_KEY no .env.',
        );
      }
      if (error.response?.status === 429) {
        throw new MarsPhotosServiceError(
          'RATE_LIMIT',
          'Limite de requisições do Mars Vista atingido. Tente novamente em instantes.',
        );
      }
    }
    throw error;
  }
}

export async function fetchRoverMaxSol(rover: RoverName): Promise<number | null> {
  if (!MARSVISTA_API_KEY) return null;

  try {
    const { data } = await marsVistaApi.get<{
      data: { attributes: { max_sol: number } };
    }>(`/api/v2/rovers/${rover}`);
    return data.data?.attributes?.max_sol ?? null;
  } catch {
    return null;
  }
}
