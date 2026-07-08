'use client';

import { useState, useCallback, useEffect } from 'react';
import { App, AppFormData } from '../lib/app-types';
import apiClient from '../lib/api';
import { CACHE_TTL, fetchCached, getCached, invalidateCache } from '../lib/api-cache';

const CACHE_KEY = 'api:apps:all';

export function useApps() {
  const [apps, setApps] = useState<App[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async (force = false) => {
    try {
      if (!force) {
        const cached = getCached<App[]>(CACHE_KEY);
        if (cached) {
          setApps(cached);
          setLoading(false);
          return;
        }
      }
      setLoading(true);
      const data = await fetchCached(
        CACHE_KEY,
        () => apiClient.request<App[]>('/api/apps'),
        CACHE_TTL.lists,
        { force },
      );
      setApps(data);
    } catch {
      // keep empty on error
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

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

  return { apps, loading, addApp, updateApp, deleteApp };
}
