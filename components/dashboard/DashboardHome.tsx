'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useUser } from '../../hooks/useAuth';
import { useTickets } from '../../hooks/useTickets';
import { usePaginatedTasks } from '../../hooks/useTasks';
import { getAlarmLevel } from '../../lib/ticket-types';
import { TASK_STATUS_COLORS, TASK_STATUS_LABELS } from '../../lib/task-types';
import { cn } from '../../lib/utils';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { TicketUrgentAlert } from '../tickets/TicketUrgentAlert';
import {
  CheckSquare,
  Clock,
  TrendingUp,
  ArrowRight,
  Plus,
  Activity,
  Target,
  Zap,
  Ticket,
  AppWindow,
  BarChart2,
} from 'lucide-react';

const quickActions = [
  {
    label: 'Registrar tarea',
    description: 'Agrega una actividad al día de hoy',
    href: '/dashboard/tasks',
    icon: Plus,
    color: 'text-blue-500',
    bg: 'bg-blue-500/10',
  },
  {
    label: 'Tickets / RQ',
    description: 'Gestiona tus requerimientos',
    href: '/dashboard/tickets',
    icon: Ticket,
    color: 'text-violet-500',
    bg: 'bg-violet-500/10',
  },
  {
    label: 'Aplicaciones',
    description: 'Administra tus sistemas',
    href: '/dashboard/apps',
    icon: AppWindow,
    color: 'text-emerald-500',
    bg: 'bg-emerald-500/10',
  },
  {
    label: 'Reportes',
    description: 'Consulta y exporta actividades',
    href: '/dashboard/reports',
    icon: BarChart2,
    color: 'text-primary',
    bg: 'bg-primary/10',
  },
];

export function DashboardHome() {
  const { user } = useUser();
  const { tickets } = useTickets();
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  const { data: todayTasksPage } = usePaginatedTasks({ fecha: todayStr, page: 0, size: 100 });
  const todayTasks = todayTasksPage.content;

  const formattedDate = today.toLocaleDateString('es-ES', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const hour = today.getHours();
  const greeting =
    hour < 12 ? 'Buenos días' : hour < 19 ? 'Buenas tardes' : 'Buenas noches';

  const firstName = user?.nombre?.split(' ')[0] ?? 'Usuario';

  // Live stats
  const todayCompleted = todayTasks.filter((t) => t.status === 'completada').length;

  const urgentTickets = tickets.filter((t) => {
    const l = getAlarmLevel(t.fechaFin, t.status);
    return l === 'vencido' || l === 'critico' || l === 'urgente';
  });

  const [alertDismissed, setAlertDismissed] = useState(false);

  useEffect(() => {
    setAlertDismissed(false);
  }, [urgentTickets.length]);

  const activeTickets = tickets.filter((t) => t.status === 'activo').length;

  const dynamicStats = [
    {
      label: 'Tareas hoy',
      value: String(todayTasks.length),
      sub: `${todayCompleted} completadas`,
      icon: CheckSquare,
      color: 'text-blue-500',
      bg: 'bg-blue-500/10',
    },
    {
      label: 'Tickets activos',
      value: String(activeTickets),
      sub: urgentTickets.length > 0 ? `${urgentTickets.length} requieren atención` : 'Sin alertas',
      icon: Ticket,
      color: urgentTickets.length > 0 ? 'text-red-500' : 'text-violet-500',
      bg: urgentTickets.length > 0 ? 'bg-red-500/10' : 'bg-violet-500/10',
    },
    {
      label: 'Tareas completadas',
      value: String(todayCompleted),
      sub: 'Hoy',
      icon: Target,
      color: 'text-emerald-500',
      bg: 'bg-emerald-500/10',
    },
    {
      label: 'Productividad',
      value: todayTasks.length > 0 ? `${Math.round((todayCompleted / todayTasks.length) * 100)}%` : '—',
      sub: todayTasks.length > 0 ? 'Basado en tareas de hoy' : 'Sin datos hoy',
      icon: TrendingUp,
      color: 'text-amber-500',
      bg: 'bg-amber-500/10',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Welcome */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">
            {greeting}, {firstName} 👋
          </h2>
          <p className="text-muted-foreground mt-1 capitalize">{formattedDate}</p>
        </div>
        {/* <Link href="/dashboard/tasks">
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Nueva tarea
          </Button>
        </Link> */}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {dynamicStats.map((stat) => (
          <Card key={stat.label} className="border shadow-none hover:shadow-sm transition-shadow">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  <p className="text-3xl font-bold mt-1">{stat.value}</p>
                  <p className="text-xs text-muted-foreground mt-1">{stat.sub}</p>
                </div>
                <div className={`p-3 rounded-xl ${stat.bg}`}>
                  <stat.icon className={`h-5 w-5 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick actions */}
      <div>
        <h3 className="text-base font-semibold mb-4 flex items-center gap-2">
          <Zap className="h-4 w-4 text-primary" />
          Accesos rápidos
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {quickActions.map((action) => (
            <Link key={action.label} href={action.href}>
              <Card className="border shadow-none hover:shadow-md hover:border-primary/30 transition-all cursor-pointer group h-full">
                <CardContent className="p-5 flex flex-col gap-3">
                  <div className={`w-10 h-10 rounded-xl ${action.bg} flex items-center justify-center`}>
                    <action.icon className={`h-5 w-5 ${action.color}`} />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-sm">{action.label}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{action.description}</p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent activity */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold flex items-center gap-2">
            <Activity className="h-4 w-4 text-primary" />
            Actividad reciente
          </h3>
          <Link href="/dashboard/tasks">
            <Button variant="ghost" size="sm" className="gap-1 text-xs text-muted-foreground">
              Ver todo <ArrowRight className="h-3 w-3" />
            </Button>
          </Link>
        </div>
        <Card className="border shadow-none">
          {todayTasks.length === 0 ? (
            <CardContent className="py-14 text-center text-muted-foreground">
              <CheckSquare className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm font-medium">Sin actividad reciente</p>
              <p className="text-xs mt-1">Comienza registrando tu primera tarea del día</p>
              <Link href="/dashboard/tasks">
                <Button variant="outline" size="sm" className="mt-4 gap-2">
                  <Plus className="h-4 w-4" />
                  Registrar tarea
                </Button>
              </Link>
            </CardContent>
          ) : (
            <CardContent className="p-0">
              <ul className="divide-y">
                {todayTasks.slice(0, 6).map((task) => (
                  <li key={task.id}>
                    <Link href={`/dashboard/tasks?date=${task.fecha}`} className="flex items-center gap-3 px-5 py-3.5 hover:bg-muted/30 transition-colors">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{task.nombre}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        {task.rqTicket && (
                          <span className="text-xs text-muted-foreground font-mono">{task.rqTicket}</span>
                        )}
                        {task.aplicacion && (
                          <span className="text-xs text-muted-foreground truncate max-w-[140px]">{task.aplicacion}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {(task.horaInicio || task.horaFin) && (
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {task.horaInicio}{task.horaFin ? ` – ${task.horaFin}` : ''}
                        </span>
                      )}
                      <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium', TASK_STATUS_COLORS[task.status])}>
                        {TASK_STATUS_LABELS[task.status]}
                      </span>
                    </div>
                  </Link>
                  </li>
                ))}
              </ul>
              {todayTasks.length > 6 && (
                <div className="px-5 py-3 border-t">
                  <Link href="/dashboard/tasks">
                    <Button variant="ghost" size="sm" className="text-xs gap-1 w-full justify-center text-muted-foreground">
                      Ver {todayTasks.length - 6} tarea{todayTasks.length - 6 !== 1 ? 's' : ''} más <ArrowRight className="h-3 w-3" />
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          )}
        </Card>
      </div>

      {urgentTickets.length > 0 && (
        <TicketUrgentAlert
          count={urgentTickets.length}
          dismissed={alertDismissed}
          onDismiss={() => setAlertDismissed(true)}
          action={{ label: 'Ver tickets', href: '/dashboard/tickets' }}
        />
      )}
    </div>
  );
}
