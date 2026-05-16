'use client';

import React, { useState, useEffect } from 'react';
import { cn } from '../../lib/utils';
import { Clock } from 'lucide-react';

interface CountdownTimerProps {
  initialTime: number; // tiempo en segundos
  onExpire?: () => void;
  autoStart?: boolean;
  className?: string;
}

export function CountdownTimer({
  initialTime,
  onExpire,
  autoStart = false,
  className
}: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState(initialTime);
  const [isActive, setIsActive] = useState(autoStart);

  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    if (isActive && timeLeft > 0) {
      intervalId = setInterval(() => {
        setTimeLeft(time => {
          if (time <= 1) {
            setIsActive(false);
            onExpire?.();
            return 0;
          }
          return time - 1;
        });
      }, 1000);
    }

    return () => clearInterval(intervalId);
  }, [isActive, timeLeft, onExpire]);

  // Reiniciar el timer cuando cambie el initialTime
  useEffect(() => {
    setTimeLeft(initialTime);
    if (autoStart) {
      setIsActive(true);
    }
  }, [initialTime, autoStart]);

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const start = () => {
    setIsActive(true);
  };

  const pause = () => {
    setIsActive(false);
  };

  const reset = () => {
    setTimeLeft(initialTime);
    setIsActive(false);
  };

  const restart = () => {
    setTimeLeft(initialTime);
    setIsActive(true);
  };

  const isExpired = timeLeft === 0;
  const progress = ((initialTime - timeLeft) / initialTime) * 100;

  return (
    <div className={cn("flex items-center space-x-2 text-sm", className)}>
      <Clock className="h-4 w-4 text-gray-500" />
      <span className={cn(
        "font-mono font-medium",
        isExpired 
          ? "text-red-600" 
          : timeLeft < 60 
          ? "text-orange-600" 
          : "text-gray-700"
      )}>
        {formatTime(timeLeft)}
      </span>
      
      {!isExpired && (
        <div className="w-16 h-1 bg-gray-200 rounded-full overflow-hidden">
          <div 
            className="h-full bg-blue-600 transition-all duration-1000 ease-linear"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
      
      {isExpired && (
        <span className="text-xs text-red-600 font-medium">
          Expirado
        </span>
      )}
    </div>
  );
}