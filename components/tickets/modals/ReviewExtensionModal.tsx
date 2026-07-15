'use client';

import { Ticket } from '@/lib/ticket-types';
import * as Dialog from '@radix-ui/react-dialog';
import { useState } from 'react';
import { X, CheckCircle2, XCircle } from 'lucide-react';
import { Button } from '../../ui/button';

export function ReviewExtensionModal({
  ticket,
  onClose,
  onReview,
}: {
  ticket: Ticket | null;
  onClose: () => void;
  onReview: (ticket: Ticket, approved: boolean) => Promise<void>;
}) {
  const [isLoading, setIsLoading] = useState(false);

  const handleReview = async (approved: boolean) => {
    if (!ticket) return;
    setIsLoading(true);
    try {
      await onReview(ticket, approved);
      onClose();
    } finally {
      setIsLoading(false);
    }
  };

  const ext = ticket?.pendingExtension;

  return (
    <Dialog.Root open={Boolean(ticket && ext)} onOpenChange={(v) => !v && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50" />
        <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[calc(100%-2rem)] max-w-md bg-card rounded-xl border shadow-xl p-6">
          <div className="flex items-start justify-between mb-5">
            <div>
              <Dialog.Title className="text-base font-semibold">
                Solicitud de extensión
              </Dialog.Title>
              <Dialog.Description className="text-xs text-muted-foreground mt-0.5">
                {ticket?.codigo} — {ticket?.nombre}
              </Dialog.Description>
            </div>
            <Dialog.Close asChild>
              <button className="p-1.5 rounded-md text-muted-foreground hover:bg-muted">
                <X className="h-4 w-4" />
              </button>
            </Dialog.Close>
          </div>

          {ext && (
            <div className="space-y-3 text-sm">
              <div className="rounded-lg bg-muted/50 p-3 space-y-2">
                <p>
                  <span className="text-muted-foreground">Solicitado por:</span>{' '}
                  <span className="font-medium">{ext.solicitadoPor || '—'}</span>
                </p>
                <p>
                  <span className="text-muted-foreground">Nueva fecha:</span>{' '}
                  <span className="font-medium">{ext.fechaSolicitada}</span>
                </p>
                <p>
                  <span className="text-muted-foreground">Motivo:</span>
                </p>
                <p className="text-foreground whitespace-pre-wrap">{ext.motivo}</p>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 mt-6">
            <Button
              variant="outline"
              onClick={() => handleReview(false)}
              disabled={isLoading}
              className="gap-1.5 text-destructive hover:text-destructive"
            >
              <XCircle className="h-4 w-4" />
              Rechazar
            </Button>
            <Button
              onClick={() => handleReview(true)}
              disabled={isLoading}
              isLoading={isLoading}
              className="gap-1.5"
            >
              <CheckCircle2 className="h-4 w-4" />
              Aprobar
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
