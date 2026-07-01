'use client';

import { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { TicketAssignedMember } from '../../lib/ticket-types';

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

interface AssignedMembersAvatarsProps {
  members: TicketAssignedMember[];
}

export function AssignedMembersAvatars({ members }: AssignedMembersAvatarsProps) {
  const [open, setOpen] = useState(false);

  if (!members.length) {
    return <span className="text-muted-foreground">—</span>;
  }

  const maxVisible = 3;
  const visible = members.slice(0, maxVisible);
  const extra = members.length - maxVisible;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center hover:opacity-90 transition-opacity focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-full"
        title="Ver miembros asignados"
      >
        <div className="flex items-center">
          {visible.map((member, index) => (
            <Avatar
              key={member.id}
              className="h-8 w-8 border-2 border-card shrink-0"
              style={{
                marginLeft: index === 0 ? 0 : -10,
                zIndex: visible.length - index,
              }}
            >
              <AvatarFallback className="bg-primary text-primary-foreground text-[10px] font-semibold">
                {getInitials(member.nombre)}
              </AvatarFallback>
            </Avatar>
          ))}
          {extra > 0 && (
            <div
              className="h-8 w-8 rounded-full bg-muted border-2 border-card flex items-center justify-center text-[10px] font-semibold text-muted-foreground shrink-0"
              style={{ marginLeft: -10, zIndex: 0 }}
            >
              +{extra}
            </div>
          )}
        </div>
      </button>

      <Dialog.Root open={open} onOpenChange={setOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50" />
          <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-sm bg-card rounded-xl border shadow-xl p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <Dialog.Title className="text-base font-semibold">
                  Miembros asignados
                </Dialog.Title>
                <Dialog.Description className="text-xs text-muted-foreground mt-0.5">
                  {members.length} persona{members.length !== 1 ? 's' : ''} asignada
                  {members.length !== 1 ? 's' : ''} a este ticket
                </Dialog.Description>
              </div>
              <Dialog.Close asChild>
                <button className="p-1.5 rounded-md text-muted-foreground hover:bg-muted">
                  <X className="h-4 w-4" />
                </button>
              </Dialog.Close>
            </div>

            <ul className="space-y-3">
              {members.map((member) => (
                <li key={member.id} className="flex items-center gap-3">
                  <Avatar className="h-10 w-10 shrink-0">
                    <AvatarFallback className="bg-primary text-primary-foreground text-xs font-semibold">
                      {getInitials(member.nombre)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{member.nombre}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {member.email}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
}
