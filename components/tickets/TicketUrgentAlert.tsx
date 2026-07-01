'use client';

import Link from 'next/link';
import { AlertTriangle, ArrowRight, X } from 'lucide-react';

interface TicketUrgentAlertProps {
  count: number;
  dismissed: boolean;
  onDismiss: () => void;
  action?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
}

export function TicketUrgentAlert({
  count,
  dismissed,
  onDismiss,
  action,
}: TicketUrgentAlertProps) {
  if (count === 0 || dismissed) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 w-[min(360px,calc(100vw-2rem))] animate-in slide-in-from-bottom-4 fade-in duration-300">
      <div className="rounded-xl border border-border bg-card shadow-2xl overflow-hidden">
        <div className="h-1 bg-amber-500" />
        <div className="p-4 flex items-start gap-3">
          <div className="p-2 rounded-lg bg-amber-500/10 shrink-0">
            <AlertTriangle className="h-5 w-5 text-amber-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground">
              Atención requerida
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {count} ticket{count !== 1 ? 's' : ''} requiere
              {count === 1 ? '' : 'n'} atención inmediata
            </p>
            {action &&
              (action.href ? (
                <Link
                  href={action.href}
                  className="inline-flex items-center gap-1 text-xs font-medium text-primary mt-2.5 hover:underline"
                >
                  {action.label}
                  <ArrowRight className="h-3 w-3" />
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={action.onClick}
                  className="inline-flex items-center gap-1 text-xs font-medium text-primary mt-2.5 hover:underline"
                >
                  {action.label}
                  <ArrowRight className="h-3 w-3" />
                </button>
              ))}
          </div>
          <button
            type="button"
            onClick={onDismiss}
            className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors shrink-0"
            aria-label="Cerrar notificación"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
