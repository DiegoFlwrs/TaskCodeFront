'use client';

import { useState, useEffect, useCallback } from 'react';

interface UseCountdownProps {
  initialTime: number; // en segundos
  onExpire?: () => void;
  autoStart?: boolean;
}

interface UseCountdownReturn {
  timeLeft: number;
  isRunning: boolean;
  isExpired: boolean;
  start: () => void;
  reset: () => void;
  stop: () => void;
  formatTime: () => string;
}

export function useCountdown({ 
  initialTime, 
  onExpire, 
  autoStart = false 
}: UseCountdownProps): UseCountdownReturn {
  const [timeLeft, setTimeLeft] = useState(initialTime);
  const [isRunning, setIsRunning] = useState(autoStart);

  // Formatear tiempo como MM:SS
  const formatTime = useCallback(() => {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }, [timeLeft]);

  // Iniciar countdown
  const start = useCallback(() => {
    setIsRunning(true);
  }, []);

  // Reiniciar countdown
  const reset = useCallback(() => {
    setTimeLeft(initialTime);
    setIsRunning(false);
  }, [initialTime]);

  // Parar countdown
  const stop = useCallback(() => {
    setIsRunning(false);
  }, []);

  // Effect para manejar el countdown
  useEffect(() => {
    if (!isRunning || timeLeft <= 0) {
      return;
    }

    const interval = setInterval(() => {
      setTimeLeft(prevTime => {
        if (prevTime <= 1) {
          setIsRunning(false);
          if (onExpire) {
            onExpire();
          }
          return 0;
        }
        return prevTime - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning, timeLeft, onExpire]);

  const isExpired = timeLeft === 0;

  return {
    timeLeft,
    isRunning,
    isExpired,
    start,
    reset,
    stop,
    formatTime,
  };
}