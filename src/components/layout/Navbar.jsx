import React from 'react';
import { Bell, Sun, Moon } from 'lucide-react';

export default function Navbar({ currentView, currentUser, theme, onToggleTheme }) {
  const breadcrumbMap = {
    roles: { section: 'CONFIGURACIÓN', page: 'Roles' },
    'product-categories': { section: 'COMPRAS', page: 'Categoría de Productos' },
    orders: { section: 'VENTAS', page: 'Pedidos' },
    pos: { section: 'VENTAS', page: 'Punto de Venta (POS)' },
    dashboard: { section: 'MEDICIÓN Y DESEMPEÑO', page: 'Dashboard' },
    users: { section: 'USUARIOS', page: 'Gestión de Usuarios' },
    products: { section: 'COMPRAS', page: 'Gestión de Productos' },
    suppliers: { section: 'COMPRAS', page: 'Proveedores' },
    purchases: { section: 'COMPRAS', page: 'Gestión de Compras' },
    'service-categories': { section: 'SERVICIOS', page: 'Categoría de Servicios' },
    services: { section: 'SERVICIOS', page: 'Gestión de Servicios' },
    employees: { section: 'SERVICIOS', page: 'Empleados' },
    agenda: { section: 'SERVICIOS', page: 'Agenda' },
    clients: { section: 'VENTAS', page: 'Clientes' },
    sales: { section: 'VENTAS', page: 'Ventas' },
  };

  const current = breadcrumbMap[currentView] || { section: 'SISTEMA', page: 'PRIGMA' };

  return (
    <header className="h-16 bg-card border-b border-border px-6 flex items-center justify-between flex-shrink-0 z-20 transition-colors">
      {/* Breadcrumb de navegación */}
      <div className="flex items-center gap-2 text-xs font-bold">
        <span className="text-muted-foreground uppercase tracking-wide">{current.section}</span>
        <span className="text-muted-foreground/60">&gt;</span>
        <span className="text-foreground font-black">{current.page}</span>
      </div>

      {/* Acciones y Notificaciones */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleTheme}
          type="button"
          className="p-2 rounded-xl border border-border bg-background hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          title={theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
        >
          {theme === 'dark' ? (
            <Sun className="w-4 h-4 text-amber-400" />
          ) : (
            <Moon className="w-4 h-4 text-purple-600" />
          )}
        </button>

        <button
          type="button"
          className="p-2 rounded-xl border border-border bg-background hover:bg-muted text-muted-foreground hover:text-foreground relative transition-colors cursor-pointer"
          title="Notificaciones"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-primary" />
        </button>

        <div className="h-6 w-px bg-border mx-1" />

        <div className="flex items-center gap-2 text-xs">
          <span className="text-muted-foreground hidden sm:inline">Hola,</span>
          <span className="font-bold text-foreground">{currentUser?.nombre_usuario || 'Usuario'}</span>
        </div>
      </div>
    </header>
  );
}
