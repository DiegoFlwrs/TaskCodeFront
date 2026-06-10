'use client';

import { useState, useMemo } from 'react';
import * as XLSX from 'xlsx';
import { Search, Download, FileSpreadsheet, Calendar, Filter } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Combobox } from '../ui/combobox';
import { useTasks } from '../../hooks/useTasks';
import { useTickets } from '../../hooks/useTickets';
import { useApps } from '../../hooks/useApps';
import {
  Task,
  TASK_STATUS_LABELS,
  TASK_PRIORITY_LABELS,
  TASK_STATUS_COLORS,
  TASK_PRIORITY_COLORS,
} from '../../lib/task-types';
import { cn } from '../../lib/utils';

function Badge({ label, className }: { label: string; className: string }) {
  return (
    <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium', className)}>
      {label}
    </span>
  );
}

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <Card className="border shadow-none">
      <CardContent className="p-4">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-2xl font-bold mt-1">{value}</p>
        {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
      </CardContent>
    </Card>
  );
}

export function ReportsView() {
  const { tasks } = useTasks();
  const { tickets } = useTickets();
  const { apps } = useApps();

  const today = new Date().toISOString().split('T')[0];
  const firstOfMonth = today.slice(0, 8) + '01';

  const [fechaInicio, setFechaInicio] = useState(firstOfMonth);
  const [fechaFin, setFechaFin] = useState(today);
  const [filterRQ, setFilterRQ] = useState('');
  const [filterApp, setFilterApp] = useState('');
  const [search, setSearch] = useState('');

  const ticketOptions = [
    { value: '', label: 'Todos los tickets' },
    ...tickets.map((t) => ({ value: t.codigo, label: t.codigo, description: t.nombre })),
  ];

  const appOptions = [
    { value: '', label: 'Todas las aplicaciones' },
    ...apps.map((a) => ({ value: a.nombre, label: a.nombre })),
  ];

  const filtered = useMemo(() => {
    return tasks.filter((t) => {
      if (fechaInicio && t.fecha < fechaInicio) return false;
      if (fechaFin && t.fecha > fechaFin) return false;
      if (filterRQ && t.rqTicket !== filterRQ) return false;
      if (filterApp && t.aplicacion !== filterApp) return false;
      if (search) {
        const q = search.toLowerCase();
        if (
          !t.nombre.toLowerCase().includes(q) &&
          !t.rqTicket.toLowerCase().includes(q) &&
          !t.aplicacion.toLowerCase().includes(q)
        )
          return false;
      }
      return true;
    });
  }, [tasks, fechaInicio, fechaFin, filterRQ, filterApp, search]);

  // Stats
  const completadas = filtered.filter((t) => t.status === 'completada').length;
  // const enProgreso = filtered.filter((t) => t.status === 'en-progreso').length;
  const pendientes = filtered.filter((t) => t.status === 'pendiente').length;

  // Total tiempo invertido (parse "Xh Ym" → minutes)
  const totalMins = filtered.reduce((acc, t) => {
    if (!t.tiempoInvertido) return acc;
    const h = t.tiempoInvertido.match(/(\d+)h/);
    const m = t.tiempoInvertido.match(/(\d+)m/);
    return acc + (h ? parseInt(h[1]) * 60 : 0) + (m ? parseInt(m[1]) : 0);
  }, 0);
  const totalTiempo =
    totalMins > 0
      ? `${Math.floor(totalMins / 60)}h ${totalMins % 60}m`
      : '—';

  const handleExport = () => {
    const rows = filtered.map((t) => ({
      Fecha: t.fecha,
      'Nombre de tarea': t.nombre,
      'RQ / Ticket': t.rqTicket || '',
      Aplicación: t.aplicacion || '',
      Estado: TASK_STATUS_LABELS[t.status],
      Prioridad: TASK_PRIORITY_LABELS[t.priority],
      'Hora inicio': t.horaInicio || '',
      'Hora fin': t.horaFin || '',
      'Tiempo invertido': t.tiempoInvertido || '',
      'URL escenario': t.urlEscenario || '',
      Observación: t.observacion || '',
    }));

    const ws = XLSX.utils.json_to_sheet(rows);

    // Column widths
    ws['!cols'] = [
      { wch: 12 }, { wch: 40 }, { wch: 16 }, { wch: 22 },
      { wch: 14 }, { wch: 12 }, { wch: 12 }, { wch: 12 },
      { wch: 16 }, { wch: 40 }, { wch: 40 },
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Actividades');

    const filename = `reporte_actividades_${fechaInicio}_${fechaFin}.xlsx`;
    XLSX.writeFile(wb, filename);
  };

  const formatDate = (d: string) =>
    d
      ? new Date(d + 'T00:00:00').toLocaleDateString('es-ES', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
        })
      : '—';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-xl font-semibold">Reportes</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Consulta y exporta tus actividades por rango de fechas
          </p>
        </div>
        <Button 
        onClick={handleExport} disabled={filtered.length === 0} 
        className="gap-2">
          <Download className="h-4 w-4" />
          Exportar Excel
        </Button>
      </div>

      {/* Filters */}
      <Card className="border shadow-none">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {/* Fecha inicio */}
          <div className="space-y-1.5">
            <Label htmlFor="fechaInicio">Fecha inicio</Label>
            <Input
              id="fechaInicio"
              type="date"
              value={fechaInicio}
              onChange={(e) => setFechaInicio(e.target.value)}
            />
          </div>

          {/* Fecha fin */}
          <div className="space-y-1.5">
            <Label htmlFor="fechaFin">Fecha fin</Label>
            <Input
              id="fechaFin"
              type="date"
              value={fechaFin}
              onChange={(e) => setFechaFin(e.target.value)}
            />
          </div>

          {/* RQ / Ticket */}
          <div className="space-y-1.5">
            <Label>RQ / Ticket</Label>
            <Combobox
              options={ticketOptions}
              value={filterRQ}
              onChange={setFilterRQ}
              placeholder="Todos los tickets"
              searchPlaceholder="Buscar ticket..."
            />
          </div>

          {/* Aplicación */}
          <div className="space-y-1.5">
            <Label>Aplicación</Label>
            <Combobox
              options={appOptions}
              value={filterApp}
              onChange={setFilterApp}
              placeholder="Todas las aplicaciones"
              searchPlaceholder="Buscar app..."
            />
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard label="Total tareas" value={filtered.length} />
        <StatCard label="Completadas" value={completadas} sub={filtered.length ? `${Math.round((completadas / filtered.length) * 100)}%` : undefined} />
        <StatCard label="Pendientes" value={`${pendientes}`} />
        <StatCard label="Tiempo total" value={totalTiempo} />
      </div>

      {/* Search + table */}
      <Card className="border shadow-none">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-4">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <FileSpreadsheet className="h-4 w-4 text-muted-foreground" />
              {filtered.length} actividad{filtered.length !== 1 ? 'es' : ''} encontrada{filtered.length !== 1 ? 's' : ''}
              {(fechaInicio || fechaFin) && (
                <span className="text-muted-foreground font-normal">
                  · {formatDate(fechaInicio)} — {formatDate(fechaFin)}
                </span>
              )}
            </CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                className="w-full h-9 pl-9 pr-3 rounded-md border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="Buscar en resultados..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-3">
              <Calendar className="h-10 w-10 opacity-30" />
              <p className="text-sm">No se encontraron actividades con los filtros aplicados</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    {['Fecha', 'Tarea', 'RQ / Ticket', 'Aplicación', 'Estado', 'Prioridad', 'Inicio', 'Fin', 'Tiempo'].map((h) => (
                      <th
                        key={h}
                        className="text-left px-3 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered
                    .slice()
                    .sort((a, b) => a.fecha.localeCompare(b.fecha))
                    .map((task) => (
                      <tr key={task.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                        <td className="px-3 py-2.5 whitespace-nowrap text-muted-foreground text-xs">
                          {formatDate(task.fecha)}
                        </td>
                        <td className="px-3 py-2.5 max-w-[220px]">
                          <span className="font-medium truncate block" title={task.nombre}>
                            {task.nombre}
                          </span>
                          {task.observacion && (
                            <span className="text-xs text-muted-foreground truncate block" title={task.observacion}>
                              {task.observacion}
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-2.5 whitespace-nowrap">
                          <span className="text-xs font-mono text-muted-foreground">{task.rqTicket || '—'}</span>
                        </td>
                        <td className="px-3 py-2.5 whitespace-nowrap text-sm">{task.aplicacion || '—'}</td>
                        <td className="px-3 py-2.5 whitespace-nowrap">
                          <Badge label={TASK_STATUS_LABELS[task.status]} className={TASK_STATUS_COLORS[task.status]} />
                        </td>
                        <td className="px-3 py-2.5 whitespace-nowrap">
                          <Badge label={TASK_PRIORITY_LABELS[task.priority]} className={TASK_PRIORITY_COLORS[task.priority]} />
                        </td>
                        <td className="px-3 py-2.5 whitespace-nowrap text-muted-foreground text-sm">{task.horaInicio || '—'}</td>
                        <td className="px-3 py-2.5 whitespace-nowrap text-muted-foreground text-sm">{task.horaFin || '—'}</td>
                        <td className="px-3 py-2.5 whitespace-nowrap">
                          <span className="text-sm font-medium">{task.tiempoInvertido || '—'}</span>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
