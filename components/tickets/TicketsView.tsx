'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import * as Dialog from '@radix-ui/react-dialog';
import {
  Plus, Pencil, Trash2, X, AlertTriangle, Clock, Filter,
  CheckCircle2, XCircle, Ticket as TicketIcon,
} from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { cn } from '../../lib/utils';
import { useToastManager } from '../ui/toast-manager';
import { useTickets } from '../../hooks/useTickets';
import apiClient from '../../lib/api';
import {
  Ticket, TicketFormData, TicketPriority, TicketStatus,
  TICKET_PRIORITY_LABELS, TICKET_PRIORITY_COLORS,
  TICKET_STATUS_LABELS, TICKET_STATUS_COLORS,
  ALARM_CONFIG, getAlarmLevel, AlarmLevel,
} from '../../lib/ticket-types';

// ---- Schema ----
const schema = z.object({
  teamId: z.string().optional(),
  codigo: z.string().min(1, 'Requerido'),
  nombre: z.string().min(1, 'Requerido'),
  descripcion: z.string(),
  asignadoPor: z.string(),
  fechaInicio: z.string().min(1, 'Requerido'),
  fechaFin: z.string().min(1, 'Requerido'),
  priority: z.enum(['alta', 'media', 'baja']),
  status: z.enum(['activo', 'completado', 'cancelado']),
});

type FormData = z.infer<typeof schema>;

interface TeamOption { id: string; nombre: string; }

// ---- Ticket Form Modal ----
function TicketModal({
  open, onClose, onSave, ticket, teams,
}: {
  open: boolean; onClose: () => void;
  onSave: (data: TicketFormData) => void; ticket?: Ticket | null;
  teams: TeamOption[];
}) {
  const isEditing = Boolean(ticket);
  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: ticket ?? {
      teamId: '', codigo: '', nombre: '', descripcion: '', asignadoPor: '',
      fechaInicio: '', fechaFin: '', priority: 'media', status: 'activo',
    },
  });

  useEffect(() => {
    form.reset(ticket ?? {
      teamId: teams.length > 0 ? teams[0].id : '',
      codigo: '', nombre: '', descripcion: '', asignadoPor: '',
      fechaInicio: '', fechaFin: '', priority: 'media', status: 'activo',
    });
  }, [ticket, open, form, teams]);

  return (
    <Dialog.Root open={open} onOpenChange={(v) => !v && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50" />
        <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-lg bg-card rounded-xl border shadow-xl p-6 max-h-[90vh] overflow-y-auto">
          <div className="flex items-start justify-between mb-5">
            <div>
              <Dialog.Title className="text-base font-semibold">
                {isEditing ? 'Editar ticket' : 'Nuevo ticket / RQ'}
              </Dialog.Title>
              <Dialog.Description className="text-xs text-muted-foreground mt-0.5">
                Registra un requerimiento con fechas y prioridad
              </Dialog.Description>
            </div>
            <Dialog.Close asChild>
              <button className="p-1.5 rounded-md text-muted-foreground hover:bg-muted">
                <X className="h-4 w-4" />
              </button>
            </Dialog.Close>
          </div>

          <form onSubmit={form.handleSubmit((d) => { onSave(d as TicketFormData); onClose(); })} className="space-y-4">
            {teams.length > 0 && (
              <div className="space-y-1.5">
                <Label>Equipo</Label>
                <select
                  {...form.register('teamId')}
                  className="w-full h-9 px-3 rounded-md border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  {teams.map((t) => (
                    <option key={t.id} value={t.id}>{t.nombre}</option>
                  ))}
                </select>
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Código *</Label>
                <Input placeholder="RQ-001" {...form.register('codigo')} error={form.formState.errors.codigo?.message} />
              </div>
              <div className="space-y-1.5">
                <Label>Prioridad</Label>
                <select {...form.register('priority')} className="w-full h-9 px-3 rounded-md border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                  {(Object.entries(TICKET_PRIORITY_LABELS) as [TicketPriority, string][]).map(([v, l]) => (
                    <option key={v} value={v}>{l}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Nombre del requerimiento *</Label>
              <Input placeholder="Descripción breve del ticket" {...form.register('nombre')} error={form.formState.errors.nombre?.message} />
            </div>

            <div className="space-y-1.5">
              <Label>Asignado por</Label>
              <Input placeholder="Nombre de quien asignó el RQ" {...form.register('asignadoPor')} />
            </div>

            <div className="space-y-1.5">
              <Label>Descripción</Label>
              <textarea rows={3} placeholder="Detalle adicional..." {...form.register('descripcion')}
                className="w-full px-3 py-2 rounded-md border bg-background text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Fecha inicio *</Label>
                <Input type="date" {...form.register('fechaInicio')} error={form.formState.errors.fechaInicio?.message} />
              </div>
              <div className="space-y-1.5">
                <Label>Fecha fin *</Label>
                <Input type="date" {...form.register('fechaFin')} error={form.formState.errors.fechaFin?.message} />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Estado</Label>
              <select {...form.register('status')} className="w-full h-9 px-3 rounded-md border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                {(Object.entries(TICKET_STATUS_LABELS) as [TicketStatus, string][]).map(([v, l]) => (
                  <option key={v} value={v}>{l}</option>
                ))}
              </select>
            </div>

            <div className="flex gap-3 justify-end pt-1">
              <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
              <Button type="submit">{isEditing ? 'Guardar cambios' : 'Crear ticket'}</Button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

// ---- Days remaining chip ----
function DaysChip({ fechaFin, status }: { fechaFin: string; status: TicketStatus }) {
  const level = getAlarmLevel(fechaFin, status);
  if (status !== 'activo') return null;
  const cfg = ALARM_CONFIG[level];
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const end = new Date(fechaFin + 'T00:00:00');
  const diff = Math.ceil((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  const text = diff < 0 ? `${Math.abs(diff)}d vencido` : diff === 0 ? 'Hoy' : `${diff}d restantes`;
  return (
    <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium', cfg.className)}>
      {cfg.icon} {text}
    </span>
  );
}

// ---- Filter options ----
type FilterStatus = 'todos' | TicketStatus;

// ---- Main view ----
export function TicketsView() {
  const { tickets, addTicket, updateTicket, deleteTicket } = useTickets();
  const { toast } = useToastManager();
  const [teams, setTeams] = useState<TeamOption[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTicket, setEditingTicket] = useState<Ticket | null>(null);
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('todos');
  const [search, setSearch] = useState('');
  const [completeConfirmTicket, setCompleteConfirmTicket] = useState<Ticket | null>(null);

  useEffect(() => {
    apiClient.request<TeamOption[]>('/api/teams')
      .then(setTeams)
      .catch(() => {});
  }, []);

  // Alert counts
  const alertCount = tickets.filter((t) => {
    const l = getAlarmLevel(t.fechaFin, t.status);
    return l === 'vencido' || l === 'critico' || l === 'urgente';
  }).length;

  const filtered = tickets.filter((t) => {
    const matchStatus = filterStatus === 'todos' || t.status === filterStatus;
    const matchSearch = !search || t.nombre.toLowerCase().includes(search.toLowerCase()) || t.codigo.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  const handleSave = async (data: TicketFormData) => {
    try {
      if (editingTicket) {
        await updateTicket(editingTicket.id, data);
        toast.success('Ticket actualizado', data.codigo);
      } else {
        await addTicket(data);
        toast.success('Ticket creado', data.codigo);
      }
    } catch {
      toast.error('Error', 'No se pudo guardar el ticket');
    }
  };

  const handleDelete = async (id: string, codigo: string) => {
    try {
      await deleteTicket(id);
      toast.success('Ticket eliminado', codigo);
    } catch {
      toast.error('Error', 'No se pudo eliminar el ticket');
    }
  };

  const handleComplete = async (ticket: Ticket) => {
    try {
      await updateTicket(ticket.id, { ...ticket, status: 'completado' });
      toast.success('Ticket completado', ticket.codigo);
    } catch {
      toast.error('Error', 'No se pudo completar el ticket');
    }
  };

  const filterButtons: { label: string; value: FilterStatus }[] = [
    { label: 'Todos', value: 'todos' },
    { label: 'Activos', value: 'activo' },
    { label: 'Completados', value: 'completado' },
    { label: 'Cancelados', value: 'cancelado' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Tickets / RQ</h2>
          <p className="text-sm text-muted-foreground mt-0.5">Gestiona tus requerimientos y tickets de trabajo</p>
        </div>
        <Button className="gap-2" onClick={() => { setEditingTicket(null); setModalOpen(true); }}>
          <Plus className="h-4 w-4" /> Nuevo ticket
        </Button>
      </div>

      {/* Alert banner */}
      {alertCount > 0 && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-red-700 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400">
          <AlertTriangle className="h-5 w-5 shrink-0" />
          <p className="text-sm font-medium">
            {alertCount} ticket{alertCount !== 1 ? 's' : ''} requiere{alertCount === 1 ? '' : 'n'} atención inmediata
          </p>
        </div>
      )}

      {/* Stats row */}
      {tickets.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {(['vencido', 'urgente', 'proximo', 'ok'] as AlarmLevel[]).map((level) => {
            const count = tickets.filter((t) => getAlarmLevel(t.fechaFin, t.status) === level).length;
            const cfg = ALARM_CONFIG[level];
            return (
              <Card key={level} className="border shadow-none">
                <CardContent className="p-4 flex items-center gap-3">
                  <span className="text-xl">{cfg.icon}</span>
                  <div>
                    <p className="text-2xl font-bold">{count}</p>
                    <p className="text-xs text-muted-foreground">{cfg.label}</p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Filters + search */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex gap-1 bg-muted p-1 rounded-lg">
          {filterButtons.map((fb) => (
            <button
              key={fb.value}
              onClick={() => setFilterStatus(fb.value)}
              className={cn(
                'px-3 py-1 rounded-md text-sm transition-colors',
                filterStatus === fb.value
                  ? 'bg-background text-foreground shadow-sm font-medium'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {fb.label}
            </button>
          ))}
        </div>
        <div className="relative flex-1 max-w-xs">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            className="w-full h-9 pl-9 pr-3 rounded-md border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            placeholder="Buscar por nombre o código..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Tickets table */}
      {filtered.length === 0 ? (
        <Card className="border shadow-none">
          <CardContent className="py-14 text-center text-muted-foreground">
            <TicketIcon className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm font-medium">
              {tickets.length === 0 ? 'Sin tickets registrados' : 'Sin resultados'}
            </p>
            {tickets.length === 0 && (
              <Button variant="outline" size="sm" className="mt-4 gap-2" onClick={() => setModalOpen(true)}>
                <Plus className="h-4 w-4" /> Crear primer ticket
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card className="border shadow-none overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              {(() => {
                const showTeam = filtered.some((t) => t.teamNombre);
                const headers = ['Código', 'Nombre', ...(showTeam ? ['Equipo'] : []), 'Asignado por', 'Prioridad', 'Estado', 'Inicio', 'Fin', 'Tiempo', ''];
                return (
                  <>
                    <thead>
                      <tr className="border-b bg-muted/50">
                        {headers.map((h) => (
                          <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                {filtered.map((ticket) => {
                  return (
                  <tr key={ticket.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3">
                      <code className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded font-semibold">{ticket.codigo}</code>
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <span className="font-medium">{ticket.nombre}</span>
                        {ticket.descripcion && (
                          <p className="text-xs text-muted-foreground mt-0.5 truncate max-w-[200px]">{ticket.descripcion}</p>
                        )}
                      </div>
                    </td>
                    {showTeam && (
                      <td className="px-4 py-3 text-sm text-muted-foreground whitespace-nowrap">
                        {ticket.teamNombre || '—'}
                      </td>
                    )}
                    <td className="px-4 py-3 text-sm text-muted-foreground whitespace-nowrap">
                      {ticket.asignadoPor || '—'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium', TICKET_PRIORITY_COLORS[ticket.priority])}>
                        {TICKET_PRIORITY_LABELS[ticket.priority]}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium', TICKET_STATUS_COLORS[ticket.status])}>
                        {TICKET_STATUS_LABELS[ticket.status]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs whitespace-nowrap">{ticket.fechaInicio}</td>
                    <td className="px-4 py-3 text-xs whitespace-nowrap">{ticket.fechaFin}</td>
                    <td className="px-4 py-3">
                      <DaysChip fechaFin={ticket.fechaFin} status={ticket.status} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        {ticket.status !== 'completado' && ticket.status !== 'cancelado' && (
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-emerald-600"
                            title="Completar ticket"
                            onClick={() => setCompleteConfirmTicket(ticket)}>
                            <CheckCircle2 className="h-3.5 w-3.5" />
                          </Button>
                        )}
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground"
                          onClick={() => { setEditingTicket(ticket); setModalOpen(true); }}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive"
                          onClick={() => handleDelete(ticket.id, ticket.codigo)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                  );
                })}
                    </tbody>
                  </>
                );
              })()}
            </table>
          </div>
        </Card>
      )}

      <TicketModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditingTicket(null); }}
        onSave={handleSave}
        ticket={editingTicket}
        teams={teams}
      />

      {/* Complete confirm dialog */}
      <Dialog.Root
        open={Boolean(completeConfirmTicket)}
        onOpenChange={(v) => { if (!v) setCompleteConfirmTicket(null); }}
      >
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50" />
          <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-sm bg-card rounded-xl border shadow-xl p-6">
            <Dialog.Title className="text-base font-semibold">
              ¿Completar este ticket?
            </Dialog.Title>
            <Dialog.Description className="text-sm text-muted-foreground mt-2">
              El ticket será marcado como completado.
              {completeConfirmTicket && (
                <span className="block mt-2 font-medium text-foreground">
                  {completeConfirmTicket.codigo} — {completeConfirmTicket.nombre}
                </span>
              )}
            </Dialog.Description>
            <div className="flex justify-end gap-2 mt-6">
              <Button variant="outline" onClick={() => setCompleteConfirmTicket(null)}>
                Cancelar
              </Button>
              <Button
                onClick={() => {
                  if (completeConfirmTicket) {
                    handleComplete(completeConfirmTicket);
                    setCompleteConfirmTicket(null);
                  }
                }}
              >
                Sí, completar
              </Button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
