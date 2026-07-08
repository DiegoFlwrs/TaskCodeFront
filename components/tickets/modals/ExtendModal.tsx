'use client';

import { Ticket } from '@/lib/ticket-types';
import * as Dialog from '@radix-ui/react-dialog';
import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';

function addDays(dateStr: string, days: number): string {
  const date = new Date(`${dateStr}T00:00:00`);
  date.setDate(date.getDate() + days);
  return date.toISOString().split('T')[0];
}

export function ExtendModal({
  ticket,
  mode,
  onClose,
  onSubmit,
}: {
  ticket: Ticket | null;
  mode: 'direct' | 'request';
  onClose: () => void;
  onSubmit: (ticket: Ticket, fechaFin: string, motivo: string) => Promise<void>;
}) {
  const [fechaFin, setFechaFin] = useState('');
  const [motivo, setMotivo] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ fechaFin?: string; motivo?: string }>({});
  const isRequest = mode === 'request';

  useEffect(() => {
    if (ticket) {
      setFechaFin(ticket.fechaFin ?? '');
      setMotivo('');
      setErrors({});
    }
  }, [ticket]);

  const validate = (): boolean => {
    const nextErrors: { fechaFin?: string; motivo?: string } = {};

    if (!fechaFin) {
      nextErrors.fechaFin = 'La fecha es requerida';
    } else if (ticket?.fechaFin) {
      const minDate = isRequest ? addDays(ticket.fechaFin, 1) : ticket.fechaFin;
      if (fechaFin < minDate) {
        nextErrors.fechaFin = isRequest
          ? 'La nueva fecha debe ser posterior a la fecha de fin actual'
          : 'La fecha no puede ser anterior a la fecha de fin actual';
      }
    }

    if (!motivo.trim()) {
      nextErrors.motivo = 'El motivo es requerido';
    } else if (motivo.length > 2000) {
      nextErrors.motivo = 'El motivo no puede superar 2000 caracteres';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!ticket || !validate()) return;
    setIsLoading(true);
    try {
      await onSubmit(ticket, fechaFin, motivo.trim());
      onClose();
    } finally {
      setIsLoading(false);
    }
  };

  const minDate = ticket?.fechaFin
    ? isRequest
      ? addDays(ticket.fechaFin, 1)
      : ticket.fechaFin
    : new Date().toISOString().split('T')[0];

  return (
    <Dialog.Root open={Boolean(ticket)} onOpenChange={(v) => !v && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50" />
        <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-sm bg-card rounded-xl border shadow-xl p-6">
          <div className="flex items-start justify-between mb-5">
            <div>
              <Dialog.Title className="text-base font-semibold">
                {isRequest ? 'Solicitar extensión de plazo' : 'Extender fecha de entrega'}
              </Dialog.Title>
              <Dialog.Description className="text-xs text-muted-foreground mt-0.5">
                {ticket?.codigo} — {ticket?.nombre}
              </Dialog.Description>
              {isRequest && (
                <p className="text-xs text-amber-600 mt-2">
                  Tu solicitud será enviada al líder de equipo para su aprobación.
                </p>
              )}
            </div>
            <Dialog.Close asChild>
              <button className="p-1.5 rounded-md text-muted-foreground hover:bg-muted">
                <X className="h-4 w-4" />
              </button>
            </Dialog.Close>
          </div>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>{isRequest ? 'Nueva fecha solicitada *' : 'Nueva fecha de entrega *'}</Label>
              <Input
                type="date"
                value={fechaFin}
                onChange={(e) => setFechaFin(e.target.value)}
                min={minDate}
              />
              {errors.fechaFin && (
                <p className="text-xs text-destructive">{errors.fechaFin}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label>Motivo *</Label>
              <textarea
                rows={3}
                placeholder={
                  isRequest
                    ? 'Explica por qué necesitas más tiempo...'
                    : 'Explica por qué se extiende el plazo...'
                }
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
                className="w-full px-3 py-2 rounded-md border bg-background text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
              />
              {errors.motivo && (
                <p className="text-xs text-destructive">{errors.motivo}</p>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-6">
            <Button variant="outline" onClick={onClose} disabled={isLoading}>
              Cancelar
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isLoading}
              isLoading={isLoading}
              className="bg-amber-500 hover:bg-amber-600 text-white"
            >
              {isRequest ? 'Enviar solicitud' : 'Extender'}
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
