import axios from 'axios';

const NASA_API_KEY = import.meta.env.VITE_NASA_API_KEY || 'DEMO_KEY';

export const nasaApi = axios.create({
  baseURL: 'https://api.nasa.gov',
  params: { api_key: NASA_API_KEY },
  timeout: 15_000,
});

export function isNetworkError(error: unknown): boolean {
  if (axios.isAxiosError(error)) {
    return !error.response || error.code === 'ERR_NETWORK';
  }
  return false;
}
