import { useQuery } from '@tanstack/react-query';
import { fetchLatestWeather, fetchWeatherHistory } from '@/services/marsWeather';
import { isNetworkError } from '@/services/api';

export function useMarsWeather() {
  return useQuery({
    queryKey: ['mars-weather', 'latest'],
    queryFn: fetchLatestWeather,
    staleTime: 1000 * 60 * 30,
    gcTime: 1000 * 60 * 60 * 24,
    retry: 2,
    meta: { isNetworkError },
  });
}

export function useMarsWeatherHistory(count = 7) {
  return useQuery({
    queryKey: ['mars-weather', 'history', count],
    queryFn: () => fetchWeatherHistory(count),
    staleTime: 1000 * 60 * 30,
    gcTime: 1000 * 60 * 60 * 24,
    retry: 2,
  });
}
