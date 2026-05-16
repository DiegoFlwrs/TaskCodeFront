import { useState, useRef, useEffect } from 'react';

interface UseCodeInputOptions {
  length?: number;
  onComplete?: (code: string) => void;
  autoSubmit?: boolean;
}

interface UseCodeInputReturn {
  code: string[];
  setCode: (code: string[]) => void;
  setValue: (index: number, value: string) => void;
  handleKeyDown: (index: number, event: React.KeyboardEvent<HTMLInputElement>) => void;
  handlePaste: (event: React.ClipboardEvent<HTMLInputElement>) => void;
  handleFocus: (index: number) => void;
  inputRefs: React.MutableRefObject<(HTMLInputElement | null)[]>;
  clear: () => void;
  isComplete: boolean;
  fullCode: string;
}

export function useCodeInput({
  length = 6,
  onComplete,
  autoSubmit = true
}: UseCodeInputOptions = {}): UseCodeInputReturn {
  const [code, setCode] = useState<string[]>(new Array(length).fill(''));
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  
  const fullCode = code.join('');
  const isComplete = fullCode.length === length && !code.includes('');

  // Efecto para auto-completar
  useEffect(() => {
    if (isComplete && autoSubmit && onComplete) {
      onComplete(fullCode);
    }
  }, [isComplete, fullCode, autoSubmit, onComplete]);

  const setValue = (index: number, value: string) => {
    // Solo permitir números
    if (value && !/^\d$/.test(value)) {
      return;
    }

    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);

    // Auto-avanzar al siguiente campo
    if (value && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, event: React.KeyboardEvent<HTMLInputElement>) => {
    const { key } = event;

    switch (key) {
      case 'Backspace':
        if (!code[index] && index > 0) {
          // Si el campo actual está vacío, ir al anterior
          const newCode = [...code];
          newCode[index - 1] = '';
          setCode(newCode);
          inputRefs.current[index - 1]?.focus();
        } else if (code[index]) {
          // Si hay contenido, eliminarlo
          const newCode = [...code];
          newCode[index] = '';
          setCode(newCode);
        }
        break;

      case 'Delete':
        const newCode = [...code];
        newCode[index] = '';
        setCode(newCode);
        break;

      case 'ArrowLeft':
        if (index > 0) {
          inputRefs.current[index - 1]?.focus();
        }
        break;

      case 'ArrowRight':
        if (index < length - 1) {
          inputRefs.current[index + 1]?.focus();
        }
        break;

      case 'Enter':
        if (isComplete && onComplete) {
          onComplete(fullCode);
        }
        break;

      default:
        // Si es un número, reemplazar el valor actual
        if (/^\d$/.test(key)) {
          event.preventDefault();
          setValue(index, key);
        }
        break;
    }
  };

  const handlePaste = (event: React.ClipboardEvent<HTMLInputElement>) => {
    event.preventDefault();
    const pastedData = event.clipboardData.getData('text/plain');
    
    // Filtrar solo números y limitarlo a la longitud máxima
    const numbers = pastedData.replace(/\D/g, '').slice(0, length);
    
    if (numbers) {
      const newCode = new Array(length).fill('');
      for (let i = 0; i < numbers.length; i++) {
        newCode[i] = numbers[i];
      }
      setCode(newCode);
      
      // Enfocar el siguiente campo disponible o el último
      const nextIndex = Math.min(numbers.length, length - 1);
      inputRefs.current[nextIndex]?.focus();
    }
  };

  const handleFocus = (index: number) => {
    // Seleccionar todo el contenido del campo al hacer focus
    const input = inputRefs.current[index];
    if (input) {
      setTimeout(() => {
        input.select();
      }, 0);
    }
  };

  const clear = () => {
    setCode(new Array(length).fill(''));
    inputRefs.current[0]?.focus();
  };

  return {
    code,
    setCode,
    setValue,
    handleKeyDown,
    handlePaste,
    handleFocus,
    inputRefs,
    clear,
    isComplete,
    fullCode,
  };
}