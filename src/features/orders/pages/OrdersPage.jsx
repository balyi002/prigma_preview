import React, { useState, useEffect, useMemo } from 'react';
import {
  Plus,
  Search,
  FileDown,
  Eye,
  Printer,
  Trash2,
  FileText
} from 'lucide-react';
import { orderService } from '../services/orderService';
import { formatCOP, printTicket } from '../../../utils/format';
import OrderDetailModal from '../components/OrderDetailModal';
import POSView from '../components/POSView';
import StatusBadge from '../../../components/ui/StatusBadge';
import ConfirmDialog from '../../../components/ui/ConfirmDialog';
import Pagination from '../../../components/ui/Pagination';

const ITEMS_PER_PAGE = 5;

export default function OrdersPage({ currentUser, defaultToPOS = false, onNavigateBack }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('Todos');
  const [page, setPage] = useState(1);
  const [isPOSOpen, setIsPOSOpen] = useState(defaultToPOS);
  const [selectedOrderForDetail, setSelectedOrderForDetail] = useState(null);
  const [confirmState, setConfirmState] = useState({ open: false, title: '', message: '', onConfirm: null });

  const statusOptions = ['Apartado', 'Pendiente', 'Cancelado', 'Completado'];

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const data = await orderService.getOrders();
      setOrders(data);
    } catch (err) {
      console.error('Error cargando pedidos:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [isPOSOpen]);

  // Filtrado
  const filteredOrders = useMemo(() => {
    const q = search.trim().toLowerCase();
    return orders.filter((o) => {
      const idStr = `PED${String(o.id_pedido).padStart(3, '0')}`.toLowerCase();
      const matchSearch =
        !q ||
        (o.nombre_cliente && o.nombre_cliente.toLowerCase().includes(q)) ||
        idStr.includes(q);

      const matchStatus =
        filterStatus === 'Todos' ||
        (o.nombre_estado && o.nombre_estado.toLowerCase() === filterStatus.toLowerCase());

      return matchSearch && matchStatus;
    });
  }, [orders, search, filterStatus]);

  const totalPages = Math.ceil(filteredOrders.length / ITEMS_PER_PAGE);
  const pagedOrders = useMemo(() => {
    const start = (page - 1) * ITEMS_PER_PAGE;
    return filteredOrders.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredOrders, page]);

  // Cambiar estado del pedido
  const handleStatusChange = (order, newStatus) => {
    const estadoIdMap = {
      Apartado: 1,
      Pendiente: 2,
      Cancelado: 3,
      Completado: 4
    };
    const targetId = estadoIdMap[newStatus];

    if (newStatus === 'Completado') {
      setConfirmState({
        open: true,
        title: `¿Convertir pedido PED${String(order.id_pedido).padStart(3, '0')} en Venta Completada?`,
        message: 'Para completar el pedido, el saldo debe encontrarse totalmente cubierto según las reglas de negocio.',
        onConfirm: async () => {
          try {
            await orderService.updateOrderStatus(order.id_pedido, targetId);
            setOrders((prev) =>
              prev.map((o) =>
                o.id_pedido === order.id_pedido ? { ...o, nombre_estado: 'Completado' } : o
              )
            );
            setConfirmState({ open: false, title: '', message: '', onConfirm: null });
          } catch (err) {
            console.error('Error al completar pedido:', err);
            alert(err.response?.data?.error || err.message || 'Error al completar pedido');
            setConfirmState({ open: false, title: '', message: '', onConfirm: null });
          }
        }
      });
    } else {
      orderService
        .updateOrderStatus(order.id_pedido, targetId)
        .then(() => {
          setOrders((prev) =>
            prev.map((o) =>
              o.id_pedido === order.id_pedido ? { ...o, nombre_estado: newStatus } : o
            )
          );
        })
        .catch((err) => {
          console.error('Error actualizando estado:', err);
          alert(err.response?.data?.error || err.message || 'Error al cambiar estado');
        });
    }
  };

  // Eliminar pedido
  const handleDeleteOrder = (order) => {
    const idFormatted = `PED${String(order.id_pedido).padStart(3, '0')}`;
    setConfirmState({
      open: true,
      title: `¿Eliminar pedido ${idFormatted}?`,
      message: 'Esta acción devolverá los artículos al stock del inventario automáticamente. No se puede deshacer.',
      onConfirm: async () => {
        try {
          await orderService.deleteOrder(order.id_pedido);
          setOrders((prev) => prev.filter((o) => o.id_pedido !== order.id_pedido));
          setConfirmState({ open: false, title: '', message: '', onConfirm: null });
        } catch (err) {
          console.error('Error eliminando pedido:', err);
          alert(err.response?.data?.error || err.message || 'Error al eliminar pedido');
          setConfirmState({ open: false, title: '', message: '', onConfirm: null });
        }
      }
    });
  };

  // Helper para iniciales de avatar con color dinámico
  const getInitials = (nombre) => {
    if (!nombre) return 'CL';
    const parts = nombre.trim().split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return parts[0].substring(0, 2).toUpperCase();
  };

  const getAvatarColor = (nombre) => {
    const colors = [
      'bg-emerald-500 text-white',
      'bg-indigo-500 text-white',
      'bg-purple-500 text-white',
      'bg-pink-500 text-white',
      'bg-amber-500 text-white',
      'bg-teal-500 text-white'
    ];
    let hash = 0;
    for (let i = 0; i < (nombre || '').length; i++) hash += nombre.charCodeAt(i);
    return colors[hash % colors.length];
  };

  // Exportar listado
  const handleExport = () => {
    const headers = ['ID', 'Cliente', 'Fecha', 'Total', 'Metodo', 'Estado'];
    const rows = filteredOrders.map((o) => [
      `PED${String(o.id_pedido).padStart(3, '0')}`,
      `"${o.nombre_cliente || ''}"`,
      `"${o.fecha_pedido ? new Date(o.fecha_pedido).toLocaleDateString('es-CO') : ''}"`,
      o.total,
      o.metodo_pago,
      o.nombre_estado
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `pedidos_prigma_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Si está activo el modo POS, renderizar POSView
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
      {/* Cabecera del módulo de Pedidos */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-black text-xl text-foreground">Pedidos</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Cambia el estado a "completado" para convertir un pedido en venta
          </p>
        </div>
        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <button
            onClick={handleExport}
            className="px-3.5 py-2 rounded-xl font-bold text-foreground text-xs bg-card border border-border hover:bg-muted transition-colors flex items-center gap-2 cursor-pointer shadow-2xs"
          >
            <FileDown className="w-4 h-4 text-muted-foreground" />
            Exportar
          </button>
          <button
            onClick={() => setIsPOSOpen(true)}
            className="px-4 py-2.5 rounded-xl font-black text-white text-xs bg-primary hover:opacity-90 active:scale-[0.98] transition-all shadow-md shadow-primary/20 flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Nuevo Pedido
          </button>
        </div>
      </div>

      {/* Barra de Filtros: Buscador + Dropdown de Estados */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Buscar por cliente o ID..."
            className="w-full pl-10 pr-4 py-2.5 bg-card border border-border rounded-xl text-sm font-medium text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-ring transition-all shadow-xs"
          />
        </div>

        <select
          value={filterStatus}
          onChange={(e) => {
            setFilterStatus(e.target.value);
            setPage(1);
          }}
          className="px-3.5 py-2.5 bg-card border border-border rounded-xl text-xs font-bold text-foreground outline-none focus:ring-2 focus:ring-ring transition-all sm:w-48 cursor-pointer shadow-xs"
        >
          <option value="Todos">Todos los estados</option>
          {statusOptions.map((st) => (
            <option key={st} value={st}>
              {st}
            </option>
          ))}
        </select>
      </div>

      {/* Tabla Principal de Pedidos */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border bg-muted/40 text-[11px] font-black uppercase tracking-wider text-muted-foreground">
                <th className="py-3.5 px-5">ID</th>
                <th className="py-3.5 px-5">Cliente</th>
                <th className="py-3.5 px-5">Fecha</th>
                <th className="py-3.5 px-5 text-center">Artículos</th>
                <th className="py-3.5 px-5">Total</th>
                <th className="py-3.5 px-5">Método</th>
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
                    <p className="text-xs">Usa el botón "+ Nuevo Pedido" para registrar tu primer pedido en el POS.</p>
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

                  return (
                    <tr
                      key={order.id_pedido}
                      className="hover:bg-muted/20 transition-colors"
                    >
                      {/* ID del Pedido */}
                      <td className="py-3.5 px-5 font-mono font-bold text-xs text-primary">
                        {idStr}
                      </td>

                      {/* Cliente con Avatar */}
                      <td className="py-3.5 px-5">
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-black flex-shrink-0 ${avatarColor}`}
                          >
                            {initials}
                          </div>
                          <span className="font-bold text-foreground text-xs">
                            {order.nombre_cliente}
                          </span>
                        </div>
                      </td>

                      {/* Fecha y Hora */}
                      <td className="py-3.5 px-5">
                        <div className="font-medium text-foreground">{fechaStr}</div>
                        <div className="text-[11px] text-muted-foreground">{horaStr}</div>
                      </td>

                      {/* Artículos */}
                      <td className="py-3.5 px-5 text-center">
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-muted text-muted-foreground border border-border/50">
                          {order.total_articulos || 1} ítem(s)
                        </span>
                      </td>

                      {/* Total en COP */}
                      <td className="py-3.5 px-5 font-mono font-black text-xs text-primary">
                        {formatCOP(order.total)}
                      </td>

                      {/* Método de Pago */}
                      <td className="py-3.5 px-5 text-foreground font-medium">
                        {order.metodo_pago || 'Efectivo'}
                      </td>

                      {/* Estado con Select o Badge */}
                      <td className="py-3.5 px-5">
                        {order.nombre_estado === 'Completado' ? (
                          <StatusBadge status="Completado" />
                        ) : (
                          <select
                            value={order.nombre_estado || 'Pendiente'}
                            onChange={(e) => handleStatusChange(order, e.target.value)}
                            className="px-2 py-1 rounded-lg text-xs font-bold border border-border bg-input-background text-foreground outline-none focus:ring-1 focus:ring-ring cursor-pointer"
                          >
                            {statusOptions.map((st) => (
                              <option key={st} value={st}>
                                {st}
                              </option>
                            ))}
                          </select>
                        )}
                      </td>

                      {/* Acciones: Ver detalle, Imprimir, Eliminar */}
                      <td className="py-3.5 px-5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => setSelectedOrderForDetail(order)}
                            className="p-1.5 rounded-lg text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors cursor-pointer"
                            title="Ver Detalle del Pedido"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => printTicket(order)}
                            className="p-1.5 rounded-lg text-green-600 hover:bg-green-50 dark:hover:bg-green-950/40 transition-colors cursor-pointer"
                            title="Imprimir Ticket"
                          >
                            <Printer className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteOrder(order)}
                            className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors cursor-pointer"
                            title="Eliminar Pedido"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
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

      {/* Diálogo de Confirmación */}
      <ConfirmDialog
        open={confirmState.open}
        title={confirmState.title}
        message={confirmState.message}
        onConfirm={confirmState.onConfirm}
        onCancel={() => setConfirmState({ open: false, title: '', message: '', onConfirm: null })}
      />
    </div>
  );
}
