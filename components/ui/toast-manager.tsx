'use client';

import { createContext, useContext, ReactNode } from 'react';
import { useToast } from '../../hooks/useToast';
import { CustomToast } from './toast';

interface ToastContextType {
  toast: {
    success: (title: string, description?: string, duration?: number) => string;
    error: (title: string, description?: string, duration?: number) => string;
    warning: (title: string, description?: string, duration?: number) => string;
    info: (title: string, description?: string, duration?: number) => string;
  };
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

interface ToastManagerProps {
  children: ReactNode;
}

export function ToastManager({ children }: ToastManagerProps) {
  const { toasts, toast, removeToast } = useToast();

  return (
    <ToastContext.Provider value={{ toast, removeToast }}>
      {children}
      {toasts.map((toastData) => (
        <CustomToast
          key={toastData.id}
          toastType={toastData.type}
          title={toastData.title}
          description={toastData.description}
          onClose={() => removeToast(toastData.id)}
        />
      ))}
    </ToastContext.Provider>
  );
}

export function useToastManager() {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToastManager must be used within a ToastManager');
  }
  return context;
}