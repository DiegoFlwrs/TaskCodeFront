'use client';

import { useState, useCallback, useEffect } from 'react';
import { Ticket, TicketFormData } from '../lib/ticket-types';
import apiClient from '../lib/api';
import { CACHE_TTL, fetchCached, getCached, invalidateCache } from '../lib/api-cache';
import { buildQueryString, DEFAULT_PAGE_SIZE, emptyPage, PageResponse } from '../lib/pagination';

const OPTIONS_CACHE_KEY = 'api:tickets:options';

async function fetchTicketOptions(): Promise<Ticket[]> {
  const query = buildQueryString({ page: 0, size: 100 });
  const response = await apiClient.request<PageResponse<Ticket>>(`/api/tickets${query}`);
  return response.content;
}

export function useTickets() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async (force = false) => {
    try {
      if (!force) {
        const cached = getCached<Ticket[]>(OPTIONS_CACHE_KEY);
        if (cached) {
          setTickets(cached);
          setLoading(false);
          return;
        }
      }
      setLoading(true);
      const data = await fetchCached(
        OPTIONS_CACHE_KEY,
        fetchTicketOptions,
        CACHE_TTL.lists,
        { force },
      );
      setTickets(data);
    } catch {
      setTickets([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const invalidate = () => invalidateCache('api:tickets');

  const addTicket = useCallback(async (data: TicketFormData): Promise<Ticket> => {
    const ticket = await apiClient.request<Ticket>('/api/tickets', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    invalidate();
    invalidateCache('api:stats');
    setTickets((prev) => [ticket, ...prev]);
    return ticket;
  }, []);

  const updateTicket = useCallback(async (id: string, data: Partial<TicketFormData>): Promise<void> => {
    const updated = await apiClient.request<Ticket>(`/api/tickets/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    invalidate();
    invalidateCache('api:stats');
    setTickets((prev) => prev.map((t) => (t.id === id ? updated : t)));
  }, []);

  const updateTicketStatus = useCallback(async (id: string, data: Partial<TicketFormData>): Promise<void> => {
    const updated = await apiClient.request<Ticket>(`/api/tickets/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    invalidate();
    invalidateCache('api:stats');
    setTickets((prev) => prev.map((t) => (t.id === id ? updated : t)));
  }, []);

  const deleteTicket = useCallback(async (id: string): Promise<void> => {
    await apiClient.request<void>(`/api/tickets/${id}`, { method: 'DELETE' });
    invalidate();
    invalidateCache('api:stats');
    setTickets((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const requestExtension = useCallback(async (
    id: string,
    fechaFin: string,
    motivo: string,
  ): Promise<Ticket> => {
    const updated = await apiClient.request<Ticket>(`/api/tickets/${id}/extension-request`, {
      method: 'POST',
      body: JSON.stringify({ fechaFin, motivo }),
    });
    invalidate();
    invalidateCache('api:stats');
    setTickets((prev) => prev.map((t) => (t.id === id ? updated : t)));
    return updated;
  }, []);

  const reviewExtension = useCallback(async (
    id: string,
    approved: boolean,
  ): Promise<Ticket> => {
    const updated = await apiClient.request<Ticket>(`/api/tickets/${id}/extension-review`, {
      method: 'POST',
      body: JSON.stringify({ approved }),
    });
    invalidate();
    invalidateCache('api:stats');
    setTickets((prev) => prev.map((t) => (t.id === id ? updated : t)));
    return updated;
  }, []);

  return {
    tickets,
    loading,
    addTicket,
    updateTicket,
    deleteTicket,
    updateTicketStatus,
    requestExtension,
    reviewExtension,
    refetchOptions: fetchAll,
  };
}

export interface TicketPageParams {
  status?: string;
  search?: string;
  page?: number;
  size?: number;
}

export function usePaginatedTickets(params: TicketPageParams) {
  const [data, setData] = useState<PageResponse<Ticket>>(emptyPage(params.size ?? DEFAULT_PAGE_SIZE));
  const [loading, setLoading] = useState(true);

  const fetchPage = useCallback(async (force = false) => {
    try {
      setLoading(true);
      const query = buildQueryString({
        status: params.status && params.status !== 'todos' ? params.status : undefined,
        search: params.search,
        page: params.page ?? 0,
        size: params.size ?? DEFAULT_PAGE_SIZE,
      });
      const cacheKey = `api:tickets:page:${query}`;
      const response = await fetchCached(
        cacheKey,
        () => apiClient.request<PageResponse<Ticket>>(`/api/tickets${query}`),
        CACHE_TTL.lists,
        { force },
      );
      setData(response);
    } catch {
      setData(emptyPage(params.size ?? DEFAULT_PAGE_SIZE));
    } finally {
      setLoading(false);
    }
  }, [params.status, params.search, params.page, params.size]);

  useEffect(() => {
    fetchPage();
  }, [fetchPage]);

  return { data, loading, refetch: () => fetchPage(true) };
}
