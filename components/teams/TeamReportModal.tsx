'use client';

import { useEffect, useMemo, useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { FileSpreadsheet, X } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { cn } from '../../lib/utils';
import { useToastManager } from '../ui/toast-manager';
import { fetchAllTasksForExport } from '../../hooks/useTasks';
import {
  exportInformesEquipoZip,
  monthToDateRange,
} from '../../lib/export-informe';

export interface ReportTeamMember {
  id: string;
  userId?: number | null;
  nombre: string;
  email: string;
  status?: string;
}

export interface ReportTeam {
  id: string;
  nombre: string;
  members: ReportTeamMember[];
}

interface TeamReportModalProps {
  open: boolean;
  onClose: () => void;
  team: ReportTeam | null;
}

type PeriodMode = 'month' | 'range';

function currentYearMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

function defaultRange() {
  const today = new Date().toISOString().split('T')[0];
  return {
    fechaInicio: `${today.slice(0, 8)}01`,
    fechaFin: today,
  };
}

export function TeamReportModal({ open, onClose, team }: TeamReportModalProps) {
  const { toast } = useToastManager();
  const [mode, setMode] = useState<PeriodMode>('month');
  const [yearMonth, setYearMonth] = useState(currentYearMonth);
  const [fechaInicio, setFechaInicio] = useState(defaultRange().fechaInicio);
  const [fechaFin, setFechaFin] = useState(defaultRange().fechaFin);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setMode('month');
    setYearMonth(currentYearMonth());
    const range = defaultRange();
    setFechaInicio(range.fechaInicio);
    setFechaFin(range.fechaFin);
  }, [open, team?.id]);

  const exportableMembers = useMemo(
    () =>
      (team?.members ?? []).filter(
        (member) =>
          member.userId != null
          && member.status !== 'inactivo',
      ),
    [team],
  );

  const resolvedRange = useMemo(() => {
    if (mode === 'month') {
      return monthToDateRange(yearMonth);
    }
    return { fechaInicio, fechaFin };
  }, [mode, yearMonth, fechaInicio, fechaFin]);

  const canExport =
    !!team
    && exportableMembers.length > 0
    && !!resolvedRange.fechaInicio
    && !!resolvedRange.fechaFin
    && resolvedRange.fechaInicio <= resolvedRange.fechaFin;

  const handleGenerate = async () => {
    if (!team || !canExport) return;

    setExporting(true);
    try {
      const result = await exportInformesEquipoZip({
        fechaInicio: resolvedRange.fechaInicio,
        fechaFin: resolvedRange.fechaFin,
        teamName: team.nombre,
        members: exportableMembers.map((member) => ({
          userId: member.userId!,
          nombre: member.nombre,
        })),
        fetchTasksForMember: (userId) =>
          fetchAllTasksForExport({
            fechaInicio: resolvedRange.fechaInicio,
            fechaFin: resolvedRange.fechaFin,
            userId,
            teamId: team.id,
          }),
      });

      if (result.exported === 0) {
        toast.error(
          'Sin actividades',
          'Ningún miembro tiene actividades exportables en el periodo seleccionado',
        );
        return;
      }

      toast.success(
        'ZIP generado',
        `Se generaron ${result.exported} informe${result.exported !== 1 ? 's' : ''}${
          result.skipped > 0 ? ` (${result.skipped} sin actividades)` : ''
        }`,
      );
      onClose();
    } catch {
      toast.error('Error', 'No se pudo generar el reporte del equipo');
    } finally {
      setExporting(false);
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={(v) => !v && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50" />
        <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[calc(100%-2rem)] max-w-md bg-card rounded-xl border shadow-xl p-4 sm:p-6">
          <div className="flex items-start justify-between gap-3 mb-4">
            <div className="min-w-0">
              <Dialog.Title className="text-base font-semibold flex items-center gap-2">
                <FileSpreadsheet className="h-4 w-4 text-primary shrink-0" />
                <span className="truncate">Reporte — {team?.nombre}</span>
              </Dialog.Title>
              <Dialog.Description className="text-xs text-muted-foreground mt-1">
                Genera un Excel por cada miembro y los descarga en un ZIP
              </Dialog.Description>
            </div>
            <Dialog.Close asChild>
              <button className="p-1.5 rounded-md text-muted-foreground hover:bg-muted shrink-0">
                <X className="h-4 w-4" />
              </button>
            </Dialog.Close>
          </div>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Periodo</Label>
              <div className="flex gap-1 rounded-lg border p-1 bg-muted/40">
                <button
                  type="button"
                  onClick={() => setMode('month')}
                  className={cn(
                    'flex-1 rounded-md px-3 py-1.5 text-sm transition-colors',
                    mode === 'month'
                      ? 'bg-background shadow-sm font-medium'
                      : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  Por mes
                </button>
                <button
                  type="button"
                  onClick={() => setMode('range')}
                  className={cn(
                    'flex-1 rounded-md px-3 py-1.5 text-sm transition-colors',
                    mode === 'range'
                      ? 'bg-background shadow-sm font-medium'
                      : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  Rango de fechas
                </button>
              </div>
            </div>

            {mode === 'month' ? (
              <div className="space-y-1.5">
                <Label htmlFor="report-month">Mes</Label>
                <Input
                  id="report-month"
                  type="month"
                  value={yearMonth}
                  onChange={(e) => setYearMonth(e.target.value)}
                />
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="report-start">Fecha inicio</Label>
                  <Input
                    id="report-start"
                    type="date"
                    value={fechaInicio}
                    onChange={(e) => setFechaInicio(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="report-end">Fecha fin</Label>
                  <Input
                    id="report-end"
                    type="date"
                    value={fechaFin}
                    onChange={(e) => setFechaFin(e.target.value)}
                  />
                </div>
              </div>
            )}

            <p className="text-xs text-muted-foreground">
              {exportableMembers.length} miembro
              {exportableMembers.length !== 1 ? 's' : ''} con cuenta activa
              {exportableMembers.length === 0
                ? ' — no hay miembros exportables'
                : ' serán incluidos en el ZIP'}
            </p>

            <div className="flex gap-3 justify-end pt-1">
              <Button type="button" variant="outline" onClick={onClose} disabled={exporting}>
                Cancelar
              </Button>
              <Button
                type="button"
                onClick={handleGenerate}
                disabled={!canExport || exporting}
                isLoading={exporting}
                className="gap-2"
              >
                <FileSpreadsheet className="h-4 w-4" />
                Generar ZIP
              </Button>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
