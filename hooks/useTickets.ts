'use client';

import { useState, useCallback, useEffect } from 'react';
import { Ticket, TicketFormData } from '../lib/ticket-types';
import apiClient from '../lib/api';

export function useTickets() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    try {
      setLoading(true);
      const data = await apiClient.request<Ticket[]>('/api/tickets');
      setTickets(data);
    } catch {
      // keep empty on error
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const addTicket = useCallback(async (data: TicketFormData): Promise<Ticket> => {
    const ticket = await apiClient.request<Ticket>('/api/tickets', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    setTickets((prev) => [...prev, ticket]);
    return ticket;
  }, []);

  const updateTicket = useCallback(async (id: string, data: Partial<TicketFormData>): Promise<void> => {
    const updated = await apiClient.request<Ticket>(`/api/tickets/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    setTickets((prev) => prev.map((t) => (t.id === id ? updated : t)));
  }, []);

  const updateTicketStatus = useCallback(async (id: string, data: Partial<TicketFormData>): Promise<void> => {
    const updated = await apiClient.request<Ticket>(`/api/tickets/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    setTickets((prev) => prev.map((t) => (t.id === id ? updated : t)));
  }, []);

  const deleteTicket = useCallback(async (id: string): Promise<void> => {
    await apiClient.request<void>(`/api/tickets/${id}`, { method: 'DELETE' });
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
