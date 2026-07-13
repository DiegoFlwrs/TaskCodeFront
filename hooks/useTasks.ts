'use client';

import { useState, useCallback, useEffect } from 'react';
import { Task, TaskFormData } from '../lib/task-types';
import apiClient from '../lib/api';
import { buildQueryString, DEFAULT_PAGE_SIZE, emptyPage, PageResponse } from '../lib/pagination';
import { CACHE_TTL, fetchCached, invalidateCache } from '../lib/api-cache';

export interface TaskPageParams {
  fecha?: string;
  fechaInicio?: string;
  fechaFin?: string;
  rqTicket?: string;
  aplicacion?: string;
  search?: string;
  page?: number;
  size?: number;
}

export interface TaskDateSummary {
  fecha: string;
  count: number;
  completedCount: number;
  allCompleted: boolean;
}

export function useTaskDates() {
  const [summaries, setSummaries] = useState<TaskDateSummary[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDates = useCallback(async () => {
    try {
      setLoading(true);
      const data = await apiClient.request<TaskDateSummary[]>('/api/tasks/dates');
      setSummaries(data);
    } catch {
      setSummaries([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDates();
  }, [fetchDates]);

  return { summaries, loading, refetchDates: fetchDates };
}

export function usePaginatedTasks(params: TaskPageParams) {
  const [data, setData] = useState<PageResponse<Task>>(emptyPage(params.size ?? DEFAULT_PAGE_SIZE));
  const [loading, setLoading] = useState(true);

  const fetchPage = useCallback(async (force = false) => {
    try {
      setLoading(true);
      const query = buildQueryString({
        fecha: params.fecha,
        fechaInicio: params.fechaInicio,
        fechaFin: params.fechaFin,
        rqTicket: params.rqTicket,
        aplicacion: params.aplicacion,
        search: params.search,
        page: params.page ?? 0,
        size: params.size ?? DEFAULT_PAGE_SIZE,
      });
      const cacheKey = `api:tasks:page:${query}`;
      const response = await fetchCached(
        cacheKey,
        () => apiClient.request<PageResponse<Task>>(`/api/tasks${query}`),
        CACHE_TTL.lists,
        { force },
      );
      setData(response);
    } catch {
      setData(emptyPage(params.size ?? DEFAULT_PAGE_SIZE));
    } finally {
      setLoading(false);
    }
  }, [
    params.fecha,
    params.fechaInicio,
    params.fechaFin,
    params.rqTicket,
    params.aplicacion,
    params.search,
    params.page,
    params.size,
  ]);

  useEffect(() => {
    fetchPage();
  }, [fetchPage]);

  return { data, loading, refetch: () => fetchPage(true) };
}

export function useTaskMutations(onChanged?: () => void) {
  const invalidate = () => {
    invalidateCache('api:tasks');
    invalidateCache('api:stats');
    onChanged?.();
  };

  const addTask = useCallback(async (date: string, formData: TaskFormData): Promise<Task> => {
    const task = await apiClient.request<Task>('/api/tasks', {
      method: 'POST',
      body: JSON.stringify({ ...formData, fecha: date }),
    });
    invalidate();
    return task;
  }, [onChanged]);

  const updateTask = useCallback(async (id: string, formData: Partial<Task>): Promise<void> => {
    await apiClient.request<Task>(`/api/tasks/${id}`, {
      method: 'PUT',
      body: JSON.stringify(formData),
    });
    invalidate();
  }, [onChanged]);

  const deleteTask = useCallback(async (id: string): Promise<void> => {
    await apiClient.request<void>(`/api/tasks/${id}`, { method: 'DELETE' });
    invalidate();
  }, [onChanged]);

  return { addTask, updateTask, deleteTask };
}

export async function fetchAllTasksForExport(params: Omit<TaskPageParams, 'page' | 'size'>): Promise<Task[]> {
  const query = buildQueryString({
    ...params,
    page: 0,
    size: 100,
  });
  const first = await apiClient.request<PageResponse<Task>>(`/api/tasks${query}`);
  if (first.totalPages <= 1) {
    return first.content;
  }

  const all = [...first.content];
  for (let page = 1; page < first.totalPages; page += 1) {
    const nextQuery = buildQueryString({ ...params, page, size: 100 });
    const next = await apiClient.request<PageResponse<Task>>(`/api/tasks${nextQuery}`);
    all.push(...next.content);
  }
  return all;
}
