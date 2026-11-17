// Todo el módulo trabaja con fechas "YYYY-MM-DD" (columna DATE de horarios_empleados).
// Se usan getters LOCALES (no toISOString) para que "hoy" no se corra de día por la zona horaria.
export const DAY_LABELS = ['LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB', 'DOM'];
const MONTHS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

const pad = (n) => String(n).padStart(2, '0');

export const toISODate = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

export function parseISODate(iso) {
  const [y, m, d] = String(iso).slice(0, 10).split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function addDays(date, n) {
  const copy = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  copy.setDate(copy.getDate() + n);
  return copy;
}

// Semana de lunes a domingo
export function startOfWeek(date) {
  const copy = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  copy.setDate(copy.getDate() - ((copy.getDay() + 6) % 7));
  return copy;
}

// El servidor puede devolver "2026-11-17" o "2026-11-17T00:00:00.000Z": nos quedamos con el día.
export const dateKey = (value) => (value ? String(value).slice(0, 10) : '');

export function formatWeekRange(start) {
  const end = addDays(start, 6);
  const sameYear = start.getFullYear() === end.getFullYear();
  const sameMonth = sameYear && start.getMonth() === end.getMonth();

  if (sameMonth) return `${start.getDate()} – ${end.getDate()} ${MONTHS[end.getMonth()]} ${end.getFullYear()}`;
  if (sameYear) {
    return `${start.getDate()} ${MONTHS[start.getMonth()]} – ${end.getDate()} ${MONTHS[end.getMonth()]} ${end.getFullYear()}`;
  }
  return `${start.getDate()} ${MONTHS[start.getMonth()]} ${start.getFullYear()} – ${end.getDate()} ${MONTHS[end.getMonth()]} ${end.getFullYear()}`;
}

export function formatLongDate(iso) {
  const d = parseISODate(iso);
  return `${DAY_LABELS[(d.getDay() + 6) % 7]} ${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}
