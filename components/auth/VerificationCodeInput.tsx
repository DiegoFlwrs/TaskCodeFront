'use client';

import React, { useRef, useEffect, useState } from 'react';
import { cn } from '../../lib/utils';

interface VerificationCodeInputProps {
  length?: number;
  onComplete: (code: string) => void;
  onChange?: (code: string) => void; // Nueva prop para cambios parciales
  error?: boolean;
  disabled?: boolean;
  className?: string;
}

export function VerificationCodeInput({
  length = 6,
  onComplete,
  onChange,
  error = false,
  disabled = false,
  className
}: VerificationCodeInputProps) {
  const [code, setCode] = useState<string[]>(new Array(length).fill(''));
  const [isError, setIsError] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Efecto para el error
  useEffect(() => {
    if (error !== isError) {
      setIsError(error);
      if (error) {
        // Limpiar campos cuando hay error
        setCode(new Array(length).fill(''));
        inputRefs.current[0]?.focus();
      }
    }
  }, [error, isError, length]);

  // Efecto para completar
  useEffect(() => {
    const fullCode = code.join('');
    
    // Llamar onChange si está definido
    if (onChange) {
      onChange(fullCode);
    }
    
    // Llamar onComplete solo cuando esté completo
    if (fullCode.length === length && !fullCode.includes('')) {
      onComplete(fullCode);
    }
  }, [code, length, onComplete, onChange]);

  const handleChange = (index: number, value: string) => {
    const chars = value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();

    const newCode = [...code];

    if (!chars) {
      newCode[index] = '';
      setCode(newCode);
      setIsError(false);
      return;
    }

    if (chars.length === 1) {
      newCode[index] = chars;
      setCode(newCode);
      setIsError(false);

      // Auto-avanzar al siguiente campo
      if (index < length - 1) {
        inputRefs.current[index + 1]?.focus();
      }

      return;
    }

    // Si entran multiples digitos, repartirlos desde el indice actual
    for (let i = 0; i < chars.length && index + i < length; i++) {
      newCode[index + i] = chars[i];
    }

    setCode(newCode);
    setIsError(false);

    const nextIndex = Math.min(index + chars.length, length - 1);
    inputRefs.current[nextIndex]?.focus();
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key.length === 1 && !/^[a-zA-Z0-9]$/.test(e.key)) {
      e.preventDefault();
      return;
    }

    if (e.key === 'Backspace' && !code[index] && index > 0) {
      // Retroceder al campo anterior si el actual está vacío
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text/plain').slice(0, length);
    
    const sanitized = pastedData.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();

    if (!sanitized) {
      return;
    }

    const newCode = new Array(length).fill('');
    for (let i = 0; i < Math.min(sanitized.length, length); i++) {
      newCode[i] = sanitized[i];
    }
    
    setCode(newCode);
    setIsError(false);
    
    // Enfocar el siguiente campo disponible
    const nextEmptyIndex = newCode.findIndex(digit => !digit);
    if (nextEmptyIndex !== -1) {
      inputRefs.current[nextEmptyIndex]?.focus();
    } else {
      inputRefs.current[length - 1]?.focus();
    }
  };

  const handleFocus = (index: number) => {
    // Seleccionar todo el contenido al hacer focus
    inputRefs.current[index]?.select();
  };

  return (
    <div className={cn("flex space-x-2", className)}>
      {code.map((digit, index) => (
        <input
          key={index}
          ref={(el) => {
            inputRefs.current[index] = el;
          }}
          type="text"
          inputMode="text"
          pattern="[A-Za-z0-9]"
          maxLength={1}
          value={digit}
          onChange={(e) => handleChange(index, e.target.value)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          onPaste={handlePaste}
          onFocus={() => handleFocus(index)}
          disabled={disabled}
          className={cn(
            "w-12 h-12 text-center text-lg font-semibold border rounded-lg",
            "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500",
            "transition-all duration-200",
            isError
              ? "border-red-500 bg-red-50 animate-shake"
              : digit
              ? "border-green-500 bg-green-50"
              : "border-gray-300 bg-white hover:border-gray-400",
            disabled && "bg-gray-100 text-gray-500 cursor-not-allowed",
          )}
          aria-label={`Dígito ${index + 1} del código de verificación`}
        />
      ))}
    </div>
  );
}