'use client';

import { useState, useCallback, useEffect } from 'react';
import { App, AppFormData } from '../lib/app-types';
import apiClient from '../lib/api';

export function useApps() {
  const [apps, setApps] = useState<App[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    try {
      setLoading(true);
      const data = await apiClient.request<App[]>('/api/apps');
      setApps(data);
    } catch {
      // keep empty on error
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const addApp = useCallback(async (data: AppFormData): Promise<App> => {
    const app = await apiClient.request<App>('/api/apps', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    setApps((prev) => [...prev, app]);
    return app;
  }, []);

  const updateApp = useCallback(async (id: string, data: Partial<AppFormData>): Promise<void> => {
    const updated = await apiClient.request<App>(`/api/apps/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    setApps((prev) => prev.map((a) => (a.id === id ? updated : a)));
  }, []);

  const deleteApp = useCallback(async (id: string): Promise<void> => {
    await apiClient.request<void>(`/api/apps/${id}`, { method: 'DELETE' });
    setApps((prev) => prev.filter((a) => a.id !== id));
  }, []);

  return { apps, loading, addApp, updateApp, deleteApp };
}
