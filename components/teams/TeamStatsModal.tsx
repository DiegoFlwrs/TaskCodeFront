'use client';

import { useState, useEffect, useCallback } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import {
  X, Loader2, BarChart3, Clock,
  Target, AlertTriangle, Users, TrendingUp, Zap, Timer,
} from 'lucide-react';
import { Button } from '../ui/button';
import { cn } from '../../lib/utils';
import apiClient from '../../lib/api';
import { CACHE_TTL, fetchCached, getCached } from '../../lib/api-cache';

// ---- Types ----
type MemberRole = 'LEADER' | 'DEVELOPER' | 'QA' | 'DESIGNER' | 'DEVOPS';

export interface StatsMember {
  id: string;
  nombre: string;
  role: MemberRole;
}

interface TaskStats {
  total: number;
  pendiente: number;
  completada: number;
  tiempoTotalMinutos: number;
  tiempoPromedioMinutos: number;
}

interface TicketStats {
  total: number;
  activo: number;
  completado: number;
  cancelado: number;
  vencido: number;
  venceProximo: number;
  porPrioridad: { alta: number; media: number; baja: number };
}

export interface MemberStatsData {
  memberId: string;
  memberNombre: string;
  memberRole: MemberRole;
  tasks: TaskStats;
  tickets: TicketStats;
}

// ---- Constants ----
const ROLE_LABELS: Record<MemberRole, string> = {
  LEADER: 'Líder', DEVELOPER: 'Desarrollador', QA: 'QA',
  DESIGNER: 'Diseñador', DEVOPS: 'DevOps',
};

const C = {
  completada: '#10b981',
  pendiente:  '#f59e0b',
  alta:       '#ef4444',
  media:      '#f59e0b',
  baja:       '#a1a1aa',
  activo:     '#3b82f6',
  vencido:    '#ef4444',
} as const;

function daysBetween(from: string, to: string): number {
  const start = new Date(`${from}T00:00:00`);
  const end = new Date(`${to}T00:00:00`);
  const diff = Math.round((end.getTime() - start.getTime()) / 86_400_000);
  return Math.max(diff + 1, 1);
}

function formatMinutes(min: number): string {
  if (!min || min <= 0) return '—';
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

function todayStr() { return new Date().toISOString().split('T')[0]; }
function fmtDate(d: Date) { return d.toISOString().split('T')[0]; }

type Preset = 'week' | 'month' | '3months';
function presetRange(p: Preset): { from: string; to: string } {
  const now = new Date();
  if (p === 'week') {
    const mon = new Date(now);
    mon.setDate(now.getDate() - ((now.getDay() + 6) % 7));
    return { from: fmtDate(mon), to: todayStr() };
  }
  if (p === 'month') {
    return { from: fmtDate(new Date(now.getFullYear(), now.getMonth(), 1)), to: todayStr() };
  }
  const start = new Date(now);
  start.setMonth(now.getMonth() - 3);
  return { from: fmtDate(start), to: todayStr() };
}

// ---- Chart components ----

function DonutChart({
  segments, size = 148, strokeWidth = 26, label, value,
}: {
  segments: { value: number; color: string; label: string }[];
  size?: number;
  strokeWidth?: number;
  label?: string;
  value?: string;
}) {
  const r = (size - strokeWidth) / 2;
  const circ = 2 * Math.PI * r;
  const total = segments.reduce((s, d) => s + d.value, 0);

  let run = 0;
  const arcs = total === 0 ? [] : segments
    .filter(s => s.value > 0)
    .map(s => {
      const dash = (s.value / total) * circ;
      const arc = { ...s, dash, offset: -run };
      run += dash;
      return arc;
    });

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle
          cx={size / 2} cy={size / 2} r={r}
          fill="none" stroke="hsl(210 40% 96%)" strokeWidth={strokeWidth}
        />
        {arcs.map((arc, i) => (
          <circle
            key={i}
            cx={size / 2} cy={size / 2} r={r}
            fill="none"
            stroke={arc.color}
            strokeWidth={strokeWidth}
            strokeDasharray={`${arc.dash} ${circ}`}
            strokeDashoffset={arc.offset}
          />
        ))}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        {value && <span className="text-xl font-bold leading-none">{value}</span>}
        {label && <span className="text-[10px] text-muted-foreground mt-0.5 leading-tight max-w-[70px]">{label}</span>}
      </div>
    </div>
  );
}

function RateArc({ rate, size = 52 }: { rate: number; size?: number }) {
  const sw = 5;
  const r = (size - sw) / 2;
  const circ = 2 * Math.PI * r;
  const dash = (rate / 100) * circ;
  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="hsl(210 40% 96%)" strokeWidth={sw} />
      <circle
        cx={size / 2} cy={size / 2} r={r}
        fill="none" stroke="#10b981" strokeWidth={sw}
        strokeDasharray={`${dash} ${circ}`}
        strokeLinecap="round"
      />
    </svg>
  );
}

function KpiCard({
  icon, label, value, sub, rate, accentColor,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  sub?: string;
  rate?: number;
  accentColor: string;
}) {
  return (
    <div className="rounded-xl border bg-card p-4 flex items-start justify-between gap-2">
      <div className="flex flex-col gap-1">
        <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center shrink-0', accentColor)}>
          {icon}
        </div>
        <p className="text-2xl font-bold leading-none mt-2">{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
        {sub && <p className="text-[11px] font-medium text-foreground">{sub}</p>}
      </div>
      {rate !== undefined && (
        <div className="relative shrink-0">
          <RateArc rate={rate} />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-[9px] font-bold">{rate}%</span>
          </div>
        </div>
      )}
    </div>
  );
}

function StackedBarChart({ data }: {
  data: { nombre: string; completada: number; pendiente: number }[];
}) {
  const MAX_H = 110;
  const maxTotal = Math.max(...data.map(d => d.completada + d.pendiente), 1);
  return (
    <div className="flex items-end gap-2" style={{ height: MAX_H + 44 }}>
      {data.map((d) => {
        const total = d.completada + d.pendiente;
        const barH = total === 0 ? 6 : Math.max((total / maxTotal) * MAX_H, 6);
        const segs = [
          { color: C.completada, v: d.completada },
          { color: C.pendiente,  v: d.pendiente },
        ].filter(s => s.v > 0);
        const initials = d.nombre.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
        return (
          <div key={d.nombre} className="flex-1 flex flex-col items-center gap-1.5">
            <span className="text-xs font-medium">{total}</span>
            <div className="w-full rounded-t-md overflow-hidden flex flex-col-reverse" style={{ height: barH }}>
              {total === 0
                ? <div className="flex-1 bg-muted rounded" />
                : segs.map((s, i) => (
                  <div
                    key={i}
                    style={{ height: `${(s.v / total) * 100}%`, backgroundColor: s.color, minHeight: 2 }}
                  />
                ))
              }
            </div>
            <div
              className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-semibold text-primary"
              title={d.nombre}
            >
              {initials}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function DonutLegend({ items }: { items: { color: string; label: string; value: number; pct: number }[] }) {
  return (
    <div className="space-y-2">
      {items.map(item => (
        <div key={item.label} className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
          <span className="text-xs text-muted-foreground flex-1 leading-none">{item.label}</span>
          <span className="text-xs font-medium">{item.value}</span>
          <span className="text-xs text-muted-foreground w-9 text-right">{item.pct}%</span>
        </div>
      ))}
    </div>
  );
}

function CompareBar({ data }: { data: MemberStatsData[] }) {
  const sorted = [...data].sort((a, b) => {
    const rateA = a.tasks.total === 0 ? 0 : a.tasks.completada / a.tasks.total;
    const rateB = b.tasks.total === 0 ? 0 : b.tasks.completada / b.tasks.total;
    return rateB - rateA;
  });
  return (
    <div className="space-y-1">
      {sorted.map(m => {
        const rate = m.tasks.total === 0 ? 0 : Math.round((m.tasks.completada / m.tasks.total) * 100);
        const initials = m.memberNombre.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
        return (
          <div key={m.memberId} className="flex items-center gap-3 py-1.5">
            <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-semibold text-primary shrink-0">
              {initials}
            </div>
            <div className="w-28 shrink-0">
              <p className="text-sm font-medium leading-none truncate">{m.memberNombre}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">{ROLE_LABELS[m.memberRole]}</p>
            </div>
            <div className="flex-1 flex items-center gap-2">
              <div className="flex-1 h-3 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${rate}%`, background: 'linear-gradient(90deg, #10b981, #34d399)' }}
                />
              </div>
              <span className="text-xs font-semibold w-9 text-right">{rate}%</span>
            </div>
            <div className="text-right w-24 shrink-0">
              <p className="text-xs font-medium">{m.tasks.completada}/{m.tasks.total} tareas</p>
              <p className="text-[11px] text-muted-foreground">
                {m.tasks.pendiente > 0 ? `${m.tasks.pendiente} pend.` : formatMinutes(m.tasks.tiempoTotalMinutos)}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ---- Aggregate helpers ----
function aggregate(data: MemberStatsData[]) {
  const tasks: TaskStats = { total: 0, pendiente: 0, completada: 0, tiempoTotalMinutos: 0, tiempoPromedioMinutos: 0 };
  const tickets: TicketStats = {
    total: 0, activo: 0, completado: 0, cancelado: 0,
    vencido: 0, venceProximo: 0,
    porPrioridad: { alta: 0, media: 0, baja: 0 },
  };
  for (const m of data) {
    tasks.total += m.tasks.total;
    tasks.pendiente += m.tasks.pendiente;
    tasks.completada += m.tasks.completada;
    tasks.tiempoTotalMinutos += m.tasks.tiempoTotalMinutos;
    tickets.total += m.tickets.total;
    tickets.activo += m.tickets.activo;
    tickets.completado += m.tickets.completado;
    tickets.cancelado += m.tickets.cancelado;
    tickets.vencido += m.tickets.vencido ?? 0;
    tickets.venceProximo += m.tickets.venceProximo ?? 0;
    tickets.porPrioridad.alta += m.tickets.porPrioridad.alta;
    tickets.porPrioridad.media += m.tickets.porPrioridad.media;
    tickets.porPrioridad.baja += m.tickets.porPrioridad.baja;
  }
  tasks.tiempoPromedioMinutos = tasks.completada > 0
    ? Math.round(tasks.tiempoTotalMinutos / tasks.completada)
    : 0;
  return { tasks, tickets };
}

function taskSegments(t: TaskStats) {
  const total = t.total || 1;
  return [
    { value: t.completada, color: C.completada, label: 'Completada' },
    { value: t.pendiente,  color: C.pendiente,  label: 'Pendiente'  },
  ].map(s => ({ ...s, pct: Math.round((s.value / total) * 100) }));
}

function ticketSegments(k: TicketStats) {
  const total = k.total || 1;
  return [
    { value: k.completado,            color: C.completada, label: 'Completado' },
    { value: k.activo,                color: C.activo,     label: 'Activo'     },
    { value: k.cancelado,             color: C.baja,       label: 'Cancelado'  },
  ].map(s => ({ ...s, pct: Math.round((s.value / total) * 100) }));
}

function prioritySegments(k: TicketStats) {
  const total = k.total || 1;
  return [
    { value: k.porPrioridad.alta,  color: C.alta,  label: 'Alta'  },
    { value: k.porPrioridad.media, color: C.media, label: 'Media' },
    { value: k.porPrioridad.baja,  color: C.baja,  label: 'Baja'  },
  ].map(s => ({ ...s, pct: Math.round((s.value / total) * 100) }));
}

function normalizeStats(raw: MemberStatsData): MemberStatsData {
  return {
    ...raw,
    tasks: {
      total: raw.tasks?.total ?? 0,
      pendiente: raw.tasks?.pendiente ?? 0,
      completada: raw.tasks?.completada ?? 0,
      tiempoTotalMinutos: raw.tasks?.tiempoTotalMinutos ?? 0,
      tiempoPromedioMinutos: raw.tasks?.tiempoPromedioMinutos ?? 0,
    },
    tickets: {
      total: raw.tickets?.total ?? 0,
      activo: raw.tickets?.activo ?? 0,
      completado: raw.tickets?.completado ?? 0,
      cancelado: raw.tickets?.cancelado ?? 0,
      vencido: raw.tickets?.vencido ?? 0,
      venceProximo: raw.tickets?.venceProximo ?? 0,
      porPrioridad: {
        alta: raw.tickets?.porPrioridad?.alta ?? 0,
        media: raw.tickets?.porPrioridad?.media ?? 0,
        baja: raw.tickets?.porPrioridad?.baja ?? 0,
      },
    },
  };
}

// ---- Dashboard views ----

function AllMembersDashboard({ data, days }: { data: MemberStatsData[]; days: number }) {
  const { tasks, tickets } = aggregate(data);
  const completionRate = tasks.total === 0 ? 0 : Math.round((tasks.completada / tasks.total) * 100);
  const throughput = days > 0 ? (tasks.completada / days).toFixed(1) : '0';
  const tSegs = taskSegments(tasks);
  const kSegs = ticketSegments(tickets);

  return (
    <div className="space-y-6">
      {/* KPI strip — decision-focused */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <KpiCard
          icon={<TrendingUp className="h-4 w-4 text-white" />}
          label="Tasa cumplimiento"
          value={`${completionRate}%`}
          sub={`${tasks.completada}/${tasks.total} tareas`}
          accentColor="bg-emerald-600"
        />
        <KpiCard
          icon={<Zap className="h-4 w-4 text-white" />}
          label="Ritmo"
          value={`${throughput}/día`}
          sub="tareas completadas"
          accentColor="bg-blue-600"
        />
        <KpiCard
          icon={<AlertTriangle className="h-4 w-4 text-white" />}
          label="Pendientes"
          value={tasks.pendiente}
          sub="requieren acción"
          accentColor="bg-amber-500"
        />
        <KpiCard
          icon={<Timer className="h-4 w-4 text-white" />}
          label="Tiempo promedio"
          value={formatMinutes(tasks.tiempoPromedioMinutos)}
          sub="por tarea completada"
          accentColor="bg-violet-600"
        />
        <KpiCard
          icon={<AlertTriangle className="h-4 w-4 text-white" />}
          label="Tickets vencidos"
          value={tickets.vencido}
          sub={tickets.venceProximo > 0 ? `${tickets.venceProximo} vencen pronto` : 'sin urgencia'}
          accentColor={tickets.vencido > 0 ? 'bg-red-600' : 'bg-zinc-500'}
        />
        <KpiCard
          icon={<Target className="h-4 w-4 text-white" />}
          label="Tickets activos"
          value={tickets.activo}
          sub={`${tickets.total} total`}
          accentColor="bg-indigo-600"
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="rounded-xl border bg-card p-4">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-4">Tareas por miembro</p>
          {data.length > 0 ? (
            <StackedBarChart
              data={data.map(m => ({
                nombre:     m.memberNombre,
                completada: m.tasks.completada,
                pendiente:  m.tasks.pendiente,
              }))}
            />
          ) : (
            <div className="py-8 text-center text-sm text-muted-foreground">Sin datos</div>
          )}
          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3">
            {[['Completada', C.completada], ['Pendiente', C.pendiente]].map(([l, c]) => (
              <div key={l} className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: c }} />
                <span className="text-[10px] text-muted-foreground">{l}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border bg-card p-4">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-4">Distribución global de tareas</p>
          <div className="flex items-center gap-5">
            <DonutChart
              segments={tSegs}
              value={`${completionRate}%`}
              label="completadas"
            />
            <DonutLegend items={tSegs} />
          </div>
        </div>
      </div>

      {/* Workload + performance */}
      <div className="rounded-xl border bg-card p-4">
        <div className="flex items-center gap-2 mb-4">
          <Users className="h-4 w-4 text-muted-foreground" />
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Carga y rendimiento por miembro</p>
        </div>
        {data.length > 0 ? <CompareBar data={data} /> : (
          <div className="py-6 text-center text-sm text-muted-foreground">Sin datos</div>
        )}
      </div>

      {tickets.total > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="rounded-xl border bg-card p-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-4">Tickets por estado</p>
            <div className="flex items-center gap-5">
              <DonutChart segments={kSegs} value={String(tickets.total)} label="tickets" />
              <DonutLegend items={kSegs} />
            </div>
          </div>
          <div className="rounded-xl border bg-card p-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-4">Tickets por prioridad</p>
            <div className="flex items-center gap-5">
              <DonutChart segments={prioritySegments(tickets)} value={String(tickets.total)} label="tickets" />
              <DonutLegend items={prioritySegments(tickets)} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SingleMemberDashboard({ data, days }: { data: MemberStatsData; days: number }) {
  const { tasks, tickets } = data;
  const completionRate = tasks.total === 0 ? 0 : Math.round((tasks.completada / tasks.total) * 100);
  const throughput = days > 0 ? (tasks.completada / days).toFixed(1) : '0';
  const tSegs = taskSegments(tasks);
  const kSegs = ticketSegments(tickets);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <KpiCard
          icon={<TrendingUp className="h-4 w-4 text-white" />}
          label="Tasa cumplimiento"
          value={`${completionRate}%`}
          sub={`${tasks.completada}/${tasks.total} tareas`}
          accentColor="bg-emerald-600"
        />
        <KpiCard
          icon={<Zap className="h-4 w-4 text-white" />}
          label="Ritmo"
          value={`${throughput}/día`}
          sub="completadas"
          accentColor="bg-blue-600"
        />
        <KpiCard
          icon={<AlertTriangle className="h-4 w-4 text-white" />}
          label="Pendientes"
          value={tasks.pendiente}
          accentColor="bg-amber-500"
        />
        <KpiCard
          icon={<Timer className="h-4 w-4 text-white" />}
          label="Tiempo promedio"
          value={formatMinutes(tasks.tiempoPromedioMinutos)}
          sub="por tarea"
          accentColor="bg-violet-600"
        />
        <KpiCard
          icon={<Clock className="h-4 w-4 text-white" />}
          label="Tiempo total"
          value={formatMinutes(tasks.tiempoTotalMinutos)}
          accentColor="bg-zinc-500"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="rounded-xl border bg-card p-4">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-4">Tareas por estado</p>
          <div className="flex items-center gap-5">
            <DonutChart segments={tSegs} value={`${completionRate}%`} label="completadas" />
            <DonutLegend items={tSegs} />
          </div>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-4">Tickets / RQ</p>
          {tickets.total > 0 ? (
            <div className="space-y-4">
              <div className="flex items-center gap-5">
                <DonutChart segments={kSegs} value={String(tickets.total)} label="tickets" />
                <DonutLegend items={kSegs} />
              </div>
              <div>
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-2">Por prioridad</p>
                <DonutLegend items={prioritySegments(tickets)} />
              </div>
            </div>
          ) : (
            <div className="py-8 text-center text-sm text-muted-foreground">Sin tickets en el período</div>
          )}
        </div>
      </div>

      {tasks.total > 0 && (
        <div className="rounded-xl border bg-muted/30 p-4">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-4">Detalle de estados</p>
          <div className="space-y-2.5">
            {tSegs.map(seg => (
              <div key={seg.label} className="flex items-center gap-3">
                <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: seg.color }} />
                <span className="text-xs text-muted-foreground w-24 shrink-0">{seg.label}</span>
                <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${seg.pct}%`, backgroundColor: seg.color }}
                  />
                </div>
                <span className="text-xs font-medium w-5 text-right">{seg.value}</span>
                <span className="text-xs text-muted-foreground w-9 text-right">{seg.pct}%</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ---- Main export ----
const PRESET_LABELS: Record<Preset, string> = {
  week: 'Esta semana', month: 'Este mes', '3months': 'Últimos 3 meses',
};

export function TeamStatsModal({
  open, onClose, team,
}: {
  open: boolean;
  onClose: () => void;
  team: { id: string; nombre: string; members: StatsMember[] } | null;
}) {
  const [preset, setPreset] = useState<Preset | null>('month');
  const [dateRange, setDateRange] = useState(presetRange('month'));
  const [selectedMemberId, setSelectedMemberId] = useState<string>('all');
  const [stats, setStats] = useState<MemberStatsData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchStats = useCallback(async (force = false) => {
    if (!team) return;

    const cacheKey = `api:stats:${team.id}:${dateRange.from}:${dateRange.to}`;

    if (!force) {
      const cached = getCached<MemberStatsData[]>(cacheKey);
      if (cached) {
        setStats(cached);
        setLoading(false);
        setError('');
        return;
      }
    }

    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({
        fechaInicio: dateRange.from,
        fechaFin: dateRange.to,
      });
      const data = await fetchCached(
        cacheKey,
        () => apiClient.request<MemberStatsData | MemberStatsData[]>(
          `/api/teams/${team.id}/stats?${params.toString()}`
        ),
        CACHE_TTL.stats,
        { force },
      );
      const list = (Array.isArray(data) ? data : [data]).map(normalizeStats);
      setStats(list);
    } catch {
      setError('No se pudieron cargar las estadísticas');
    } finally {
      setLoading(false);
    }
  }, [team, dateRange]);

  useEffect(() => {
    if (open) {
      setSelectedMemberId('all');
      setPreset('month');
      setDateRange(presetRange('month'));
      setStats([]);
    }
  }, [open]);

  useEffect(() => {
    if (open) fetchStats();
  }, [open, fetchStats]);

  const handlePreset = (p: Preset) => {
    setPreset(p);
    setDateRange(presetRange(p));
  };

  const displayedStats =
    selectedMemberId === 'all'
      ? stats
      : stats.filter(s => s.memberId === selectedMemberId);

  const selectedMemberData =
    selectedMemberId === 'all' ? null
      : displayedStats[0] ?? null;

  const periodDays = daysBetween(dateRange.from, dateRange.to);

  return (
    <Dialog.Root open={open} onOpenChange={(v) => !v && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50" />
        <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[calc(100%-2rem)] max-w-4xl bg-card rounded-xl border shadow-xl max-h-[92vh] flex flex-col">

          {/* Header */}
          <div className="flex items-start justify-between gap-3 px-4 pt-4 pb-3 sm:px-6 sm:pt-5 sm:pb-4 border-b shrink-0">
            <div className="min-w-0">
              <Dialog.Title className="text-base font-semibold flex items-center gap-2">
                <BarChart3 className="h-4 w-4 shrink-0 text-primary" />
                <span className="truncate">Estadísticas — {team?.nombre}</span>
              </Dialog.Title>
              <Dialog.Description className="text-xs text-muted-foreground mt-0.5">
                KPIs para decisiones de equipo — cumplimiento, carga y riesgos
              </Dialog.Description>
            </div>
            <Dialog.Close asChild>
              <button className="p-1.5 rounded-md text-muted-foreground hover:bg-muted shrink-0">
                <X className="h-4 w-4" />
              </button>
            </Dialog.Close>
          </div>

          {/* Controls */}
          <div className="px-6 py-3 border-b shrink-0 bg-muted/30">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <Users className="h-3.5 w-3.5 text-muted-foreground" />
                <select
                  value={selectedMemberId}
                  onChange={(e) => setSelectedMemberId(e.target.value)}
                  className="h-8 pl-3 pr-7 rounded-md border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="all">Todos los miembros</option>
                  {team?.members.map(m => (
                    <option key={m.id} value={m.id}>{m.nombre}</option>
                  ))}
                </select>
              </div>

              <div className="flex gap-1 bg-background border rounded-lg p-0.5">
                {(['week', 'month', '3months'] as Preset[]).map(p => (
                  <button
                    key={p}
                    onClick={() => handlePreset(p)}
                    className={cn(
                      'px-3 py-1 rounded-md text-xs transition-colors',
                      preset === p
                        ? 'bg-primary text-primary-foreground font-medium shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                    )}
                  >
                    {PRESET_LABELS[p]}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2 ml-auto">
                <input
                  type="date" value={dateRange.from}
                  onChange={e => { setPreset(null); setDateRange(r => ({ ...r, from: e.target.value })); }}
                  className="h-8 px-2 rounded-md border bg-background text-xs focus:outline-none focus:ring-2 focus:ring-ring"
                />
                <span className="text-muted-foreground text-xs">—</span>
                <input
                  type="date" value={dateRange.to}
                  onChange={e => { setPreset(null); setDateRange(r => ({ ...r, to: e.target.value })); }}
                  className="h-8 px-2 rounded-md border bg-background text-xs focus:outline-none focus:ring-2 focus:ring-ring"
                />
                <Button size="sm" variant="outline" className="h-8 px-3 text-xs" onClick={() => fetchStats(true)}>
                  Aplicar
                </Button>
              </div>
            </div>
          </div>

          {/* Body */}
          <div className="overflow-y-auto flex-1 p-4 sm:p-6">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3">
                <Loader2 className="h-7 w-7 animate-spin text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Cargando estadísticas...</p>
              </div>
            ) : error ? (
              <div className="py-12 text-center text-destructive text-sm">{error}</div>
            ) : selectedMemberId === 'all' ? (
              <AllMembersDashboard data={displayedStats} days={periodDays} />
            ) : selectedMemberData ? (
              <SingleMemberDashboard data={selectedMemberData} days={periodDays} />
            ) : (
              <div className="py-12 text-center text-muted-foreground text-sm">
                Sin datos para este miembro en el período seleccionado
              </div>
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
