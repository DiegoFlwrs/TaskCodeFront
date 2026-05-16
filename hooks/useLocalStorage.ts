'use client';

import { useState, useEffect, useCallback } from 'react';
import { storage } from '../lib/utils';

// Hook para gestionar localStorage de manera reactiva
export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((val: T) => T)) => void, () => void] {
  // State para almacenar el valor
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      // Obtener del localStorage en el cliente
      if (typeof window === 'undefined') {
        return initialValue;
      }
      
      const item = storage.get(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  // Función para actualizar el valor
  const setValue = useCallback((value: T | ((val: T) => T)) => {
    try {
      // Permitir que value sea una función para la misma API que useState
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      
      // Guardar en state
      setStoredValue(valueToStore);
      
      // Guardar en localStorage
      if (typeof window !== 'undefined') {
        storage.set(key, JSON.stringify(valueToStore));
      }
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error);
    }
  }, [key, storedValue]);

  // Función para remover el valor
  const removeValue = useCallback(() => {
    try {
      setStoredValue(initialValue);
      if (typeof window !== 'undefined') {
        storage.remove(key);
      }
    } catch (error) {
      console.error(`Error removing localStorage key "${key}":`, error);
    }
  }, [key, initialValue]);

  return [storedValue, setValue, removeValue];
}

// Hook para gestionar preferencias del usuario
export function useUserPreferences() {
  const [theme, setTheme] = useLocalStorage<'light' | 'dark' | 'system'>('theme', 'system');
  const [language, setLanguage] = useLocalStorage<string>('language', 'es');
  const [sidebarCollapsed, setSidebarCollapsed] = useLocalStorage<boolean>('sidebar-collapsed', false);

  return {
    theme,
    setTheme,
    language,
    setLanguage,
    sidebarCollapsed,
    setSidebarCollapsed,
  };
}