'use client';

import { useState, useCallback, useEffect } from 'react';
import { App, AppFormData } from '../lib/app-types';
import apiClient from '../lib/api';
import { CACHE_TTL, fetchCached, getCached, invalidateCache } from '../lib/api-cache';
import { buildQueryString, DEFAULT_PAGE_SIZE, emptyPage, PageResponse } from '../lib/pagination';

const OPTIONS_CACHE_KEY = 'api:apps:options';

async function fetchAppOptions(): Promise<App[]> {
  const query = buildQueryString({ page: 0, size: 100 });
  const response = await apiClient.request<PageResponse<App>>(`/api/apps${query}`);
  return response.content;
}

export function useApps() {
  const [apps, setApps] = useState<App[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async (force = false) => {
    try {
      if (!force) {
        const cached = getCached<App[]>(OPTIONS_CACHE_KEY);
        if (cached) {
          setApps(cached);
          setLoading(false);
          return;
        }
      }
      setLoading(true);
      const data = await fetchCached(
        OPTIONS_CACHE_KEY,
        fetchAppOptions,
        CACHE_TTL.lists,
        { force },
      );
      setApps(data);
    } catch {
      setApps([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const invalidate = () => invalidateCache('api:apps');

  const addApp = useCallback(async (data: AppFormData): Promise<App> => {
    const app = await apiClient.request<App>('/api/apps', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    invalidate();
    setApps((prev) => [...prev, app]);
    return app;
  }, []);

  const updateApp = useCallback(async (id: string, data: Partial<AppFormData>): Promise<void> => {
    const updated = await apiClient.request<App>(`/api/apps/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    invalidate();
    setApps((prev) => prev.map((a) => (a.id === id ? updated : a)));
  }, []);

  const deleteApp = useCallback(async (id: string): Promise<void> => {
    await apiClient.request<void>(`/api/apps/${id}`, { method: 'DELETE' });
    invalidate();
    setApps((prev) => prev.filter((a) => a.id !== id));
  }, []);

  return { apps, loading, addApp, updateApp, deleteApp, refetchOptions: fetchAll };
}

export interface AppPageParams {
  search?: string;
  page?: number;
  size?: number;
}

export function usePaginatedApps(params: AppPageParams) {
  const [data, setData] = useState<PageResponse<App>>(emptyPage(params.size ?? DEFAULT_PAGE_SIZE));
  const [loading, setLoading] = useState(true);

  const fetchPage = useCallback(async () => {
    try {
      setLoading(true);
      const query = buildQueryString({
        search: params.search,
        page: params.page ?? 0,
        size: params.size ?? DEFAULT_PAGE_SIZE,
      });
      const response = await apiClient.request<PageResponse<App>>(`/api/apps${query}`);
      setData(response);
    } catch {
      setData(emptyPage(params.size ?? DEFAULT_PAGE_SIZE));
    } finally {
      setLoading(false);
    }
  }, [params.search, params.page, params.size]);

  useEffect(() => {
    fetchPage();
  }, [fetchPage]);

  return { data, loading, refetch: fetchPage };
}
