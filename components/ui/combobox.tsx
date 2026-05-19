'use client';

import { useState, useRef, useEffect } from 'react';
import * as Popover from '@radix-ui/react-popover';
import { Check, ChevronsUpDown, Search } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface ComboboxOption {
  value: string;
  label: string;
  description?: string;
}

interface ComboboxProps {
  options: ComboboxOption[];
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  disabled?: boolean;
  className?: string;
}

export function Combobox({
  options,
  value,
  onChange,
  placeholder = 'Seleccionar...',
  searchPlaceholder = 'Buscar...',
  emptyText = 'Sin resultados',
  disabled,
  className,
}: ComboboxProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = options.filter((o) =>
    o.label.toLowerCase().includes(query.toLowerCase())
  );

  const selected = options.find((o) => o.value === value);

  useEffect(() => {
    if (open) {
      setQuery('');
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  const handleSelect = (val: string) => {
    onChange(val === value ? '' : val);
    setOpen(false);
  };

  return (
    <Popover.Root open={open} onOpenChange={(v) => !disabled && setOpen(v)}>
      <Popover.Trigger asChild>
        <button
          type="button"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            'flex h-9 w-full items-center justify-between rounded-md border bg-background px-3 py-2 text-sm shadow-sm transition-colors',
            'hover:bg-muted/50 focus:outline-none focus:ring-2 focus:ring-ring',
            'disabled:cursor-not-allowed disabled:opacity-50',
            !selected && 'text-muted-foreground',
            className
          )}
        >
          <span className="truncate">{selected?.label ?? placeholder}</span>
          <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
        </button>
      </Popover.Trigger>

      <Popover.Portal>
        <Popover.Content
          className="z-50 w-[var(--radix-popover-trigger-width)] rounded-md border bg-popover text-popover-foreground shadow-md p-0 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95"
          align="start"
          sideOffset={4}
        >
          {/* Search input */}
          <div className="flex items-center border-b px-3">
            <Search className="h-4 w-4 shrink-0 text-muted-foreground mr-2" />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={searchPlaceholder}
              className="flex h-10 w-full bg-transparent py-2 text-sm outline-none placeholder:text-muted-foreground"
            />
          </div>

          {/* Options */}
          <div className="max-h-60 overflow-y-auto p-1">
            {filtered.length === 0 ? (
              <div className="py-6 text-center text-sm text-muted-foreground">
                {emptyText}
              </div>
            ) : (
              filtered.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleSelect(option.value)}
                  className={cn(
                    'flex w-full items-center gap-2 rounded-sm px-2 py-2 text-sm outline-none transition-colors',
                    'hover:bg-accent hover:text-accent-foreground cursor-pointer',
                    value === option.value && 'bg-accent/50 font-medium'
                  )}
                >
                  <Check
                    className={cn(
                      'h-4 w-4 shrink-0',
                      value === option.value ? 'opacity-100 text-primary' : 'opacity-0'
                    )}
                  />
                  <div className="text-left">
                    <span>{option.label}</span>
                    {option.description && (
                      <span className="block text-xs text-muted-foreground">
                        {option.description}
                      </span>
                    )}
                  </div>
                </button>
              ))
            )}
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
