const copFormatter = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0,
});

// formatCOP(25000) => "$ 25.000"
export const formatCOP = (value) => copFormatter.format(Number(value) || 0);

// SV001, SV002... (derivado del id, no existe columna "código" en la BD)
export const serviceCode = (id) => `SV${String(id).padStart(3, '0')}`;
