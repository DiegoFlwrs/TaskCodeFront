import ExcelJS from 'exceljs';
import JSZip from 'jszip';
import { Task } from './task-types';
import { Ticket } from './ticket-types';
import { getHolidayName, isHoliday, isWeekday, listHolidaysInRange } from './feriados';

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

export interface TeamMemberExportTarget {
  userId: number;
  nombre: string;
}

export interface TeamZipExportOptions {
  fechaInicio: string;
  fechaFin: string;
  teamName: string;
  members: TeamMemberExportTarget[];
  tickets?: Ticket[];
  fetchTasksForMember: (userId: number) => Promise<Task[]>;
}

export interface TeamZipExportResult {
  exported: number;
  skipped: number;
}

export interface ReportRow {
  sortDate: string;
  fecha: string;
  asunto: string;
  tipo: string;
  aplicativo: string;
  solicitante: string;
  estado: string;
  detalle: string;
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

export function buildTeamZipFilename(
  fechaInicio: string,
  fechaFin: string,
  teamName: string,
): string {
  const months = getMonthsInRange(fechaInicio, fechaFin).join('_');
  const safeTeam = formatUserNameForFile(teamName);
  return `Informes_Equipo_${safeTeam}_${months}.zip`;
}

export function monthToDateRange(yearMonth: string): { fechaInicio: string; fechaFin: string } {
  const [yearStr, monthStr] = yearMonth.split('-');
  const year = Number(yearStr);
  const month = Number(monthStr);
  const lastDay = new Date(year, month, 0).getDate();
  return {
    fechaInicio: `${yearMonth}-01`,
    fechaFin: `${yearMonth}-${String(lastDay).padStart(2, '0')}`,
  };
}

export function buildReportRows(
  tasks: Task[],
  tickets: Ticket[] = [],
  fechaInicio?: string,
  fechaFin?: string,
): ReportRow[] {
  const ticketMap = new Map(tickets.map((t) => [t.codigo, t.asignadoPor]));
  const holidayDates =
    fechaInicio && fechaFin ? listHolidaysInRange(fechaInicio, fechaFin) : [];

  const weekdayTasks = tasks.filter(
    (t) => isWeekday(t.fecha) && !isHoliday(t.fecha),
  );
  const groups = new Map<string, Task[]>();

  for (const task of weekdayTasks) {
    const key = `${task.fecha}|${task.rqTicket}|${task.aplicacion}`;
    const existing = groups.get(key);
    if (existing) existing.push(task);
    else groups.set(key, [task]);
  }

  const taskRows: ReportRow[] = Array.from(groups.entries()).map(([, groupTasks]) => {
    const first = groupTasks[0];
    const allCompleted = groupTasks.every((t) => t.status === 'completada');
    const detalle = groupTasks.map((t) => `• ${t.nombre}`).join('\n');

    return {
      sortDate: first.fecha,
      fecha: formatDateEs(first.fecha),
      asunto: formatAsunto(first.rqTicket),
      tipo: TIPO,
      aplicativo: first.aplicacion || '',
      solicitante: first.solicitante || ticketMap.get(first.rqTicket) || '',
      estado: allCompleted ? 'Finalizado' : 'Pendiente',
      detalle,
    };
  });

  const holidayRows: ReportRow[] = holidayDates.map((dateStr) => {
    const name = getHolidayName(dateStr) ?? 'Feriado';
    return {
      sortDate: dateStr,
      fecha: formatDateEs(dateStr),
      asunto: `Feriado - ${name}`,
      tipo: '-',
      aplicativo: '-',
      solicitante: '-',
      estado: '-',
      detalle: '-',
    };
  });

  return [...taskRows, ...holidayRows].sort((a, b) => a.sortDate.localeCompare(b.sortDate));
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

async function loadTemplateWorkbook(): Promise<ExcelJS.Workbook> {
  const response = await fetch(TEMPLATE_PATH);
  if (!response.ok) throw new Error('No se pudo cargar la plantilla Excel');

  const buffer = await response.arrayBuffer();
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer);
  return workbook;
}

export async function buildInformeBuffer({
  fechaInicio,
  fechaFin,
  tasks,
  tickets = [],
}: ReportExportOptions): Promise<ArrayBuffer | null> {
  const rows = buildReportRows(tasks, tickets, fechaInicio, fechaFin);
  if (rows.length === 0) return null;

  const workbook = await loadTemplateWorkbook();
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
    setCenteredCell(sheet, excelRow, 5, row.tipo, columnStyles);
    setCenteredCell(sheet, excelRow, 6, row.aplicativo, columnStyles);
    setCenteredCell(sheet, excelRow, 8, row.solicitante, columnStyles);
    setCenteredCell(sheet, excelRow, 9, row.asunto.startsWith('Feriado') ? '-' : AREA, columnStyles);
    setCenteredCell(sheet, excelRow, 10, row.estado, columnStyles);
    setDetalleCell(sheet, excelRow, row.detalle, detalleStyle);
  });

  return workbook.xlsx.writeBuffer();
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export async function exportInformeMensual(options: ReportExportOptions): Promise<void> {
  const buffer = await buildInformeBuffer(options);
  if (!buffer) return;

  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  downloadBlob(blob, buildReportFilename(options.fechaInicio, options.fechaFin, options.userName ?? ''));
}

export async function exportInformesEquipoZip({
  fechaInicio,
  fechaFin,
  teamName,
  members,
  tickets = [],
  fetchTasksForMember,
}: TeamZipExportOptions): Promise<TeamZipExportResult> {
  const zip = new JSZip();
  let exported = 0;
  let skipped = 0;

  for (const member of members) {
    const tasks = await fetchTasksForMember(member.userId);
    const buffer = await buildInformeBuffer({
      fechaInicio,
      fechaFin,
      tasks,
      tickets,
      userName: member.nombre,
    });

    if (!buffer) {
      skipped += 1;
      continue;
    }

    zip.file(buildReportFilename(fechaInicio, fechaFin, member.nombre), buffer);
    exported += 1;
  }

  if (exported === 0) {
    return { exported: 0, skipped };
  }

  const zipBlob = await zip.generateAsync({ type: 'blob' });
  downloadBlob(zipBlob, buildTeamZipFilename(fechaInicio, fechaFin, teamName));

  return { exported, skipped };
}
