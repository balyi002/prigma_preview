import React from 'react';
import {
  ShoppingBag,
  Settings,
  Lock,
  User,
  Users,
  Tag,
  Package,
  Truck,
  DollarSign,
  Briefcase,
  Star,
  Clock,
  FileText,
  BookOpen,
  LayoutDashboard,
  LogOut,
  Sun,
  Moon,
  ChevronDown,
  BookmarkCheck // <--- Ícono agregado para Separados
} from 'lucide-react';

export default function Sidebar({
  currentView,
  onNavigate,
  currentUser,
  onLogout,
  theme,
  onToggleTheme
}) {
  const navSections = [
    {
      title: 'CONFIGURACIÓN',
      icon: Settings,
      items: [
        { id: 'roles', label: 'Roles', icon: Lock }
      ]
    },
    {
      title: 'USUARIOS',
      icon: User,
      items: [
        { id: 'users', label: 'Gestión de Usuarios', icon: Users, disabledNote: 'Módulo de Danilo Velásquez' }
      ]
    },
    {
      title: 'COMPRAS',
      icon: Package,
      items: [
        { id: 'product-categories', label: 'Categoría de Productos', icon: Tag },
        { id: 'products', label: 'Gestión de Productos', icon: Package, disabledNote: 'Módulo de Diego Agudelo' },
        { id: 'suppliers', label: 'Proveedores', icon: Truck, disabledNote: 'Módulo de Danilo Velásquez' },
        { id: 'purchases', label: 'Gestión de Compras', icon: DollarSign, disabledNote: 'Módulo de Yojhan Barrada' }
      ]
    },
    {
      title: 'SERVICIOS',
      icon: Briefcase,
      items: [
        { id: 'service-categories', label: 'Categoría de Servicios', icon: Tag, disabledNote: 'Módulo de Diego Agudelo' },
        { id: 'services', label: 'Gestión de Servicios', icon: Star, disabledNote: 'Módulo de Yojhan Barrada' },
        { id: 'employees', label: 'Empleados', icon: Users, disabledNote: 'Módulo de Diego Agudelo' },
        { id: 'agenda', label: 'Agenda', icon: Clock, disabledNote: 'Módulo de Yojhan Barrada' }
      ]
    },
    {
      title: 'VENTAS',
      icon: DollarSign,
      items: [
        // AQUÍ ESTÁN TUS MÓDULOS DE VENTAS:
        { id: 'sales', label: 'Ventas', icon: BookOpen },
        { id: 'separados', label: 'Gestión de Separados', icon: BookmarkCheck },
        { id: 'orders', label: 'Pedidos', icon: FileText },
        { id: 'clients', label: 'Clientes', icon: Users, disabledNote: 'Módulo de Danilo Velásquez' }
      ]
    },
    {
      title: 'MEDICIÓN Y DESEMPEÑO',
      icon: LayoutDashboard,
      items: [
        // AQUÍ ESTÁ TU MÓDULO DE DASHBOARD:
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard }
      ]
    }
  ];

  const getInitials = (name, last) => {
    const f = (name || 'A')[0];
    const l = (last || 'D')[0];
    return `${f}${l}`.toUpperCase();
  };

  return (
    <aside className="w-64 bg-sidebar border-r border-sidebar-border h-screen flex flex-col justify-between flex-shrink-0 select-none z-30 transition-colors">
      {/* Cabecera con Logotipo Oficial */}
      <div className="p-5 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm shadow-primary/25">
            <ShoppingBag className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="font-black text-sm text-sidebar-foreground leading-none tracking-tight">PRIGMA</p>
            <p className="text-xs text-muted-foreground mt-0.5">Variedades Carito</p>
          </div>
        </div>
      </div>

      {/* Menú de Navegación con Scroll */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-4">
        {navSections.map((sec) => (
          <div key={sec.title} className="space-y-1">
            <div className="flex items-center justify-between px-3 py-1 text-[11px] font-black uppercase tracking-wider text-muted-foreground/80">
              <span className="flex items-center gap-1.5">
                <sec.icon className="w-3 h-3 text-muted-foreground" />
                {sec.title}
              </span>
              <ChevronDown className="w-3 h-3 text-muted-foreground/60" />
            </div>

            <div className="space-y-0.5">
              {sec.items.map((item) => {
                const isActive = currentView === item.id;
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => onNavigate(item.id)}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold transition-all text-left cursor-pointer ${
                      isActive
                        ? 'bg-sidebar-accent text-sidebar-accent-foreground font-black shadow-xs'
                        : 'text-sidebar-foreground/80 hover:bg-muted/60 hover:text-sidebar-foreground'
                    }`}
                  >
                    <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-primary' : 'text-muted-foreground'}`} />
                    <span className="truncate">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Pie de Sidebar: Selector de Tema y Perfil de Usuario */}
      <div className="p-3 border-t border-sidebar-border space-y-3 bg-sidebar/50">
        {/* Conmutador de Tema Claro / Oscuro */}
        <div className="flex items-center justify-between px-2 py-1 text-xs font-bold text-muted-foreground">
          <span>Tema:</span>
          <button
            onClick={onToggleTheme}
            type="button"
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-border bg-card hover:bg-muted text-[11px] font-bold text-foreground transition-all cursor-pointer"
          >
            {theme === 'dark' ? (
              <>
                <Sun className="w-3.5 h-3.5 text-amber-400" />
                <span>Oscuro</span>
              </>
            ) : (
              <>
                <Moon className="w-3.5 h-3.5 text-purple-600" />
                <span>Claro</span>
              </>
            )}
          </button>
        </div>

        {/* Ficha de Usuario Logueado */}
        <div className="flex items-center justify-between p-2 rounded-xl bg-card border border-border">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-full bg-primary/10 text-primary font-black text-xs flex items-center justify-center flex-shrink-0 border border-primary/20">
              {getInitials(currentUser?.nombre_usuario, currentUser?.apellido_usuario)}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-foreground truncate leading-tight">
                {currentUser?.nombre_usuario || 'Admin'} {currentUser?.apellido_usuario || 'Principal'}
              </p>
              <p className="text-[10px] text-muted-foreground truncate capitalize">
                {currentUser?.nombre_rol || 'Administrador'}
              </p>
            </div>
          </div>
          <button
            onClick={onLogout}
            title="Cerrar Sesión"
            className="text-muted-foreground hover:text-destructive p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}