'use client';

import { useState, useEffect } from 'react';
import { Search, Download, FileSpreadsheet, Calendar, Filter } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Combobox } from '../ui/combobox';
import { DataTablePagination } from '../ui/data-table-pagination';
import { usePaginatedTasks, fetchAllTasksForExport } from '../../hooks/useTasks';
import { useTickets } from '../../hooks/useTickets';
import { useApps } from '../../hooks/useApps';
import { useUser } from '../../hooks/useAuth';
import {
  TASK_STATUS_LABELS,
  TASK_PRIORITY_LABELS,
  TASK_STATUS_COLORS,
  TASK_PRIORITY_COLORS,
} from '../../lib/task-types';
import { cn } from '../../lib/utils';
import { exportInformeMensual } from '../../lib/export-informe';
import { DEFAULT_PAGE_SIZE } from '../../lib/pagination';

function Badge({ label, className }: { label: string; className: string }) {
  return (
    <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium', className)}>
      {label}
    </span>
  );
}

export function ReportsView() {
  const { tickets } = useTickets();
  const { apps } = useApps();
  const { user } = useUser();

  const today = new Date().toISOString().split('T')[0];
  const firstOfMonth = today.slice(0, 8) + '01';

  const [fechaInicio, setFechaInicio] = useState(firstOfMonth);
  const [fechaFin, setFechaFin] = useState(today);
  const [filterRQ, setFilterRQ] = useState('');
  const [filterApp, setFilterApp] = useState('');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(DEFAULT_PAGE_SIZE);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    setPage(0);
  }, [fechaInicio, fechaFin, filterRQ, filterApp, debouncedSearch, size]);

  const { data, loading } = usePaginatedTasks({
    fechaInicio,
    fechaFin,
    rqTicket: filterRQ || undefined,
    aplicacion: filterApp || undefined,
    search: debouncedSearch || undefined,
    page,
    size,
  });

  const ticketOptions = [
    { value: '', label: 'Todos los tickets' },
    ...tickets.map((t) => ({ value: t.codigo, label: t.codigo, description: t.nombre })),
  ];

  const appOptions = [
    { value: '', label: 'Todas las aplicaciones' },
    ...apps.map((a) => ({ value: a.nombre, label: a.nombre })),
  ];

  const handleExport = async () => {
    setExporting(true);
    try {
      const allTasks = await fetchAllTasksForExport({
        fechaInicio,
        fechaFin,
        rqTicket: filterRQ || undefined,
        aplicacion: filterApp || undefined,
        search: debouncedSearch || undefined,
      });
      await exportInformeMensual({
        fechaInicio,
        fechaFin,
        tasks: allTasks,
        tickets,
        userName: user?.nombre ?? '',
      });
    } finally {
      setExporting(false);
    }
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
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h2 className="text-xl font-semibold">Reportes</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Consulta y exporta tus actividades por rango de fechas
          </p>
        </div>
        <Button
          onClick={handleExport}
          disabled={data.totalElements === 0 || exporting}
          isLoading={exporting}
          className="w-full gap-2 sm:w-auto shrink-0"
        >
          <Download className="h-4 w-4" />
          Exportar
        </Button>
      </div>

      <Card className="border shadow-none">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="fechaInicio">Fecha inicio</Label>
            <Input
              id="fechaInicio"
              type="date"
              value={fechaInicio}
              onChange={(e) => setFechaInicio(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="fechaFin">Fecha fin</Label>
            <Input
              id="fechaFin"
              type="date"
              value={fechaFin}
              onChange={(e) => setFechaFin(e.target.value)}
            />
          </div>
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

      <Card className="border shadow-none">
        <CardHeader className="pb-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="text-sm font-semibold flex flex-col gap-1 sm:flex-row sm:flex-wrap sm:items-center sm:gap-2 min-w-0">
              <span className="inline-flex items-center gap-2">
                <FileSpreadsheet className="h-4 w-4 shrink-0 text-muted-foreground" />
                {data.totalElements} actividad{data.totalElements !== 1 ? 'es' : ''} encontrada
                {data.totalElements !== 1 ? 's' : ''}
              </span>
              {(fechaInicio || fechaFin) && (
                <span className="text-muted-foreground font-normal text-xs sm:text-sm">
                  {formatDate(fechaInicio)} — {formatDate(fechaFin)}
                </span>
              )}
            </CardTitle>
            <div className="relative w-full sm:w-64 shrink-0">
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
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-3">
              <p className="text-sm">Cargando actividades...</p>
            </div>
          ) : data.content.length === 0 ? (
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
                  {data.content.map((task) => (
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
              <DataTablePagination
                page={data.page}
                size={data.size}
                totalElements={data.totalElements}
                totalPages={data.totalPages}
                onPageChange={setPage}
                onSizeChange={setSize}
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
