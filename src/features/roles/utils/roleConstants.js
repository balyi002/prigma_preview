// Lista canónica de los 14 permisos oficiales del sistema según el modelo de datos
export const CANONICAL_PERMISOS = [
  { id_permiso: 1, nombre_permiso: 'Dashboard', label: 'Dashboard', descripcion: 'Panel principal y métricas generales' },
  { id_permiso: 2, nombre_permiso: 'Roles', label: 'Roles', descripcion: 'Gestión de roles del sistema' },
  { id_permiso: 3, nombre_permiso: 'Usuarios', label: 'Gestión de Usuarios', descripcion: 'Gestión de usuarios y accesos' },
  { id_permiso: 4, nombre_permiso: 'Categoria de Productos', label: 'Categoría de Productos', descripcion: 'Clasificación de productos' },
  { id_permiso: 5, nombre_permiso: 'Productos', label: 'Gestión de Productos', descripcion: 'Gestión de catálogo e inventario de productos' },
  { id_permiso: 6, nombre_permiso: 'Proveedores', label: 'Proveedores', descripcion: 'Gestión de proveedores' },
  { id_permiso: 7, nombre_permiso: 'Compras', label: 'Gestión de Compras', descripcion: 'Gestión de órdenes y facturas de compra' },
  { id_permiso: 8, nombre_permiso: 'Categoria de Servicios', label: 'Categoría de Servicios', descripcion: 'Clasificación de servicios' },
  { id_permiso: 9, nombre_permiso: 'Servicios', label: 'Gestión de Servicios', descripcion: 'Gestión de catálogo de servicios' },
  { id_permiso: 10, nombre_permiso: 'Empleados', label: 'Empleados', descripcion: 'Gestión y control de personal' },
  { id_permiso: 11, nombre_permiso: 'Agenda', label: 'Agenda', descripcion: 'Programación de horarios y citas' },
  { id_permiso: 12, nombre_permiso: 'Ventas', label: 'Ventas', descripcion: 'Gestión de ventas y facturación' },
  { id_permiso: 13, nombre_permiso: 'Pedidos', label: 'Pedidos', descripcion: 'Gestión de pedidos y apartados' },
  { id_permiso: 14, nombre_permiso: 'Clientes', label: 'Clientes', descripcion: 'Gestión de cartera de clientes' }
];

export const normalizePermName = (name = '') =>
  String(name || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/^gestion de\s+/, '')
    .trim();

export const isDashboardPerm = (perm) => {
  if (!perm) return false;
  if (typeof perm === 'object' && perm.id_permiso === 1) return true;
  const name = typeof perm === 'object' ? perm.nombre_permiso || perm.label : perm;
  return normalizePermName(name) === 'dashboard';
};
