import React, { useState } from 'react';
import { 
  Search, Download, Eye, Printer, Ban, 
  ChevronLeft, ChevronRight, CheckCircle2, 
  DollarSign, ShoppingCart, TrendingUp, X 
} from 'lucide-react';

export default function Ventas() {
  const [busqueda, setBusqueda] = useState('');
  const [filtroMetodo, setFiltroMetodo] = useState('Todos');
  const [ventaSeleccionada, setVentaSeleccionada] = useState(null);
  const [alertaTicket, setAlertaTicket] = useState(null);

  // Lista de ventas simuladas
  const [ventas, setVentas] = useState([
    {
      id: 'VTA001',
      cliente: 'María García',
      avatar: 'MA',
      fecha: '10/08/2024 · 14:32',
      articulos: '3 ítem(s)',
      detalleItems: [
        { desc: 'Cuaderno Doble Línea 100H', cant: 2, precio: 12000 },
        { desc: 'Caja Lápices Grafito Faber-Castell', cant: 1, precio: 28360 }
      ],
      total: 52360,
      metodo: 'Efectivo',
      estado: 'Completado'
    },
    {
      id: 'VTA002',
      cliente: 'Ana Rodríguez',
      avatar: 'AN',
      fecha: '10/08/2024 · 14:15',
      articulos: '2 ítem(s)',
      detalleItems: [
        { desc: 'Carpeta Plástica Oficio', cant: 3, precio: 15000 },
        { desc: 'Marcadores Borrables x4', cant: 1, precio: 26650 }
      ],
      total: 41650,
      metodo: 'Transferencia',
      estado: 'Completado'
    },
    {
      id: 'VTA003',
      cliente: 'Laura Martínez',
      avatar: 'LA',
      fecha: '10/08/2024 · 13:58',
      articulos: '2 ítem(s)',
      detalleItems: [
        { desc: 'Calculadora Científica Casio FX', cant: 1, precio: 85000 },
        { desc: 'Pegante en Barra Grande', cant: 2, precio: 20910 }
      ],
      total: 105910,
      metodo: 'Transferencia',
      estado: 'Completado'
    },
    {
      id: 'VTA004',
      cliente: 'Valentina Cruz',
      avatar: 'VA',
      fecha: '09/08/2024 · 11:20',
      articulos: '2 ítem(s)',
      detalleItems: [
        { desc: 'Resma Papel Carta Reprograf', cant: 2, precio: 80000 },
        { desc: 'Grapadora Metálica + Grapas', cant: 1, precio: 33050 }
      ],
      total: 113050,
      metodo: 'Efectivo',
      estado: 'Completado'
    },
    {
      id: 'VTA005',
      cliente: 'María García',
      avatar: 'MA',
      fecha: '08/08/2024 · 16:45',
      articulos: '2 ítem(s)',
      detalleItems: [
        { desc: 'Tijeras de Precisión', cant: 2, precio: 25200 },
        { desc: 'Block Papel Mantequilla', cant: 2, precio: 70000 }
      ],
      total: 95200,
      metodo: 'Transferencia',
      estado: 'Completado'
    }
  ]);

  // Formato de moneda COP
  const formatoCOP = (monto) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0
    }).format(monto);
  };

  // Filtrado
  const ventasFiltradas = ventas.filter((v) => {
    const coincideBusqueda = 
      v.cliente.toLowerCase().includes(busqueda.toLowerCase()) ||
      v.id.toLowerCase().includes(busqueda.toLowerCase());
    const coincideMetodo = filtroMetodo === 'Todos' || v.metodo === filtroMetodo;
    return coincideBusqueda && coincideMetodo;
  });

  // Métricas
  const totalVentas = ventas.reduce((acc, v) => v.estado !== 'Anulado' ? acc + v.total : acc, 0);
  const cantidadVentas = ventas.filter(v => v.estado !== 'Anulado').length;
  const ticketPromedio = cantidadVentas > 0 ? totalVentas / cantidadVentas : 0;

  // Acciones
  const anularVenta = (id) => {
    if (window.confirm(`¿Estás seguro de anular la venta ${id}? Esta acción revertirá el inventario.`)) {
      setVentas(ventas.map(v => v.id === id ? { ...v, estado: 'Anulado' } : v));
    }
  };

  const imprimirTicket = (venta) => {
    setAlertaTicket(`Imprimiendo comprobante de venta para ${venta.id} - ${venta.cliente}...`);
    setTimeout(() => setAlertaTicket(null), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Notificación de Impresión */}
      {alertaTicket && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-2 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-lg border border-slate-700 text-xs font-semibold animate-in fade-in slide-in-from-top-2">
          <Printer className="w-4 h-4 text-rose-500 animate-pulse" />
          <span>{alertaTicket}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">VENTAS</span>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Historial de Ventas</h1>
          <p className="text-sm text-muted-foreground">
            Transacciones completadas desde el punto de venta de la papelería
          </p>
        </div>

        <button 
          onClick={() => alert('Exportando reporte de ventas a Excel/PDF...')}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl border border-border bg-card hover:bg-muted text-xs font-semibold text-foreground transition-all shadow-sm cursor-pointer"
        >
          <Download className="w-4 h-4 text-rose-500" />
          <span>Exportar</span>
        </button>
      </div>

      {/* Tarjetas KPI Superiores */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl border border-border bg-card shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center font-bold">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs text-muted-foreground font-medium">Total Recaudado</span>
            <p className="text-xl font-black text-foreground">{formatoCOP(totalVentas)}</p>
          </div>
        </div>

        <div className="p-4 rounded-2xl border border-border bg-card shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-violet-500/10 text-violet-500 flex items-center justify-center font-bold">
            <ShoppingCart className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs text-muted-foreground font-medium">Nº Ventas</span>
            <p className="text-xl font-black text-foreground">{cantidadVentas}</p>
          </div>
        </div>

        <div className="p-4 rounded-2xl border border-border bg-card shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center font-bold">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs text-muted-foreground font-medium">Ticket Promedio</span>
            <p className="text-xl font-black text-foreground">{formatoCOP(ticketPromedio)}</p>
          </div>
        </div>
      </div>

      {/* Filtros y Buscador */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por cliente o ID..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-rose-500 shadow-sm"
          />
        </div>

        <select
          value={filtroMetodo}
          onChange={(e) => setFiltroMetodo(e.target.value)}
          className="w-full sm:w-auto px-3 py-2 text-xs rounded-xl border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-rose-500 shadow-sm font-medium"
        >
          <option value="Todos">Todos los métodos</option>
          <option value="Efectivo">Efectivo</option>
          <option value="Transferencia">Transferencia</option>
        </select>
      </div>

      {/* Tabla de Ventas */}
      <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-muted/50 border-b border-border text-muted-foreground font-semibold">
                <th className="py-3.5 px-4">ID</th>
                <th className="py-3.5 px-4">Cliente</th>
                <th className="py-3.5 px-4">Fecha</th>
                <th className="py-3.5 px-4">Artículos</th>
                <th className="py-3.5 px-4">Total</th>
                <th className="py-3.5 px-4">Método</th>
                <th className="py-3.5 px-4 text-center">Estado</th>
                <th className="py-3.5 px-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {ventasFiltradas.length === 0 ? (
                <tr>
                  <td colSpan="8" className="text-center py-8 text-muted-foreground">
                    No se encontraron registros de ventas coincidentes.
                  </td>
                </tr>
              ) : (
                ventasFiltradas.map((venta) => (
                  <tr key={venta.id} className="hover:bg-muted/40 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-rose-500">{venta.id}</td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-rose-500/10 text-rose-600 font-bold text-[11px] flex items-center justify-center">
                          {venta.avatar}
                        </div>
                        <span className="font-semibold text-foreground">{venta.cliente}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-muted-foreground">{venta.fecha}</td>
                    <td className="py-3.5 px-4 text-foreground font-medium">{venta.articulos}</td>
                    <td className="py-3.5 px-4 font-black text-foreground">{formatoCOP(venta.total)}</td>
                    <td className="py-3.5 px-4">
                      <span className="font-medium text-foreground">{venta.metodo}</span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                        venta.estado === 'Completado' 
                          ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' 
                          : 'bg-rose-500/10 text-rose-600 border-rose-500/20'
                      }`}>
                        {venta.estado}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setVentaSeleccionada(venta)}
                          title="Ver detalle"
                          className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                        >
                          <Eye className="w-4 h-4 text-blue-500" />
                        </button>
                        <button
                          onClick={() => imprimirTicket(venta)}
                          title="Imprimir ticket"
                          className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                        >
                          <Printer className="w-4 h-4 text-slate-500" />
                        </button>
                        {venta.estado !== 'Anulado' && (
                          <button
                            onClick={() => anularVenta(venta.id)}
                            title="Anular venta"
                            className="p-1.5 rounded-lg hover:bg-rose-50 text-muted-foreground hover:text-rose-600 transition-colors cursor-pointer"
                          >
                            <Ban className="w-4 h-4 text-rose-500" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Paginación */}
        <div className="px-4 py-3 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
          <span>Mostrando 1 a {ventasFiltradas.length} de {ventas.length} registros</span>
          <div className="flex items-center gap-1">
            <button disabled className="p-1.5 rounded-lg border border-border opacity-50 cursor-not-allowed">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button className="px-2.5 py-1 rounded-lg bg-rose-500 text-white font-bold">1</button>
            <button className="px-2.5 py-1 rounded-lg hover:bg-muted font-medium">2</button>
            <button className="p-1.5 rounded-lg border border-border hover:bg-muted cursor-pointer">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Modal: Detalle de Venta */}
      {ventaSeleccionada && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card w-full max-w-lg rounded-2xl border border-border shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
            <div className="px-5 py-4 border-b border-border flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-rose-500 uppercase tracking-widest">COMPROBANTE</span>
                <h3 className="text-base font-bold text-foreground">Detalle de Venta {ventaSeleccionada.id}</h3>
              </div>
              <button
                onClick={() => setVentaSeleccionada(null)}
                className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3 bg-muted/40 p-3 rounded-xl border border-border">
                <div>
                  <span className="text-muted-foreground">Cliente:</span>
                  <p className="font-bold text-foreground text-sm">{ventaSeleccionada.cliente}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Fecha y hora:</span>
                  <p className="font-medium text-foreground">{ventaSeleccionada.fecha}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Método de pago:</span>
                  <p className="font-medium text-foreground">{ventaSeleccionada.metodo}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Estado:</span>
                  <p className="font-bold text-emerald-600">{ventaSeleccionada.estado}</p>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-foreground mb-2">Artículos Facturados</h4>
                <div className="space-y-2">
                  {ventaSeleccionada.detalleItems?.map((it, idx) => (
                    <div key={idx} className="flex items-center justify-between py-1.5 border-b border-border">
                      <div>
                        <p className="font-medium text-foreground">{it.desc}</p>
                        <span className="text-[11px] text-muted-foreground">{it.cant} unidad(es)</span>
                      </div>
                      <span className="font-bold text-foreground">{formatoCOP(it.precio)}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between text-sm font-black text-foreground border-t border-border">
                <span>Total Facturado:</span>
                <span className="text-lg text-rose-500">{formatoCOP(ventaSeleccionada.total)}</span>
              </div>
            </div>

            <div className="px-5 py-3 border-t border-border bg-muted/20 flex items-center justify-end gap-2">
              <button
                onClick={() => setVentaSeleccionada(null)}
                className="px-4 py-2 rounded-xl border border-border hover:bg-muted text-xs font-semibold"
              >
                Cerrar
              </button>
              <button
                onClick={() => {
                  imprimirTicket(ventaSeleccionada);
                  setVentaSeleccionada(null);
                }}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold transition-all shadow-sm"
              >
                <Printer className="w-4 h-4" />
                <span>Imprimir Ticket</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}