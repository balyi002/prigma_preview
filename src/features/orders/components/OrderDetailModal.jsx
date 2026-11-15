import React, { useEffect, useState } from 'react';
import Modal from '../../../components/ui/Modal';
import StatusBadge from '../../../components/ui/StatusBadge';
import { formatCOP, printTicket } from '../../../utils/format';
import { orderService } from '../services/orderService';
import { Printer } from 'lucide-react';

export default function OrderDetailModal({ open, onClose, order }) {
  const [details, setDetails] = useState({ productos: [], servicios: [], pagos: [] });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && order?.id_pedido) {
      setLoading(true);
      orderService.getOrderDetail(order.id_pedido)
        .then((res) => setDetails(res))
        .catch((err) => console.error('Error cargando detalle:', err))
        .finally(() => setLoading(false));
    }
  }, [open, order]);

  if (!order) return null;

  const idFormatted = `PED${String(order.id_pedido).padStart(3, '0')}`;
  const total = Number(order.total || 0);
  const iva = Number(order.iva_incluido || Math.round(total * 19 / 119));
  const subtotal = total - iva;

  const allItems = [
    ...(details.productos || []).map((p) => ({ ...p, tipo: 'Producto', nombre: p.nombre_producto })),
    ...(details.servicios || []).map((s) => ({ ...s, tipo: 'Servicio', nombre: s.nombre_servicio })),
  ];

  const handlePrint = () => {
    printTicket({
      ...order,
      id: idFormatted,
      items: allItems.map((i) => ({
        name: i.nombre,
        qty: i.cantidad,
        price: Number(i.precio_unitario)
      }))
    });
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Detalle de Pedido — ${idFormatted}`}
      wide={true}
    >
      <div className="space-y-5">
        {/* Ficha Resumen de Cabecera */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-muted/40 border border-border rounded-xl p-4 text-xs">
          <div>
            <span className="text-muted-foreground block text-[11px] font-bold">CLIENTE</span>
            <span className="font-black text-foreground text-sm">{order.nombre_cliente}</span>
          </div>
          <div>
            <span className="text-muted-foreground block text-[11px] font-bold">ATENDIDO POR</span>
            <span className="font-bold text-foreground">{order.nombre_usuario || 'Empleado'}</span>
          </div>
          <div>
            <span className="text-muted-foreground block text-[11px] font-bold">FECHA Y HORA</span>
            <span className="font-medium text-foreground">
              {order.fecha_pedido ? new Date(order.fecha_pedido).toLocaleString('es-CO') : '—'}
            </span>
          </div>
          <div>
            <span className="text-muted-foreground block text-[11px] font-bold">ESTADO</span>
            <div className="mt-0.5">
              <StatusBadge status={order.nombre_estado} />
            </div>
          </div>
        </div>

        {/* Tabla de Artículos */}
        <div className="border border-border rounded-xl overflow-hidden">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-muted/60 border-b border-border text-[11px] font-black uppercase text-muted-foreground">
                <th className="py-2.5 px-4">Artículo</th>
                <th className="py-2.5 px-3 text-center">Tipo</th>
                <th className="py-2.5 px-3 text-center">Cant.</th>
                <th className="py-2.5 px-4 text-right">P. Unitario</th>
                <th className="py-2.5 px-4 text-right">Subtotal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-muted-foreground">
                    Cargando líneas del pedido...
                  </td>
                </tr>
              ) : allItems.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-muted-foreground">
                    No hay líneas asociadas
                  </td>
                </tr>
              ) : (
                allItems.map((item, idx) => (
                  <tr key={idx} className="hover:bg-muted/20">
                    <td className="py-2.5 px-4 font-bold text-foreground">{item.nombre}</td>
                    <td className="py-2.5 px-3 text-center">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-muted text-muted-foreground">
                        {item.tipo}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-center font-mono font-bold">{item.cantidad}</td>
                    <td className="py-2.5 px-4 text-right font-mono">{formatCOP(item.precio_unitario)}</td>
                    <td className="py-2.5 px-4 text-right font-mono font-bold text-foreground">
                      {formatCOP(item.cantidad * item.precio_unitario)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Desglose Económico */}
        <div className="bg-card border border-border rounded-xl p-4 space-y-2 text-xs">
          <div className="flex justify-between text-muted-foreground">
            <span>Subtotal (sin IVA):</span>
            <span className="font-mono font-semibold">{formatCOP(subtotal)}</span>
          </div>
          <div className="flex justify-between text-muted-foreground">
            <span>IVA incluido (19%):</span>
            <span className="font-mono font-semibold">{formatCOP(iva)}</span>
          </div>
          {Number(order.descuento || 0) > 0 && (
            <div className="flex justify-between text-green-600 font-bold">
              <span>Descuento aplicado:</span>
              <span className="font-mono">-{formatCOP(order.descuento)}</span>
            </div>
          )}
          <div className="flex justify-between text-sm font-black text-foreground pt-2 border-t border-border">
            <span>TOTAL:</span>
            <span className="text-primary font-mono text-base">{formatCOP(total)}</span>
          </div>
          <div className="flex justify-between text-xs text-muted-foreground pt-1">
            <span>Total Abonado:</span>
            <span className="font-mono font-bold text-foreground">{formatCOP(order.abonado || 0)}</span>
          </div>
          {Number(order.saldo || 0) > 0 && (
            <div className="flex justify-between text-xs font-bold text-amber-600">
              <span>Saldo Pendiente:</span>
              <span className="font-mono">{formatCOP(order.saldo)}</span>
            </div>
          )}
        </div>

        {/* Botones de acción */}
        <div className="flex justify-between gap-3 pt-3 border-t border-border">
          <button
            type="button"
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-green-50 text-green-700 dark:bg-green-950/40 dark:text-green-300 border border-green-200 dark:border-green-800 hover:bg-green-100 transition-colors cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            Imprimir Ticket
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs font-bold bg-muted text-foreground hover:bg-muted/80 transition-colors cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      </div>
    </Modal>
  );
}
