/**
 * Feriados nacionales de Perú (no laborables).
 * Incluye feriados fijos y Semana Santa (Jueves y Viernes Santo).
 */

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

export function toDateStr(date: Date): string {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

/** Algoritmo gregoriano anónimo → Domingo de Pascua */
function easterSunday(year: number): Date {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(year, month - 1, day);
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

/** Mes-día fijos: MM-DD → nombre */
const FIXED_HOLIDAYS: ReadonlyArray<{ md: string; name: string }> = [
  { md: '01-01', name: 'Año Nuevo' },
  { md: '05-01', name: 'Día del Trabajo' },
  { md: '06-29', name: 'San Pedro y San Pablo' },
  { md: '07-28', name: 'Fiestas Patrias' },
  { md: '07-29', name: 'Fiestas Patrias' },
  { md: '08-30', name: 'Santa Rosa de Lima' },
  { md: '10-08', name: 'Combate de Angamos' },
  { md: '11-01', name: 'Día de Todos los Santos' },
  { md: '12-08', name: 'Inmaculada Concepción' },
  { md: '12-09', name: 'Batalla de Ayacucho' },
  { md: '12-25', name: 'Navidad' },
];

const holidayCache = new Map<number, Map<string, string>>();

function holidaysForYear(year: number): Map<string, string> {
  const cached = holidayCache.get(year);
  if (cached) return cached;

  const map = new Map<string, string>();
  for (const { md, name } of FIXED_HOLIDAYS) {
    map.set(`${year}-${md}`, name);
  }

  const easter = easterSunday(year);
  map.set(toDateStr(addDays(easter, -3)), 'Jueves Santo');
  map.set(toDateStr(addDays(easter, -2)), 'Viernes Santo');

  holidayCache.set(year, map);
  return map;
}

export function getHolidayName(dateStr: string): string | null {
  const year = Number(dateStr.slice(0, 4));
  if (!year) return null;
  return holidaysForYear(year).get(dateStr) ?? null;
}

export function isHoliday(dateStr: string): boolean {
  return getHolidayName(dateStr) != null;
}

export function isWeekday(dateStr: string): boolean {
  const day = new Date(`${dateStr}T00:00:00`).getDay();
  return day !== 0 && day !== 6;
}

/** Feriados que caen en día laboral dentro del rango inclusivo */
export function listHolidaysInRange(fechaInicio: string, fechaFin: string): string[] {
  const result: string[] = [];
  const start = new Date(`${fechaInicio}T00:00:00`);
  const end = new Date(`${fechaFin}T00:00:00`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || start > end) {
    return result;
  }

  const cursor = new Date(start);
  while (cursor <= end) {
    const dateStr = toDateStr(cursor);
    if (isWeekday(dateStr) && isHoliday(dateStr)) {
      result.push(dateStr);
    }
    cursor.setDate(cursor.getDate() + 1);
  }
  return result;
}
