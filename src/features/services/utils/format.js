const copFormatter = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0,
});

// formatCOP(25000) => "$ 25.000"
export const formatCOP = (value) => copFormatter.format(Number(value) || 0);

// SV001, SV002... (derivado del id, no existe columna "código" en la BD)
export const serviceCode = (id) => `SV${String(id).padStart(3, '0')}`;

// 0 => "Inmediato" · 45 => "45 min" · 90 => "1 h 30 min"
export function formatDuration(minutes) {
  const total = Number(minutes) || 0;
  if (total <= 0) return 'Inmediato';
  if (total < 60) return `${total} min`;
  const h = Math.floor(total / 60);
  const m = total % 60;
  return m ? `${h} h ${m} min` : `${h} h`;
}
