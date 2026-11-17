import { useMemo, useState } from 'react';
import { Loader2, Plus, Trash2 } from 'lucide-react';
import { calcLine, calcTotals } from '../utils/purchaseCalculations';
import { formatCOP } from '../utils/format';

const inputClass =
  'w-full px-3 py-2 bg-input-background border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-ring transition-all';

const EMPTY_DRAFT = {
  id_producto: '',
  cantidad: '1',
  precio_unitario: '',
  porcentaje_descuento: '0',
  porcentaje_iva: '19', // IVA estándar en Colombia
};

function MiniLabel({ children }) {
  return <span className="text-[11px] font-bold text-muted-foreground block mb-1">{children}</span>;
}

/**
 * Lista de productos de una compra (+ formulario para agregar una línea).
 *  - readOnly: solo muestra las líneas y los totales (modal de detalle).
 *  - onAdd(line) / onRemove(line): el padre decide si guarda en memoria (crear) o en la API (editar).
 */
export default function PurchaseLinesEditor({ products = [], lines, onAdd, onRemove, readOnly = false }) {
  const [draft, setDraft] = useState(EMPTY_DRAFT);
  const [adding, setAdding] = useState(false);
  const [removingKey, setRemovingKey] = useState(null);
  const [error, setError] = useState('');
  const totals = useMemo(() => calcTotals(lines), [lines]);

  const set = (key) => (e) => setDraft((d) => ({ ...d, [key]: e.target.value }));

  const selectProduct = (e) => {
    const product = products.find((p) => String(p.id_producto) === e.target.value);
    setDraft((d) => ({
      ...d,
      id_producto: e.target.value,
      precio_unitario: product ? String(Number(product.costo) || 0) : '', // sugiere el costo del producto
    }));
  };

  const handleAdd = async () => {
    const product = products.find((p) => String(p.id_producto) === draft.id_producto);
    if (!product) return setError('Selecciona un producto.');
    if (lines.some((l) => l.id_producto === product.id_producto)) {
      return setError('Ese producto ya está en la compra. Elimínalo si quieres cambiar sus valores.');
    }

    const cantidad = Number(draft.cantidad);
    if (!Number.isInteger(cantidad) || cantidad <= 0) return setError('La cantidad debe ser un entero mayor a 0.');

    const precio = Number(draft.precio_unitario);
    if (draft.precio_unitario === '' || !(precio >= 0)) return setError('Ingresa un precio unitario válido.');

    const descuento = Number(draft.porcentaje_descuento || 0);
    const iva = Number(draft.porcentaje_iva || 0);
    if (!(descuento >= 0 && descuento <= 100) || !(iva >= 0 && iva <= 100)) {
      return setError('El descuento y el IVA deben estar entre 0 y 100.');
    }

    setAdding(true);
    setError('');
    try {
      await onAdd({
        id_producto: product.id_producto,
        nombre_producto: product.nombre_producto,
        cantidad,
        precio_unitario: precio,
        porcentaje_descuento: descuento,
        porcentaje_iva: iva,
      });
      setDraft(EMPTY_DRAFT);
    } catch (err) {
      setError(err.message);
    } finally {
      setAdding(false);
    }
  };

  const handleRemove = async (line) => {
    setRemovingKey(line.key);
    setError('');
    try {
      await onRemove(line);
    } catch (err) {
      setError(err.message);
    } finally {
      setRemovingKey(null);
    }
  };

  return (
    <div className="space-y-4">
      {!readOnly && (
        <div className="rounded-xl border border-border bg-muted/40 p-3 space-y-3">
          <div className="grid grid-cols-2 md:grid-cols-12 gap-2.5 items-end">
            <label className="col-span-2 md:col-span-4 block">
              <MiniLabel>Producto</MiniLabel>
              <select value={draft.id_producto} onChange={selectProduct} className={inputClass}>
                <option value="">{products.length ? 'Selecciona un producto' : 'Sin productos en la categoría'}</option>
                {products.map((p) => (
                  <option key={p.id_producto} value={p.id_producto}>
                    {p.nombre_producto}
                  </option>
                ))}
              </select>
            </label>
            <label className="md:col-span-1 block">
              <MiniLabel>Cant.</MiniLabel>
              <input type="number" min="1" step="1" value={draft.cantidad} onChange={set('cantidad')} className={inputClass} />
            </label>
            <label className="md:col-span-2 block">
              <MiniLabel>Precio unit.</MiniLabel>
              <input type="number" min="0" step="1" value={draft.precio_unitario} onChange={set('precio_unitario')} placeholder="0" className={inputClass} />
            </label>
            <label className="md:col-span-2 block">
              <MiniLabel>Desc. %</MiniLabel>
              <input type="number" min="0" max="100" step="0.01" value={draft.porcentaje_descuento} onChange={set('porcentaje_descuento')} className={inputClass} />
            </label>
            <label className="md:col-span-1 block">
              <MiniLabel>IVA %</MiniLabel>
              <input type="number" min="0" max="100" step="0.01" value={draft.porcentaje_iva} onChange={set('porcentaje_iva')} className={inputClass} />
            </label>
            <button
              type="button"
              onClick={handleAdd}
              disabled={adding}
              className="col-span-2 md:col-span-2 px-3 py-2 rounded-xl font-black text-white text-sm bg-primary hover:opacity-90 active:scale-[0.98] disabled:opacity-60 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              {adding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Agregar
            </button>
          </div>

          {error && (
            <p role="alert" className="text-xs font-bold text-red-600 dark:text-red-300">
              {error}
            </p>
          )}
        </div>
      )}

      {readOnly && error && (
        <p role="alert" className="text-xs font-bold text-red-600 dark:text-red-300">
          {error}
        </p>
      )}

      <div className="border border-border rounded-xl overflow-x-auto">
        <table className="w-full text-sm min-w-[560px]">
          <thead>
            <tr className="border-b border-border text-left text-[11px] font-black uppercase tracking-wide text-muted-foreground">
              <th className="px-3 py-2.5">Producto</th>
              <th className="px-3 py-2.5 text-right">Cant.</th>
              <th className="px-3 py-2.5 text-right">Precio unit.</th>
              <th className="px-3 py-2.5 text-right">Desc.</th>
              <th className="px-3 py-2.5 text-right">IVA</th>
              <th className="px-3 py-2.5 text-right">Total</th>
              {!readOnly && <th className="px-3 py-2.5 w-10" />}
            </tr>
          </thead>
          <tbody>
            {lines.length === 0 ? (
              <tr>
                <td colSpan={readOnly ? 6 : 7} className="px-3 py-6 text-center text-xs text-muted-foreground">
                  Aún no hay productos en esta compra.
                </td>
              </tr>
            ) : (
              lines.map((line) => (
                <tr key={line.key} className="border-b border-border last:border-b-0">
                  <td className="px-3 py-2.5 font-bold text-foreground">{line.nombre_producto}</td>
                  <td className="px-3 py-2.5 text-right">{line.cantidad}</td>
                  <td className="px-3 py-2.5 text-right">{formatCOP(line.precio_unitario)}</td>
                  <td className="px-3 py-2.5 text-right text-muted-foreground">{line.porcentaje_descuento}%</td>
                  <td className="px-3 py-2.5 text-right text-muted-foreground">{line.porcentaje_iva}%</td>
                  <td className="px-3 py-2.5 text-right font-black text-primary">{formatCOP(calcLine(line).total)}</td>
                  {!readOnly && (
                    <td className="px-2 py-2.5">
                      <button
                        type="button"
                        onClick={() => handleRemove(line)}
                        disabled={removingKey === line.key}
                        aria-label={`Quitar ${line.nombre_producto}`}
                        className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-50 cursor-pointer"
                      >
                        {removingKey === line.key ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                      </button>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="ml-auto max-w-xs space-y-1.5 text-sm">
        <div className="flex justify-between text-muted-foreground">
          <span>Subtotal</span>
          <span>{formatCOP(totals.bruto)}</span>
        </div>
        <div className="flex justify-between text-muted-foreground">
          <span>Descuento</span>
          <span>− {formatCOP(totals.descuento)}</span>
        </div>
        <div className="flex justify-between text-muted-foreground">
          <span>IVA</span>
          <span>{formatCOP(totals.iva)}</span>
        </div>
        <div className="flex justify-between pt-2 border-t border-border font-black text-base">
          <span className="text-foreground">Total</span>
          <span className="text-primary">{formatCOP(totals.total)}</span>
        </div>
      </div>
    </div>
  );
}
