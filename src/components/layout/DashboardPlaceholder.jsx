import React from 'react';
import { DollarSign, TrendingUp, FileText, ShoppingBag, Calendar, AlertCircle } from 'lucide-react';

export default function DashboardPlaceholder() {
  const kpis = [
    {
      title: 'INGRESOS DEL PERÍODO',
      value: '$ 0',
      subtitle: '0 trans. · Noviembre 2026',
      icon: DollarSign,
      color: 'bg-primary/10 text-primary',
    },
    {
      title: 'VENTAS COMPLETADAS',
      value: '0',
      subtitle: 'Total · Noviembre 2026',
      icon: TrendingUp,
      color: 'bg-purple-100 text-purple-600 dark:bg-purple-950/50 dark:text-purple-300',
    },
    {
      title: 'PEDIDOS ACTIVOS',
      value: '0',
      subtitle: 'Pendientes · Noviembre 2026',
      icon: FileText,
      color: 'bg-amber-100 text-amber-600 dark:bg-amber-950/50 dark:text-amber-300',
    },
    {
      title: 'TICKET PROMEDIO',
      value: '$ 0',
      subtitle: 'Por trans. · Noviembre 2026',
      icon: ShoppingBag,
      color: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-300',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Encabezado del Dashboard */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="font-black text-xl text-foreground">Dashboard</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Variedades Carito · Resumen del negocio</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-border bg-card text-xs font-bold text-foreground">
          <Calendar className="w-4 h-4 text-primary" />
          <span>Noviembre 2026</span>
        </div>
      </div>

      {/* Tarjetas KPI de Resumen */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi, idx) => (
          <div
            key={idx}
            className="bg-card border border-border rounded-2xl p-5 shadow-xs transition-all hover:border-primary/30 flex items-start justify-between"
          >
            <div className="space-y-1">
              <p className="text-[11px] font-black uppercase tracking-wider text-muted-foreground">
                {kpi.title}
              </p>
              <p className="text-xl font-black text-foreground">{kpi.value}</p>
              <p className="text-[10px] text-muted-foreground font-semibold">{kpi.subtitle}</p>
            </div>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${kpi.color}`}>
              <kpi.icon className="w-5 h-5" />
            </div>
          </div>
        ))}
      </div>

      {/* Nota de delimitación de responsabilidades */}
      <div className="bg-card border border-border rounded-2xl p-8 text-center space-y-3 shadow-xs">
        <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto shadow-inner">
          <AlertCircle className="w-6 h-6" />
        </div>
        <div className="max-w-md mx-auto space-y-1">
          <h3 className="text-base font-black text-foreground">
            Módulo Dashboard (Medición y Desempeño)
          </h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Este módulo y sus gráficos analíticos corresponden al subproceso de <strong>Anyi Carolina González</strong>.
            La estructura de navegación (Navbar y Sidebar) se encuentra 100% activa.
          </p>
        </div>
      </div>
    </div>
  );
}
