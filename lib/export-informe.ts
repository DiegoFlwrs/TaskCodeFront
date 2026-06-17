import ExcelJS from 'exceljs';
import { Task } from './task-types';
import { Ticket } from './ticket-types';

const TEMPLATE_PATH = '/plantilla/Modelo_Informe.xlsx';
const DATA_START_ROW = 18;
const TIPO = 'Reunión - Incidencia';
const AREA = 'Sistemas';

const MONTHS_ES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
] as const;

export interface ReportExportOptions {
  fechaInicio: string;
  fechaFin: string;
  tasks: Task[];
  tickets?: Ticket[];
  userName?: string;
}

export interface ReportRow {
  fecha: string;
  asunto: string;
  aplicativo: string;
  solicitante: string;
  estado: string;
  detalle: string;
}

function isWeekday(dateStr: string): boolean {
  const day = new Date(`${dateStr}T00:00:00`).getDay();
  return day !== 0 && day !== 6;
}

function formatDateEs(dateStr: string): string {
  return new Date(`${dateStr}T00:00:00`).toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function formatPeriodo(fechaInicio: string, fechaFin: string): string {
  return `${formatDateEs(fechaInicio)} - ${formatDateEs(fechaFin)}`;
}

function formatAsunto(rqTicket: string): string {
  if (!rqTicket) return '';
  const prefix = rqTicket.toUpperCase().startsWith('RQ') ? 'REQUERIMIENTO' : 'TICKET';
  return `${prefix}: ${rqTicket}`;
}

function getMonthsInRange(fechaInicio: string, fechaFin: string): string[] {
  const start = new Date(`${fechaInicio}T00:00:00`);
  const end = new Date(`${fechaFin}T00:00:00`);
  const months: string[] = [];
  const current = new Date(start.getFullYear(), start.getMonth(), 1);
  const endMonth = new Date(end.getFullYear(), end.getMonth(), 1);

  while (current <= endMonth) {
    months.push(MONTHS_ES[current.getMonth()]);
    current.setMonth(current.getMonth() + 1);
  }

  return months;
}

function formatUserNameForFile(nombre: string): string {
  const parts = nombre.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'Usuario';
  return parts
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join('_');
}

export function buildReportFilename(
  fechaInicio: string,
  fechaFin: string,
  userName = '',
): string {
  const months = getMonthsInRange(fechaInicio, fechaFin).join('_');
  const name = formatUserNameForFile(userName);
  return `Informe_Mensual_${months}_${name}.xlsx`;
}

export function buildReportRows(tasks: Task[], tickets: Ticket[] = []): ReportRow[] {
  const ticketMap = new Map(tickets.map((t) => [t.codigo, t.asignadoPor]));
  const weekdayTasks = tasks.filter((t) => isWeekday(t.fecha));
  const groups = new Map<string, Task[]>();

  for (const task of weekdayTasks) {
    const key = `${task.fecha}|${task.rqTicket}|${task.aplicacion}`;
    const existing = groups.get(key);
    if (existing) existing.push(task);
    else groups.set(key, [task]);
  }

  return Array.from(groups.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([, groupTasks]) => {
      const first = groupTasks[0];
      const allCompleted = groupTasks.every((t) => t.status === 'completada');
      const detalle = groupTasks.map((t) => `• ${t.nombre}`).join('\n');

      return {
        fecha: formatDateEs(first.fecha),
        asunto: formatAsunto(first.rqTicket),
        aplicativo: first.aplicacion || '',
        solicitante: first.solicitante || ticketMap.get(first.rqTicket) || '',
        estado: allCompleted ? 'Finalizado' : 'Pendiente',
        detalle,
      };
    });
}

const CENTERED_COLS = [2, 3, 4, 5, 6, 8, 9, 10] as const;

function cloneStyle(style: Partial<ExcelJS.Style>): Partial<ExcelJS.Style> {
  return JSON.parse(JSON.stringify(style));
}

function captureColumnStyles(sheet: ExcelJS.Worksheet): Map<number, Partial<ExcelJS.Style>> {
  const styles = new Map<number, Partial<ExcelJS.Style>>();
  for (const col of CENTERED_COLS) {
    styles.set(col, cloneStyle(sheet.getCell(DATA_START_ROW, col).style));
  }
  return styles;
}

function setCenteredCell(
  sheet: ExcelJS.Worksheet,
  row: number,
  col: number,
  value: ExcelJS.CellValue,
  columnStyles: Map<number, Partial<ExcelJS.Style>>,
) {
  const cell = sheet.getCell(row, col);
  const refStyle = columnStyles.get(col);
  if (refStyle) cell.style = cloneStyle(refStyle);
  cell.value = value;
  cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
}

function setDetalleCell(
  sheet: ExcelJS.Worksheet,
  row: number,
  value: string,
  detalleStyle: Partial<ExcelJS.Style>,
) {
  const cell = sheet.getCell(row, 11);
  cell.style = cloneStyle(detalleStyle);
  cell.value = value;
  cell.alignment = { horizontal: 'left', vertical: 'top', wrapText: true };
}

function clearDataRows(sheet: ExcelJS.Worksheet, fromRow: number) {
  const maxRow = sheet.rowCount;
  for (let row = fromRow; row <= maxRow; row++) {
    for (const col of [2, 3, 4, 5, 6, 8, 9, 10, 11]) {
      sheet.getCell(row, col).value = null;
    }
  }
}

export async function exportInformeMensual({
  fechaInicio,
  fechaFin,
  tasks,
  tickets = [],
  userName = '',
}: ReportExportOptions): Promise<void> {
  const rows = buildReportRows(tasks, tickets);
  if (rows.length === 0) return;

  const response = await fetch(TEMPLATE_PATH);
  if (!response.ok) throw new Error('No se pudo cargar la plantilla Excel');

  const buffer = await response.arrayBuffer();
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer);

  const sheet = workbook.worksheets[0];
  if (!sheet) throw new Error('La plantilla no contiene hojas de cálculo');

  sheet.getCell(13, 4).value = formatPeriodo(fechaInicio, fechaFin);

  clearDataRows(sheet, DATA_START_ROW);

  const columnStyles = captureColumnStyles(sheet);
  const detalleStyle = cloneStyle(sheet.getCell(DATA_START_ROW, 11).style);

  rows.forEach((row, index) => {
    const excelRow = DATA_START_ROW + index;

    setCenteredCell(sheet, excelRow, 2, index + 1, columnStyles);
    setCenteredCell(sheet, excelRow, 3, row.fecha, columnStyles);
    setCenteredCell(sheet, excelRow, 4, row.asunto, columnStyles);
    setCenteredCell(sheet, excelRow, 5, TIPO, columnStyles);
    setCenteredCell(sheet, excelRow, 6, row.aplicativo, columnStyles);
    setCenteredCell(sheet, excelRow, 8, row.solicitante, columnStyles);
    setCenteredCell(sheet, excelRow, 9, AREA, columnStyles);
    setCenteredCell(sheet, excelRow, 10, row.estado, columnStyles);
    setDetalleCell(sheet, excelRow, row.detalle, detalleStyle);
  });

  const output = await workbook.xlsx.writeBuffer();
  const blob = new Blob([output], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = buildReportFilename(fechaInicio, fechaFin, userName);
  link.click();
  URL.revokeObjectURL(url);
}
