'use client';

import { useState, useCallback, useEffect } from 'react';
import apiClient from '../lib/api';
import { CACHE_TTL, fetchCached, getCached, invalidateCache } from '../lib/api-cache';

const CACHE_KEY = 'api:teams:all';

export interface TeamOption {
  id: string;
  nombre: string;
  descripcion?: string;
  codigo?: string;
  members?: unknown[];
}

export function useTeams() {
  const [teams, setTeams] = useState<TeamOption[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async (force = false) => {
    try {
      if (!force) {
        const cached = getCached<TeamOption[]>(CACHE_KEY);
        if (cached) {
          setTeams(cached);
          setLoading(false);
          return;
        }
      }
      setLoading(true);
      const data = await fetchCached(
        CACHE_KEY,
        () => apiClient.request<TeamOption[]>('/api/teams'),
        CACHE_TTL.teams,
        { force },
      );
      setTeams(data);
    } catch {
      // keep empty on error
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const invalidate = () => invalidateCache('api:teams');

  return { teams, loading, fetchAll, invalidate };
}

export function invalidateTeamsCache() {
  invalidateCache('api:teams');
}
