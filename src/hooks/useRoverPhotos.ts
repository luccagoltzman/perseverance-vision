import { useInfiniteQuery } from '@tanstack/react-query';
import { fetchRoverPhotos, type PhotoQueryParams } from '@/services/marsPhotos';
import { isNetworkError } from '@/services/api';

export function useRoverPhotos(params: Omit<PhotoQueryParams, 'page'>) {
  return useInfiniteQuery({
    queryKey: ['rover-photos', params.rover, params.sol, params.earthDate, params.camera],
    queryFn: ({ pageParam }) =>
      fetchRoverPhotos({ ...params, page: pageParam }),
    initialPageParam: 1,
    getNextPageParam: (lastPage, _allPages, lastPageParam) =>
      lastPage.length > 0 ? lastPageParam + 1 : undefined,
    staleTime: 1000 * 60 * 15,
    gcTime: 1000 * 60 * 60 * 24 * 7,
    retry: 2,
    meta: { isNetworkError },
  });
}
