'use client';

import { useState, useCallback, useEffect } from 'react';
import { Ticket, TicketFormData } from '../lib/ticket-types';
import apiClient from '../lib/api';
import { CACHE_TTL, fetchCached, getCached, invalidateCache } from '../lib/api-cache';

const CACHE_KEY = 'api:tickets:all';

export function useTickets() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async (force = false) => {
    try {
      if (!force) {
        const cached = getCached<Ticket[]>(CACHE_KEY);
        if (cached) {
          setTickets(cached);
          setLoading(false);
          return;
        }
      }
      setLoading(true);
      const data = await fetchCached(
        CACHE_KEY,
        () => apiClient.request<Ticket[]>('/api/tickets'),
        CACHE_TTL.lists,
        { force },
      );
      setTickets(data);
    } catch {
      // keep empty on error
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const invalidate = () => invalidateCache('api:tickets');

  const addTicket = useCallback(async (data: TicketFormData): Promise<Ticket> => {
    const ticket = await apiClient.request<Ticket>('/api/tickets', {
      method: 'POST',
      body: JSON.stringify(data),
    });
      invalidate();
      invalidateCache('api:stats');
    setTickets((prev) => [...prev, ticket]);
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
  };
}
