export const PAGE_SIZE_OPTIONS = [5, 10, 50, 100] as const;
export const DEFAULT_PAGE_SIZE = 5;

export interface PageResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export function buildQueryString(params: Record<string, string | number | undefined | null>): string {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      search.set(key, String(value));
    }
  });
  const query = search.toString();
  return query ? `?${query}` : '';
}

export function emptyPage<T>(size = DEFAULT_PAGE_SIZE): PageResponse<T> {
  return {
    content: [],
    page: 0,
    size,
    totalElements: 0,
    totalPages: 0,
  };
}
