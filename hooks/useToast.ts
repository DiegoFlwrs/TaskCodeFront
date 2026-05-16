'use client';

import { useState, useCallback } from 'react';
import { ToastData } from '../lib/types';

// Hook para manejar notificaciones toast
export function useToast() {
  const [toasts, setToasts] = useState<ToastData[]>([]);

  const addToast = useCallback((
    type: ToastData['type'],
    title: string,
    description?: string,
    duration: number = 5000
  ) => {
    const id = Math.random().toString(36).substr(2, 9);
    
    const newToast: ToastData = {
      id,
      type,
      title,
      description,
      duration,
    };

    setToasts(prev => [...prev, newToast]);

    // Auto-remover después de la duración especificada
    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }

    return id;
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  const clearAllToasts = useCallback(() => {
    setToasts([]);
  }, []);

  // Métodos de conveniencia
  const toast = {
    success: (title: string, description?: string, duration?: number) =>
      addToast('success', title, description, duration),
    
    error: (title: string, description?: string, duration?: number) =>
      addToast('error', title, description, duration),
    
    warning: (title: string, description?: string, duration?: number) =>
      addToast('warning', title, description, duration),
    
    info: (title: string, description?: string, duration?: number) =>
      addToast('info', title, description, duration),
  };

  return {
    toasts,
    addToast,
    removeToast,
    clearAllToasts,
    toast,
  };
}