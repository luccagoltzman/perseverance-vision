import axios from 'axios';

export type MarsPhotosErrorCode =
  | 'NASA_UNAVAILABLE'
  | 'RATE_LIMIT'
  | 'UNAUTHORIZED'
  | 'NO_PROVIDER';

export class MarsPhotosServiceError extends Error {
  readonly code: MarsPhotosErrorCode;

  constructor(code: MarsPhotosErrorCode, message: string) {
    super(message);
    this.name = 'MarsPhotosServiceError';
    this.code = code;
  }
}

export function isMarsPhotosServiceError(error: unknown): error is MarsPhotosServiceError {
  return error instanceof MarsPhotosServiceError;
}

function isHerokuNoSuchAppResponse(data: unknown): boolean {
  if (typeof data !== 'string') return false;
  return data.includes('No such app') || data.includes('herokucdn.com/error-pages');
}

export function parseNasaPhotosError(error: unknown): MarsPhotosServiceError {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status;
    const body = error.response?.data;

    if (status === 404 && isHerokuNoSuchAppResponse(body)) {
      return new MarsPhotosServiceError(
        'NASA_UNAVAILABLE',
        'A API Mars Photos da NASA está indisponível (backend Heroku descontinuado).',
      );
    }

    if (status === 404 && typeof body === 'string' && body.includes('heroku')) {
      return new MarsPhotosServiceError(
        'NASA_UNAVAILABLE',
        'A API Mars Photos da NASA está indisponível (backend Heroku descontinuado).',
      );
    }

    if (status === 429) {
      return new MarsPhotosServiceError(
        'RATE_LIMIT',
        'Limite de requisições da NASA atingido. Aguarde alguns minutos ou use Mars Vista.',
      );
    }
  }

  return new MarsPhotosServiceError(
    'NASA_UNAVAILABLE',
    'Não foi possível obter fotos dos rovers pela API da NASA.',
  );
}
