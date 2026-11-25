import React, { useState, useEffect, useMemo } from 'react';
import {
  Plus,
  Search,
  FileDown,
  Eye,
  Printer,
  Trash2,
  DollarSign,
  Package,
  CheckCircle2,
  Clock,
  BookmarkCheck,
  XCircle,
  FileText
} from 'lucide-react';
import { orderService } from '../services/orderService';
import { formatCOP, printTicket } from '../../../utils/format';
import OrderDetailModal from '../components/OrderDetailModal';
import AbonarModal from '../components/AbonarModal';
import AddItemsModal from '../components/AddItemsModal';
import POSView from '../components/POSView';
import ConfirmDialog from '../../../components/ui/ConfirmDialog';
import FeedbackToast from '../../../components/ui/FeedbackToast';
import Pagination from '../../../components/ui/Pagination';

const ITEMS_PER_PAGE = 5;

export default function OrdersPage({ currentUser, defaultToPOS = false, onNavigateBack }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  // Pestañas: 'activos' (Pendientes + Apartados), 'apartados', 'pendientes', 'completados', 'todos'
  const [activeTab, setActiveTab] = useState('activos');
  const [page, setPage] = useState(1);
  const [isPOSOpen, setIsPOSOpen] = useState(defaultToPOS);
  const [selectedOrderForDetail, setSelectedOrderForDetail] = useState(null);
  const [selectedOrderForAbono, setSelectedOrderForAbono] = useState(null);
  const [selectedOrderForAdd, setSelectedOrderForAdd] = useState(null);
  const [confirmState, setConfirmState] = useState({ open: false, title: '', message: '', onConfirm: null });
  const [toast, setToast] = useState(null);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const data = await orderService.getOrders();
      setOrders(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error cargando pedidos:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [isPOSOpen]);

  // Contadores para pestañas
  const counts = useMemo(() => {
    const apartados = orders.filter((o) => (o.nombre_estado || '').toLowerCase() === 'apartado').length;
    const pendientes = orders.filter((o) => (o.nombre_estado || '').toLowerCase() === 'pendiente').length;
    const activos = apartados + pendientes;
    const completados = orders.filter((o) => (o.nombre_estado || '').toLowerCase() === 'completado').length;
    return {
      activos,
      apartados,
      pendientes,
      completados,
      total: orders.length
    };
  }, [orders]);

  // Filtrado por pestaña y búsqueda
  const filteredOrders = useMemo(() => {
    const q = search.trim().toLowerCase();
    return orders.filter((o) => {
      const idStr = `PED${String(o.id_pedido).padStart(3, '0')}`.toLowerCase();
      const status = (o.nombre_estado || '').toLowerCase();
      const clientName = (o.nombre_cliente || '').toLowerCase();
      const doc = o.documento ? String(o.documento).toLowerCase() : '';

      const matchSearch =
        !q ||
        clientName.includes(q) ||
        idStr.includes(q) ||
        doc.includes(q);

      let matchTab = true;
      if (activeTab === 'activos') {
        matchTab = status === 'apartado' || status === 'pendiente';
      } else if (activeTab === 'apartados') {
        matchTab = status === 'apartado';
      } else if (activeTab === 'pendientes') {
        matchTab = status === 'pendiente';
      } else if (activeTab === 'completados') {
        matchTab = status === 'completado';
      } // 'todos' matches all

      return matchSearch && matchTab;
    });
  }, [orders, search, activeTab]);

  const totalPages = Math.ceil(filteredOrders.length / ITEMS_PER_PAGE);
  const pagedOrders = useMemo(() => {
    const start = (page - 1) * ITEMS_PER_PAGE;
    return filteredOrders.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredOrders, page]);

  // Completar Pedido
  const handleCompleteOrder = (order) => {
    const idFormatted = `PED${String(order.id_pedido).padStart(3, '0')}`;
    const abono = Number(order.abonado || 0);
    const saldo = Number(order.saldo !== undefined && order.saldo !== null ? order.saldo : Number(order.total || 0) - abono);

    if (saldo > 0) {
      // Si tiene saldo pendiente, alertar y dar opción de liquidar
      setConfirmState({
        open: true,
        title: `Liquidar y Completar ${idFormatted}`,
        message: `Este pedido tiene un saldo pendiente de ${formatCOP(saldo)}. Por regla de negocio, solo puede completarse cuando el saldo sea $0. ¿Deseas registrar el pago de ${formatCOP(saldo)} y completar el pedido ahora?`,
        onConfirm: async () => {
          try {
            await orderService.addPayment(order.id_pedido, {
              monto: saldo,
              pago_efectivo: true
            });
            await orderService.updateOrderStatus(order.id_pedido, 4); // 4 = Completado
            setConfirmState({ open: false, title: '', message: '', onConfirm: null });
            await fetchOrders();
            setToast({ type: 'success', message: `Pedido ${idFormatted} liquidado y completado exitosamente.` });
          } catch (err) {
            console.error('Error completando pedido:', err);
            setConfirmState({ open: false, title: '', message: '', onConfirm: null });
            setToast({ type: 'error', message: err.response?.data?.error || err.message || 'Error al completar pedido' });
          }
        }
      });
    } else {
      // Saldo es 0, completar directamente
      setConfirmState({
        open: true,
        title: `¿Convertir pedido ${idFormatted} en Venta Completada?`,
        message: 'El saldo ya se encuentra totalmente cubierto. El pedido pasará al registro de Ventas cerradas.',
        onConfirm: async () => {
          try {
            await orderService.updateOrderStatus(order.id_pedido, 4);
            setConfirmState({ open: false, title: '', message: '', onConfirm: null });
            await fetchOrders();
            setToast({ type: 'success', message: `Pedido ${idFormatted} completado exitosamente.` });
          } catch (err) {
            console.error('Error al completar pedido:', err);
            setConfirmState({ open: false, title: '', message: '', onConfirm: null });
            setToast({ type: 'error', message: err.response?.data?.error || err.message || 'Error al completar pedido' });
          }
        }
      });
    }
  };

  // Eliminar pedido
  const handleDeleteOrder = (order) => {
    const idFormatted = `PED${String(order.id_pedido).padStart(3, '0')}`;
    setConfirmState({
      open: true,
      title: `¿Eliminar pedido ${idFormatted}?`,
      message: 'Esta acción cancelará el pedido y devolverá los productos reservados al inventario automáticamente.',
      onConfirm: async () => {
        try {
          await orderService.deleteOrder(order.id_pedido);
          setOrders((prev) => prev.filter((o) => o.id_pedido !== order.id_pedido));
          setConfirmState({ open: false, title: '', message: '', onConfirm: null });
          setToast({ type: 'success', message: `Pedido ${idFormatted} eliminado correctamente.` });
        } catch (err) {
          console.error('Error eliminando pedido:', err);
          setConfirmState({ open: false, title: '', message: '', onConfirm: null });
          setToast({ type: 'error', message: err.response?.data?.error || err.message || 'Error al eliminar pedido' });
        }
      }
    });
  };

  // Iniciales y color de avatar
  const getInitials = (nombre) => {
    if (!nombre) return 'CL';
    const parts = nombre.trim().split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return parts[0].substring(0, 2).toUpperCase();
  };

  const getAvatarColor = (nombre) => {
    const colors = [
      'bg-pink-600 text-white',
      'bg-purple-600 text-white',
      'bg-rose-600 text-white',
      'bg-indigo-600 text-white',
      'bg-fuchsia-600 text-white'
    ];
    let hash = 0;
    for (let i = 0; i < (nombre || '').length; i++) hash += nombre.charCodeAt(i);
    return colors[hash % colors.length];
  };

  // Imprimir Ticket con detalle
  const handlePrintOrder = async (order) => {
    try {
      const detail = await orderService.getOrderDetail(order.id_pedido);
      const items = [
        ...(detail.productos || []).map((p) => ({
          nombre: p.nombre_producto,
          cantidad: p.cantidad,
          precio_unitario: p.precio_unitario
        })),
        ...(detail.servicios || []).map((s) => ({
          nombre: s.nombre_servicio,
          cantidad: s.cantidad,
          precio_unitario: s.precio_unitario
        }))
      ];
      printTicket({
        ...order,
        id: `PED${String(order.id_pedido).padStart(3, '0')}`,
        items
      });
    } catch (err) {
      console.error('Error al imprimir ticket:', err);
      printTicket({
        ...order,
        id: `PED${String(order.id_pedido).padStart(3, '0')}`
      });
    }
  };

  // Exportar listado a CSV
  const handleExport = () => {
    const headers = ['ID', 'Cliente', 'Documento', 'Fecha', 'Articulos', 'Total', 'Abonado', 'Saldo', 'Estado'];
    const rows = filteredOrders.map((o) => {
      const total = Number(o.total || 0);
      const abono = Number(o.abonado || 0);
      const saldo = Number(o.saldo !== undefined && o.saldo !== null ? o.saldo : total - abono);
      return [
        `PED${String(o.id_pedido).padStart(3, '0')}`,
        `"${o.nombre_cliente || ''}"`,
        `"${o.documento || ''}"`,
        `"${o.fecha_pedido ? new Date(o.fecha_pedido).toLocaleDateString('es-CO') : ''}"`,
        o.total_articulos || 1,
        total,
        abono,
        saldo,
        o.nombre_estado || ''
      ];
    });
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `pedidos_prigma_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Renderizar Vista POS si está activa
  if (isPOSOpen) {
    return (
      <POSView
        currentUser={currentUser}
        onBackToOrders={() => {
          setIsPOSOpen(false);
          if (onNavigateBack) onNavigateBack();
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Cabecera Principal */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="font-black text-2xl text-foreground tracking-tight">Gestión de Pedidos</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-pink-100 text-pink-700 dark:bg-pink-950/60 dark:text-pink-300 border border-pink-200/50 dark:border-pink-800">
              {counts.activos} activos
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Control de pedidos en estado <span className="font-semibold text-foreground">Pendiente</span> y{' '}
            <span className="font-semibold text-foreground">Apartado</span> (con reserva de stock y abonos parciales). Las
            ventas completadas se gestionan en Ventas.
          </p>
        </div>

        {/* Botones de Cabecera */}
        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <button
            onClick={handleExport}
            className="px-4 py-2 rounded-xl font-bold text-foreground text-xs bg-card border border-border hover:bg-muted transition-colors flex items-center gap-2 cursor-pointer shadow-2xs"
          >
            <FileDown className="w-4 h-4 text-muted-foreground" />
            Exportar
          </button>
          <button
            onClick={() => setIsPOSOpen(true)}
            className="px-4 py-2.5 rounded-xl font-black text-white text-xs bg-primary hover:opacity-90 active:scale-[0.98] transition-all shadow-md shadow-primary/20 flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            + Nuevo Pedido / POS
          </button>
        </div>
      </div>

      {/* Pestañas de Filtro (Píldoras) */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        <button
          onClick={() => {
            setActiveTab('activos');
            setPage(1);
          }}
          className={`px-4 py-2 rounded-full text-xs font-black transition-all flex items-center gap-2 cursor-pointer select-none ${
            activeTab === 'activos'
              ? 'bg-primary text-white shadow-xs'
              : 'bg-card border border-border text-foreground hover:bg-muted'
          }`}
        >
          <span>Todos los Activos</span>
          <span
            className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
              activeTab === 'activos' ? 'bg-white/20 text-white' : 'bg-muted text-muted-foreground'
            }`}
          >
            {counts.activos}
          </span>
        </button>

        <button
          onClick={() => {
            setActiveTab('apartados');
            setPage(1);
          }}
          className={`px-4 py-2 rounded-full text-xs font-black transition-all flex items-center gap-2 cursor-pointer select-none ${
            activeTab === 'apartados'
              ? 'bg-purple-600 text-white shadow-xs'
              : 'bg-purple-50 text-purple-700 border border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800 hover:bg-purple-100'
          }`}
        >
          <BookmarkCheck className="w-3.5 h-3.5" />
          <span>Apartados (Plan Separe)</span>
          <span
            className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
              activeTab === 'apartados'
                ? 'bg-white/20 text-white'
                : 'bg-purple-200/60 dark:bg-purple-900/60 text-purple-800 dark:text-purple-200'
            }`}
          >
            {counts.apartados}
          </span>
        </button>

        <button
          onClick={() => {
            setActiveTab('pendientes');
            setPage(1);
          }}
          className={`px-4 py-2 rounded-full text-xs font-black transition-all flex items-center gap-2 cursor-pointer select-none ${
            activeTab === 'pendientes'
              ? 'bg-amber-500 text-white shadow-xs'
              : 'bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800 hover:bg-amber-100'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>Pendientes</span>
          <span
            className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
              activeTab === 'pendientes'
                ? 'bg-white/20 text-white'
                : 'bg-amber-200/60 dark:bg-amber-900/60 text-amber-800 dark:text-amber-200'
            }`}
          >
            {counts.pendientes}
          </span>
        </button>

        <button
          onClick={() => {
            setActiveTab('completados');
            setPage(1);
          }}
          className={`px-4 py-2 rounded-full text-xs font-black transition-all flex items-center gap-2 cursor-pointer select-none ${
            activeTab === 'completados'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'bg-card border border-border text-foreground hover:bg-muted'
          }`}
        >
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          <span>Completados</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] font-black bg-muted text-muted-foreground">
            {counts.completados}
          </span>
        </button>

        <button
          onClick={() => {
            setActiveTab('todos');
            setPage(1);
          }}
          className={`px-4 py-2 rounded-full text-xs font-black transition-all flex items-center gap-2 cursor-pointer select-none ${
            activeTab === 'todos'
              ? 'bg-foreground text-background shadow-xs'
              : 'bg-card border border-border text-foreground hover:bg-muted'
          }`}
        >
          <span>Todos</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] font-black bg-muted text-muted-foreground">
            {counts.total}
          </span>
        </button>
      </div>

      {/* Barra de Búsqueda Full Width */}
      <div className="relative w-full">
        <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          placeholder="Buscar pedido por cliente, cédula o código PED..."
          className="w-full pl-11 pr-4 py-3 bg-card border border-border rounded-2xl text-sm font-medium text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-ring transition-all shadow-xs"
        />
      </div>

      {/* Tabla Principal */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border bg-muted/30 text-[11px] font-black uppercase tracking-wider text-muted-foreground">
                <th className="py-3.5 px-5">ID</th>
                <th className="py-3.5 px-5">Cliente / Cédula</th>
                <th className="py-3.5 px-5">Fecha</th>
                <th className="py-3.5 px-5 text-center">Artículos</th>
                <th className="py-3.5 px-5">Total</th>
                <th className="py-3.5 px-5">Abono / Saldo</th>
                <th className="py-3.5 px-5">Estado</th>
                <th className="py-3.5 px-5 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60 text-xs">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-muted-foreground">
                    <span className="inline-block w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin mr-2 align-middle" />
                    Cargando pedidos...
                  </td>
                </tr>
              ) : pagedOrders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-muted-foreground">
                    <FileText className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    <p className="font-bold text-foreground">No se encontraron pedidos</p>
                    <p className="text-xs">
                      {search ? 'Intenta con otro término de búsqueda.' : 'Usa "+ Nuevo Pedido / POS" para crear uno.'}
                    </p>
                  </td>
                </tr>
              ) : (
                pagedOrders.map((order) => {
                  const idStr = `PED${String(order.id_pedido).padStart(3, '0')}`;
                  const fechaStr = order.fecha_pedido
                    ? new Date(order.fecha_pedido).toLocaleDateString('es-CO')
                    : '—';
                  const horaStr = order.fecha_pedido
                    ? new Date(order.fecha_pedido).toLocaleTimeString('es-CO', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })
                    : '';
                  const initials = getInitials(order.nombre_cliente);
                  const avatarColor = getAvatarColor(order.nombre_cliente);

                  const total = Number(order.total || 0);
                  const abono = Number(order.abonado || 0);
                  const saldo = Number(
                    order.saldo !== undefined && order.saldo !== null ? order.saldo : total - abono
                  );
                  const pct = total > 0 ? Math.min(100, Math.round((abono / total) * 100)) : 0;
                  const estadoNombre = order.nombre_estado || 'Pendiente';
                  const isApartado = estadoNombre.toLowerCase() === 'apartado';
                  const isPendiente = estadoNombre.toLowerCase() === 'pendiente';
                  const isCompletado = estadoNombre.toLowerCase() === 'completado';
                  const isCancelado = estadoNombre.toLowerCase() === 'cancelado';

                  // Cédula o identificador compatible con la base de datos
                  const docDisplay = order.documento
                    ? `CC: ${order.documento}`
                    : order.id_cliente
                    ? `CC: ${order.documento || (order.id_cliente ? `10${String(order.id_cliente).padStart(8, '0')}` : '—')}`
                    : '';

                  return (
                    <tr key={order.id_pedido} className="hover:bg-muted/20 transition-colors">
                      {/* ID */}
                      <td className="py-4 px-5 font-mono font-bold text-xs text-primary">
                        {idStr}
                      </td>

                      {/* Cliente / Cédula */}
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-black flex-shrink-0 shadow-2xs ${avatarColor}`}
                          >
                            {initials}
                          </div>
                          <div>
                            <p className="font-bold text-foreground text-xs leading-snug">
                              {order.nombre_cliente}
                            </p>
                            <p className="text-[11px] font-mono text-muted-foreground leading-tight">
                              {order.documento ? `CC: ${order.documento}` : `ID: #${order.id_cliente}`}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Fecha y Hora */}
                      <td className="py-4 px-5">
                        <div className="font-medium text-foreground">{fechaStr}</div>
                        <div className="text-[11px] text-muted-foreground">{horaStr}</div>
                      </td>

                      {/* Artículos */}
                      <td className="py-4 px-5 text-center">
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-muted text-muted-foreground border border-border/50">
                          {order.total_articulos || 1} ítem(s)
                        </span>
                      </td>

                      {/* Total */}
                      <td className="py-4 px-5 font-mono font-bold text-xs text-foreground">
                        {formatCOP(total)}
                      </td>

                      {/* Abono / Saldo */}
                      <td className="py-4 px-5">
                        {isApartado || abono > 0 ? (
                          <div className="space-y-1 w-36">
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-bold text-purple-700 dark:text-purple-300">
                                Abono: {formatCOP(abono)}
                              </span>
                              <span className="text-[10px] text-muted-foreground font-semibold">{pct}%</span>
                            </div>
                            <div className="w-full h-1.5 bg-purple-100 dark:bg-purple-950/50 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-purple-600 rounded-full transition-all duration-300"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                            <div className="text-xs">
                              <span className="text-muted-foreground text-[11px]">Saldo: </span>
                              <span className="font-bold text-purple-700 dark:text-purple-300 font-mono">
                                {formatCOP(saldo)}
                              </span>
                            </div>
                          </div>
                        ) : isPendiente ? (
                          <div className="text-xs space-y-0.5">
                            <div className="text-muted-foreground text-[11px]">Saldo:</div>
                            <div className="font-bold text-amber-600 dark:text-amber-400 font-mono">
                              {formatCOP(saldo)}
                            </div>
                          </div>
                        ) : isCompletado ? (
                          <div className="text-xs space-y-0.5">
                            <div className="text-emerald-600 dark:text-emerald-400 font-bold">Totalmente Pagado</div>
                            <div className="text-[10px] text-muted-foreground font-mono">{formatCOP(total)}</div>
                          </div>
                        ) : (
                          <div className="text-xs text-muted-foreground font-mono">{formatCOP(total)}</div>
                        )}
                      </td>

                      {/* Estado */}
                      <td className="py-4 px-5">
                        {isApartado ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800">
                            <BookmarkCheck className="w-3.5 h-3.5" />
                            Apartado
                          </span>
                        ) : isPendiente ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800">
                            <Clock className="w-3.5 h-3.5" />
                            Pendiente
                          </span>
                        ) : isCompletado ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Completado
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-red-50 text-red-700 border border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-800">
                            <XCircle className="w-3.5 h-3.5" />
                            Cancelado
                          </span>
                        )}
                      </td>

                      {/* Acciones */}
                      <td className="py-4 px-5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Botón Abonar (Solo para Apartados o abiertos con saldo) */}
                          {isApartado && (
                            <button
                              onClick={() => setSelectedOrderForAbono(order)}
                              className="px-2.5 py-1 rounded-lg text-xs font-bold bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800 transition-colors flex items-center gap-1 cursor-pointer"
                              title="Registrar Abono"
                            >
                              <DollarSign className="w-3.5 h-3.5" />
                              Abonar
                            </button>
                          )}

                          {/* Botón Añadir Artículos (Para pedidos abiertos) */}
                          {(isApartado || isPendiente) && (
                            <button
                              onClick={() => setSelectedOrderForAdd(order)}
                              className="px-2.5 py-1 rounded-lg text-xs font-bold bg-pink-50 hover:bg-pink-100 text-pink-700 border border-pink-200 dark:bg-pink-950/40 dark:text-pink-300 dark:border-pink-800 transition-colors flex items-center gap-1 cursor-pointer"
                              title="Añadir Artículos"
                            >
                              <Package className="w-3.5 h-3.5" />
                              Añadir
                            </button>
                          )}

                          {/* Botón Completar (Para pedidos abiertos) */}
                          {(isApartado || isPendiente) && (
                            <button
                              onClick={() => handleCompleteOrder(order)}
                              className="px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-colors flex items-center gap-1 cursor-pointer"
                              title="Completar Pedido / Venta"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Completar
                            </button>
                          )}

                          {/* Ver Detalle */}
                          <button
                            onClick={() => setSelectedOrderForDetail(order)}
                            className="p-1 rounded-lg text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors cursor-pointer"
                            title="Ver Detalle del Pedido"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {/* Imprimir Ticket */}
                          <button
                            onClick={() => handlePrintOrder(order)}
                            className="p-1 rounded-lg text-green-600 hover:bg-green-50 dark:hover:bg-green-950/40 transition-colors cursor-pointer"
                            title="Imprimir Ticket Térmico"
                          >
                            <Printer className="w-4 h-4" />
                          </button>

                          {/* Eliminar (Solo para pedidos no completados) */}
                          {!isCompletado && (
                            <button
                              onClick={() => handleDeleteOrder(order)}
                              className="p-1 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors cursor-pointer"
                              title="Eliminar Pedido"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Paginación */}
        <div className="p-4 border-t border-border">
          <Pagination page={page} total={totalPages} onPage={setPage} />
        </div>
      </div>

      {/* Modal de Detalle */}
      <OrderDetailModal
        open={Boolean(selectedOrderForDetail)}
        onClose={() => setSelectedOrderForDetail(null)}
        order={selectedOrderForDetail}
      />

      {/* Modal de Registrar Abono */}
      <AbonarModal
        open={Boolean(selectedOrderForAbono)}
        onClose={() => setSelectedOrderForAbono(null)}
        order={selectedOrderForAbono}
        onAbonoSuccess={() => {
          fetchOrders();
          setToast({ type: 'success', message: 'Abono registrado exitosamente al pedido.' });
        }}
      />

      {/* Modal de Añadir Artículos */}
      <AddItemsModal
        open={Boolean(selectedOrderForAdd)}
        onClose={() => setSelectedOrderForAdd(null)}
        order={selectedOrderForAdd}
        onItemsAdded={() => {
          fetchOrders();
          setToast({ type: 'success', message: 'Artículos agregados al pedido exitosamente.' });
        }}
      />

      {/* Diálogo de Confirmación */}
      <ConfirmDialog
        open={confirmState.open}
        title={confirmState.title}
        message={confirmState.message}
        onConfirm={confirmState.onConfirm}
        onCancel={() => setConfirmState({ open: false, title: '', message: '', onConfirm: null })}
      />

      {/* Notificaciones Toast */}
      <FeedbackToast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
}
