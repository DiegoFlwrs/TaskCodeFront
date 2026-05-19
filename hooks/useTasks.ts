'use client';

import { useState, useCallback, useEffect } from 'react';
import { Task, TaskFormData } from '../lib/task-types';
import apiClient from '../lib/api';

export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    try {
      setLoading(true);
      const data = await apiClient.request<Task[]>('/api/tasks');
      setTasks(data);
    } catch {
      // keep empty on error
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const getTasksForDate = useCallback(
    (date: string) => tasks.filter((t) => t.fecha === date),
    [tasks]
  );

  const getDatesWithTasks = useCallback((): string[] => {
    const dates = new Set(tasks.map((t) => t.fecha));
    return Array.from(dates);
  }, [tasks]);

  const addTask = useCallback(async (date: string, data: TaskFormData): Promise<Task> => {
    const task = await apiClient.request<Task>('/api/tasks', {
      method: 'POST',
      body: JSON.stringify({ ...data, fecha: date }),
    });
    setTasks((prev) => [...prev, task]);
    return task;
  }, []);

  const updateTask = useCallback(async (id: string, data: Partial<Task>): Promise<void> => {
    const updated = await apiClient.request<Task>(`/api/tasks/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    setTasks((prev) => prev.map((t) => (t.id === id ? updated : t)));
  }, []);

  const deleteTask = useCallback(async (id: string): Promise<void> => {
    await apiClient.request<void>(`/api/tasks/${id}`, { method: 'DELETE' });
    setTasks((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return { tasks, loading, getTasksForDate, getDatesWithTasks, addTask, updateTask, deleteTask };
}
