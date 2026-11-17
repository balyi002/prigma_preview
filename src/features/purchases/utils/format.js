const copFormatter = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0,
});

// formatCOP(1019000) => "$ 1.019.000"
export const formatCOP = (value) => copFormatter.format(Number(value) || 0);

// Una columna DATE llega como "2024-08-05T00:00:00.000Z" (o "2024-08-05"): se toma el día tal cual.
// Una columna DATETIME/TIMESTAMP sí se convierte a la hora local del navegador.
const isDateOnly = (str) => str.length === 10 || /T00:00:00(\.000)?Z$/.test(str);

export function formatDate(value) {
  if (!value) return '—';
  const str = String(value);
  if (isDateOnly(str)) {
    const [y, m, d] = str.slice(0, 10).split('-');
    return `${d}/${m}/${y}`;
  }
  const date = new Date(str);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

// Valor numérico para ordenar / comparar fechas
export function dateValue(value) {
  if (!value) return 0;
  const str = String(value);
  const time = Date.parse(isDateOnly(str) ? str.slice(0, 10) : str);
  return Number.isNaN(time) ? 0 : time;
}
