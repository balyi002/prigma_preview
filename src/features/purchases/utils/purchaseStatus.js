// Los nombres de estado vienen de la tabla `estados` (compartida con pedidos): Apartado, Pendiente,
// Completado y Cancelado (la columna es `nombre_estado`). Si cambian, solo hay que ajustar estas listas.
const normalize = (s = '') =>
  String(s)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();

const OPEN = ['pendiente', 'apartada', 'apartado']; // se pueden editar / eliminar
const GREEN = ['pagado', 'pagada', 'completado', 'completada', 'recibido', 'recibida'];
const RED = ['cancelado', 'cancelada', 'anulado', 'anulada'];

// La columna del nombre puede variar según cómo se creó la tabla
export const getStatusName = (estado) =>
  estado?.nombre_estado ?? estado?.nombre ?? estado?.descripcion ?? estado?.estado ?? '';

export const isOpenStatus = (name) => OPEN.includes(normalize(name));
export const isCanceledStatus = (name) => RED.includes(normalize(name));

const TONES = {
  green:
    'bg-green-100 text-green-700 border-green-300 dark:bg-green-950/50 dark:text-green-300 dark:border-green-800',
  yellow:
    'bg-yellow-50 text-yellow-700 border-yellow-300 dark:bg-yellow-950/40 dark:text-yellow-300 dark:border-yellow-800',
  orange:
    'bg-orange-100 text-orange-700 border-orange-300 dark:bg-orange-950/50 dark:text-orange-300 dark:border-orange-800',
  red: 'bg-red-100 text-red-600 border-red-300 dark:bg-red-950/50 dark:text-red-300 dark:border-red-800',
  gray: 'bg-muted text-foreground border-border',
};

export function statusClasses(name) {
  const n = normalize(name);
  if (GREEN.includes(n)) return TONES.green;
  if (RED.includes(n)) return TONES.red;
  if (n === 'pendiente') return TONES.yellow;
  if (n === 'apartada' || n === 'apartado') return TONES.orange;
  return TONES.gray;
}
