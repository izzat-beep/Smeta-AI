import { QueryClient } from '@tanstack/react-query';
import { ApiError } from '@/lib/api/client';

// TanStack Query — server state. 4xx (client xatosi) da retry qilmaymiz;
// faqat tarmoq/5xx da bir marta qayta urinamiz.
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        if (error instanceof ApiError && error.status >= 400 && error.status < 500) return false;
        return failureCount < 1;
      },
      staleTime: 30_000,
      refetchOnWindowFocus: false,
    },
  },
});
