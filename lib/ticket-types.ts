// Ticket / RQ module types

export type TicketPriority = 'alta' | 'media' | 'baja';
export type TicketStatus = 'activo' | 'completado' | 'cancelado';

export interface Ticket {
  id: string;
  teamId?: string;
  teamNombre?: string;
  codigo: string;        // e.g. RQ-001, JIRA-123
  nombre: string;
  descripcion: string;
  asignadoPor: string;   // quien asignó el RQ
  fechaInicio: string;   // YYYY-MM-DD
  fechaFin: string;      // YYYY-MM-DD
  priority: TicketPriority;
  status: TicketStatus;
  createdAt: string;
}

export interface TicketFormData {
  teamId?: string;
  codigo: string;
  nombre: string;
  descripcion: string;
  asignadoPor: string;
  fechaInicio: string;
  fechaFin: string;
  priority: TicketPriority;
  status: TicketStatus;
}

export type AlarmLevel = 'vencido' | 'critico' | 'urgente' | 'proximo' | 'ok';

export function getAlarmLevel(fechaFin: string, status: TicketStatus): AlarmLevel {
  if (status !== 'activo') return 'ok';
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const end = new Date(fechaFin + 'T00:00:00');
  const diffDays = Math.ceil((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return 'vencido';
  if (diffDays === 0) return 'critico';
  if (diffDays <= 3) return 'urgente';
  if (diffDays <= 7) return 'proximo';
  return 'ok';
}

export const ALARM_CONFIG: Record<AlarmLevel, { label: string; className: string; icon: string }> = {
  vencido: { label: 'Vencido', className: 'bg-red-600 text-white', icon: '🚨' },
  critico: { label: 'Vence hoy', className: 'bg-red-600 text-white', icon: '🔴' },
  urgente: { label: 'Vence pronto', className: 'bg-orange-500 text-white', icon: '🟠' },
  proximo: { label: 'Próx. a vencer', className: 'bg-amber-500 text-white', icon: '🟡' },
  ok: { label: 'En tiempo', className: 'bg-emerald-600 text-white', icon: '🟢' },
};

export const TICKET_PRIORITY_LABELS: Record<TicketPriority, string> = {
  alta: 'Alta',
  media: 'Media',
  baja: 'Baja',
};

export const TICKET_PRIORITY_COLORS: Record<TicketPriority, string> = {
  alta: 'bg-red-600 text-white',
  media: 'bg-amber-500 text-white',
  baja: 'bg-zinc-500 text-white',
};

export const TICKET_STATUS_LABELS: Record<TicketStatus, string> = {
  activo: 'Activo',
  completado: 'Completado',
  cancelado: 'Cancelado',
};

export const TICKET_STATUS_COLORS: Record<TicketStatus, string> = {
  activo: 'bg-blue-600 text-white',
  completado: 'bg-emerald-600 text-white',
  cancelado: 'bg-zinc-500 text-white',
};
