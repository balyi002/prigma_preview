// Cada empleado conserva siempre el mismo color (según su posición en la lista de usuarios).
const COLORS = ['#EC4899', '#8B5CF6', '#0EA5E9', '#F59E0B', '#10B981', '#F97316', '#6366F1', '#14B8A6'];

export const colorFor = (index) => COLORS[Math.abs(index) % COLORS.length];

export const initials = (nombre = '', apellido = '') =>
  `${nombre.trim()[0] ?? ''}${apellido.trim()[0] ?? ''}`.toUpperCase() || '?';
