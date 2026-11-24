import React, { useState, useEffect } from 'react';
import Modal from '../../../components/ui/Modal';
import { formatCOP } from '../../../utils/format';
import { orderService } from '../services/orderService';
import { DollarSign, Banknote, CreditCard, CheckCircle2 } from 'lucide-react';

export default function AbonarModal({ open, onClose, order, onAbonoSuccess }) {
  const [monto, setMonto] = useState('');
  const [metodoPago, setMetodoPago] = useState('Efectivo');
  const [completarAlLiquidar, setCompletarAlLiquidar] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const total = Number(order?.total || 0);
  const abonado = Number(order?.abonado || 0);
  const saldo = Number(order?.saldo !== undefined && order?.saldo !== null ? order?.saldo : total - abonado);

  useEffect(() => {
    if (open && order) {
      setMonto(String(saldo));
      setMetodoPago('Efectivo');
      setCompletarAlLiquidar(true);
      setError('');
    }
  }, [open, order, saldo]);

  if (!order) return null;

  const idFormatted = `PED${String(order.id_pedido).padStart(3, '0')}`;

  const handleSubmit = async (e) => {
    e.preventDefault();
    const val = Number(monto);
    if (!val || val <= 0) {
      setError('Ingresa un monto de abono válido mayor a 0.');
      return;
    }
    if (val > saldo) {
      setError(`El abono no puede superar el saldo pendiente de ${formatCOP(saldo)}.`);
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      // 1. Registrar pago
      await orderService.addPayment(order.id_pedido, {
        monto: val,
        pago_efectivo: metodoPago === 'Efectivo'
      });

      // 2. Si cubrió el saldo y está seleccionada la opción, pasar a Completado
      if (val >= saldo && completarAlLiquidar) {
        try {
          await orderService.updateOrderStatus(order.id_pedido, 4); // 4 = Completado
        } catch (stErr) {
          console.warn('Abono registrado, pero no se pudo cambiar estado:', stErr);
        }
      }

      onClose();
      if (onAbonoSuccess) onAbonoSuccess();
    } catch (err) {
      console.error('Error registrando abono:', err);
      setError(err.response?.data?.error || err.message || 'Error al registrar el abono');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Registrar Abono — ${idFormatted}`}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-300 text-xs font-bold rounded-xl p-3">
            {error}
          </div>
        )}

        {/* Resumen del Pedido */}
        <div className="bg-muted/40 border border-border rounded-xl p-3.5 space-y-2 text-xs">
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground font-bold">Cliente:</span>
            <span className="font-black text-foreground">{order.nombre_cliente}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Total del Pedido:</span>
            <span className="font-mono font-bold text-foreground">{formatCOP(total)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Total Abonado Previo:</span>
            <span className="font-mono font-bold text-purple-700 dark:text-purple-300">{formatCOP(abonado)}</span>
          </div>
          <div className="flex justify-between items-center pt-2 border-t border-border">
            <span className="font-bold text-foreground">Saldo Pendiente:</span>
            <span className="font-mono font-black text-primary text-sm">{formatCOP(saldo)}</span>
          </div>
        </div>

        {/* Campo de Monto */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-foreground block">
            Monto a Abonar (COP) <span className="text-primary">*</span>
          </label>
          <div className="relative">
            <DollarSign className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="number"
              min="1"
              max={saldo}
              value={monto}
              onChange={(e) => {
                setMonto(e.target.value);
                setError('');
              }}
              required
              placeholder="0"
              className="w-full pl-10 pr-4 py-2.5 bg-input-background border border-border rounded-xl text-sm font-mono font-bold text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-ring transition-all"
            />
          </div>

          {/* Botones de porcentaje rápido */}
          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={() => setMonto(String(Math.round(saldo * 0.5)))}
              className="px-2.5 py-1 text-[11px] font-bold rounded-lg border border-border bg-card hover:bg-muted text-foreground transition-colors cursor-pointer"
            >
              50% ({formatCOP(Math.round(saldo * 0.5))})
            </button>
            <button
              type="button"
              onClick={() => setMonto(String(saldo))}
              className="px-2.5 py-1 text-[11px] font-bold rounded-lg border border-primary/30 bg-primary/10 hover:bg-primary/20 text-primary transition-colors cursor-pointer"
            >
              Liquidar Todo ({formatCOP(saldo)})
            </button>
          </div>
        </div>

        {/* Método de Pago */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-foreground block">Método de Pago</label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setMetodoPago('Efectivo')}
              className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-all ${
                metodoPago === 'Efectivo'
                  ? 'border-primary bg-primary text-white shadow-xs'
                  : 'border-border bg-card text-foreground hover:bg-muted'
              }`}
            >
              <Banknote className="w-4 h-4" />
              Efectivo
            </button>
            <button
              type="button"
              onClick={() => setMetodoPago('Transferencia')}
              className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-all ${
                metodoPago === 'Transferencia'
                  ? 'border-primary bg-primary text-white shadow-xs'
                  : 'border-border bg-card text-foreground hover:bg-muted'
              }`}
            >
              <CreditCard className="w-4 h-4" />
              Transferencia
            </button>
          </div>
        </div>

        {/* Opción de completar si liquida */}
        {Number(monto) >= saldo && (
          <label className="flex items-center gap-2.5 p-2.5 rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/30 text-xs font-bold text-emerald-800 dark:text-emerald-300 cursor-pointer">
            <input
              type="checkbox"
              checked={completarAlLiquidar}
              onChange={(e) => setCompletarAlLiquidar(e.target.checked)}
              className="rounded text-primary focus:ring-primary w-4 h-4"
            />
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>Pasar pedido a estado "Completado" automáticamente</span>
          </label>
        )}

        <div className="flex justify-end gap-2.5 pt-3 border-t border-border">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-muted text-foreground hover:bg-muted/80 transition-colors cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="px-5 py-2 rounded-xl text-xs font-black bg-primary text-white hover:opacity-90 active:scale-[0.98] transition-all shadow-md shadow-primary/20 cursor-pointer disabled:opacity-50"
          >
            {submitting ? 'Registrando...' : 'Confirmar Abono'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
