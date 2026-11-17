import React, { useState } from 'react';
import { 
  TrendingUp, DollarSign, FileText, ShoppingBag, 
  Calendar, ArrowUpRight, ArrowDownRight, CreditCard, Wallet 
} from 'lucide-react';

export default function Dashboard() {
  const [periodo, setPeriodo] = useState('Noviembre 2026');

  // Métricas principales
  const kpis = [
    {
      title: 'Ingresos del Período',
      value: '$ 459.340',
      change: '+12.5%',
      isPositive: true,
      description: '6 transacciones completadas',
      icon: DollarSign,
      color: 'bg-rose-500/10 text-rose-500 border-rose-500/20'
    },
    {
      title: 'Ventas Realizadas',
      value: '6',
      change: '+20%',
      isPositive: true,
      description: 'Ventas en mostrador',
      icon: TrendingUp,
      color: 'bg-violet-500/10 text-violet-500 border-violet-500/20'
    },
    {
      title: 'Separados / Pedidos Activos',
      value: '4',
      change: '2 por liquidar',
      isPositive: true,
      description: 'Pendientes por entrega',
      icon: FileText,
      color: 'bg-amber-500/10 text-amber-500 border-amber-500/20'
    },
    {
      title: 'Ticket Promedio',
      value: '$ 76.557',
      change: '+5.3%',
      isPositive: true,
      description: 'Promedio por compra',
      icon: ShoppingBag,
      color: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
    }
  ];

  // Datos simulados de ventas de la semana
  const ventasSemana = [
    { dia: 'Lun', total: 65000, altura: '45%' },
    { dia: 'Mar', total: 42000, altura: '30%' },
    { dia: 'Mié', total: 89000, altura: '65%' },
    { dia: 'Jue', total: 110000, altura: '80%' },
    { dia: 'Vie', total: 145000, altura: '100%' },
    { dia: 'Sáb', total: 95000, altura: '70%' },
    { dia: 'Dom', total: 32000, altura: '25%' }
  ];

  // Top productos de papelería
  const topProductos = [
    { nombre: 'Cuaderno Argollado 100H', categoria: 'Cuadernos', cantidad: 34, porcentaje: 85 },
    { nombre: 'Caja Colores x24 Norma', categoria: 'Arte y Dibujo', cantidad: 22, porcentaje: 60 },
    { nombre: 'Resma Papel Carta 75g', categoria: 'Papelería', cantidad: 18, porcentaje: 45 },
    { nombre: 'Marcador Permanente Sharpie', categoria: 'Escritura', cantidad: 15, porcentaje: 35 }
  ];

  // Últimas ventas
  const ultimasTransacciones = [
    { id: 'VTA001', cliente: 'María García', avatar: 'MG', metodo: 'Efectivo', total: '$ 52.360', hora: 'Hoy, 14:32', estado: 'Completado' },
    { id: 'VTA002', cliente: 'Ana Rodríguez', avatar: 'AR', metodo: 'Transferencia', total: '$ 41.650', hora: 'Hoy, 14:15', estado: 'Completado' },
    { id: 'VTA003', cliente: 'Laura Martínez', avatar: 'LM', metodo: 'Transferencia', total: '$ 105.910', hora: 'Hoy, 13:58', estado: 'Completado' },
    { id: 'VTA004', cliente: 'Valentina Cruz', avatar: 'VC', metodo: 'Efectivo', total: '$ 113.050', hora: 'Ayer, 11:20', estado: 'Completado' }
  ];

  return (
    <div className="space-y-6">
      {/* Header del Dashboard */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            MEDICIÓN Y DESEMPEÑO
          </span>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Dashboard General</h1>
          <p className="text-sm text-muted-foreground">
            Resumen en tiempo real del flujo de ventas y rendimiento del negocio.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-border bg-card text-xs font-medium text-foreground shadow-sm">
            <Calendar className="w-4 h-4 text-rose-500" />
            <span>{periodo}</span>
          </div>
        </div>
      </div>

      {/* Tarjetas KPI */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <div
              key={idx}
              className="p-5 rounded-2xl border border-border bg-card shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-muted-foreground">{kpi.title}</span>
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center border ${kpi.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
              </div>
              <div>
                <h3 className="text-2xl font-black text-foreground tracking-tight">{kpi.value}</h3>
                <div className="flex items-center gap-1.5 mt-2">
                  <span className="inline-flex items-center text-xs font-semibold text-emerald-500">
                    <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" />
                    {kpi.change}
                  </span>
                  <span className="text-xs text-muted-foreground truncate">· {kpi.description}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Gráfico y Top Productos */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Gráfico de barras semanal */}
        <div className="lg:col-span-2 p-5 rounded-2xl border border-border bg-card shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-base font-bold text-foreground">Ventas de la Semana</h2>
              <p className="text-xs text-muted-foreground">Comportamiento de ingresos diarios</p>
            </div>
            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-rose-500/10 text-rose-500">
              Semana Actual
            </span>
          </div>

          <div className="h-56 flex items-end justify-between gap-3 pt-6 pb-2 px-2">
            {ventasSemana.map((item, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-2 group h-full justify-end">
                <div className="opacity-0 group-hover:opacity-100 transition-opacity text-[10px] font-bold text-foreground bg-popover px-1.5 py-0.5 rounded shadow border border-border">
                  ${(item.total / 1000).toFixed(0)}k
                </div>
                <div 
                  className="w-full max-w-[42px] rounded-t-xl bg-gradient-to-t from-rose-600 to-rose-400 group-hover:from-rose-500 group-hover:to-pink-400 transition-all shadow-sm"
                  style={{ height: item.altura }}
                />
                <span className="text-xs font-medium text-muted-foreground">{item.dia}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Top Productos */}
        <div className="p-5 rounded-2xl border border-border bg-card shadow-sm flex flex-col justify-between">
          <div>
            <h2 className="text-base font-bold text-foreground">Productos Más Vendidos</h2>
            <p className="text-xs text-muted-foreground mb-4">Rotación de artículos de papelería</p>

            <div className="space-y-4">
              {topProductos.map((prod, i) => (
                <div key={i} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-foreground truncate max-w-[170px]">{prod.nombre}</span>
                    <span className="font-bold text-rose-500">{prod.cantidad} uds</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
                    <div 
                      className="h-full rounded-full bg-rose-500 transition-all duration-500"
                      style={{ width: `${prod.porcentaje}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
            <span>Total unidades vendidas hoy:</span>
            <span className="font-bold text-foreground">89</span>
          </div>
        </div>
      </div>

      {/* Últimas Transacciones */}
      <div className="p-5 rounded-2xl border border-border bg-card shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-bold text-foreground">Últimas Ventas Registradas</h2>
            <p className="text-xs text-muted-foreground">Transacciones procesadas en caja recientemente</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-border text-muted-foreground font-semibold">
                <th className="pb-3">ID Transacción</th>
                <th className="pb-3">Cliente</th>
                <th className="pb-3">Método</th>
                <th className="pb-3">Fecha y Hora</th>
                <th className="pb-3 text-right">Monto</th>
                <th className="pb-3 text-center">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {ultimasTransacciones.map((tx) => (
                <tr key={tx.id} className="hover:bg-muted/40 transition-colors">
                  <td className="py-3 font-mono font-bold text-rose-500">{tx.id}</td>
                  <td className="py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-rose-500/10 text-rose-600 font-black text-[10px] flex items-center justify-center">
                        {tx.avatar}
                      </div>
                      <span className="font-semibold text-foreground">{tx.cliente}</span>
                    </div>
                  </td>
                  <td className="py-3">
                    <span className="inline-flex items-center gap-1 font-medium text-foreground">
                      {tx.metodo === 'Efectivo' ? (
                        <Wallet className="w-3.5 h-3.5 text-emerald-500" />
                      ) : (
                        <CreditCard className="w-3.5 h-3.5 text-blue-500" />
                      )}
                      {tx.metodo}
                    </span>
                  </td>
                  <td className="py-3 text-muted-foreground">{tx.hora}</td>
                  <td className="py-3 text-right font-black text-foreground">{tx.total}</td>
                  <td className="py-3 text-center">
                    <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                      {tx.estado}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}