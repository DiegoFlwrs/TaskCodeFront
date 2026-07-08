'use client';

import { Ticket } from '../../lib/ticket-types';
import {
  TICKET_STATUS_COLORS,
  TICKET_STATUS_LABELS,
} from '../../lib/ticket-types';
import { cn } from '../../lib/utils';

export function TicketStatusBadge({ ticket }: { ticket: Ticket }) {
  if (ticket.pendingExtension) {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-500 text-white whitespace-nowrap">
        Extensión pendiente
      </span>
    );
  }

  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium whitespace-nowrap',
        TICKET_STATUS_COLORS[ticket.status],
      )}
    >
      {TICKET_STATUS_LABELS[ticket.status]}
    </span>
  );
}
