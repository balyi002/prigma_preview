import { useEffect, useMemo, useState } from 'react';
import { Check, Loader2, Lock, Pencil, Plus, Trash2, X } from 'lucide-react';
import { calcLine, calcTotals } from '../utils/purchaseCalculations';
import { formatCOP } from '../utils/format';

const baseInputClass =
  'w-full px-3 py-2 bg-input-background border rounded-xl text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-ring transition-all disabled:opacity-55 disabled:cursor-not-allowed';

const fieldClass = (hasError) =>
  `${baseInputClass} ${hasError ? 'border-red-500 ring-1 ring-red-500/30' : 'border-border'}`;

const EMPTY_DRAFT = {
  id_producto: '',
  cantidad: '1',
  precio_unitario: '',
  porcentaje_descuento: '0',
  porcentaje_iva: '19', // IVA estándar en Colombia
};

function MiniLabel({ children, required = false }) {
  return (
    <span className="text-[11px] font-bold text-muted-foreground block mb-1">
      {children}
      {required && <span className="text-primary"> *</span>}
    </span>
  );
}

/**
 * CRUD completo del detalle de productos de una compra (Crear, Leer, Actualizar, Eliminar).
 *  - readOnly: solo muestra las líneas y los totales (modal de solo lectura).
 *  - disabled: mantiene visible toda la sección del detalle pero bloqueada hasta completar proveedor y categoría.
 *  - onAdd / onUpdate / onRemove: el padre decide si persiste en memoria (crear) o en la API (editar).
 */
export default function PurchaseLinesEditor({
  products = [],
  lines = [],
  onAdd,
  onUpdate,
  onRemove,
  onNotify,
  onEditingChange,
  disabled = false,
  disabledMessage = 'Selecciona un proveedor y una categoría para habilitar el detalle de productos.',
  hasLinesError = false,
  readOnly = false,
}) {
  const [draft, setDraft] = useState(EMPTY_DRAFT);
  const [editingLine, setEditingLine] = useState(null);
  const [saving, setSaving] = useState(false);
  const [removingKey, setRemovingKey] = useState(null);
  const [errorIssues, setErrorIssues] = useState([]);
  const [draftErrors, setDraftErrors] = useState({});
  const totals = useMemo(() => calcTotals(lines), [lines]);

  const activeEditingLine = disabled ? null : editingLine;
  const activeDraft = disabled ? EMPTY_DRAFT : draft;
  const activeErrors = disabled ? {} : draftErrors;
  const activeIssues = disabled ? [] : errorIssues;
  const isEditing = activeEditingLine !== null;

  useEffect(() => {
    onEditingChange?.(isEditing);
  }, [isEditing, onEditingChange]);

  const clearFieldError = (key) => {
    setDraftErrors((prev) => (prev[key] ? { ...prev, [key]: false } : prev));
  };

  const setField = (key) => (e) => {
    clearFieldError(key);
    setErrorIssues([]);
    setDraft((d) => ({ ...d, [key]: e.target.value }));
  };

  const selectProduct = (e) => {
    const product = products.find((p) => String(p.id_producto) === e.target.value);
    clearFieldError('id_producto');
    if (product) clearFieldError('precio_unitario');
    setErrorIssues([]);
    setDraft((d) => ({
      ...d,
      id_producto: e.target.value,
      precio_unitario: product ? String(Number(product.costo) || 0) : '',
    }));
  };

  const startEdit = (line) => {
    if (disabled || readOnly) return;
    setEditingLine(line);
    setErrorIssues([]);
    setDraftErrors({});
    setDraft({
      id_producto: String(line.id_producto),
      cantidad: String(line.cantidad),
      precio_unitario: String(line.precio_unitario),
      porcentaje_descuento: String(line.porcentaje_descuento ?? 0),
      porcentaje_iva: String(line.porcentaje_iva ?? 0),
    });
  };

  const cancelEdit = () => {
    setEditingLine(null);
    setDraft(EMPTY_DRAFT);
    setErrorIssues([]);
    setDraftErrors({});
  };

  const productOptions = useMemo(() => {
    if (!activeEditingLine) return products;
    const exists = products.some((p) => Number(p.id_producto) === Number(activeEditingLine.id_producto));
    if (exists) return products;
    return [
      {
        id_producto: activeEditingLine.id_producto,
        nombre_producto: activeEditingLine.nombre_producto,
        costo: activeEditingLine.precio_unitario,
      },
      ...products,
    ];
  }, [products, activeEditingLine]);

  const validateDraft = () => {
    const issues = [];
    const nextErrors = {};
    const product = productOptions.find((p) => String(p.id_producto) === String(activeDraft.id_producto));

    if (!product) {
      issues.push('Producto');
      nextErrors.id_producto = true;
    } else if (
      lines.some(
        (l) =>
          Number(l.id_producto) === Number(product.id_producto) &&
          (!activeEditingLine || l.key !== activeEditingLine.key)
      )
    ) {
      issues.push('Ese producto ya está agregado en otra línea del detalle');
      nextErrors.id_producto = true;
    }

    const cantidad = Number(activeDraft.cantidad);
    if (activeDraft.cantidad === '' || !Number.isInteger(cantidad) || cantidad <= 0) {
      issues.push('Cantidad (entero mayor a 0)');
      nextErrors.cantidad = true;
    }

    const precio = Number(activeDraft.precio_unitario);
    if (activeDraft.precio_unitario === '' || Number.isNaN(precio) || precio < 0) {
      issues.push('Precio unitario (mayor o igual a 0)');
      nextErrors.precio_unitario = true;
    }

    const descuento = Number(activeDraft.porcentaje_descuento === '' ? 0 : activeDraft.porcentaje_descuento);
    if (Number.isNaN(descuento) || descuento < 0 || descuento > 100) {
      issues.push('Descuento % (entre 0 y 100)');
      nextErrors.porcentaje_descuento = true;
    }

    const iva = Number(activeDraft.porcentaje_iva === '' ? 0 : activeDraft.porcentaje_iva);
    if (Number.isNaN(iva) || iva < 0 || iva > 100) {
      issues.push('IVA % (entre 0 y 100)');
      nextErrors.porcentaje_iva = true;
    }

    return {
      valid: issues.length === 0,
      issues,
      nextErrors,
      payload: product
        ? {
            id_producto: product.id_producto,
            nombre_producto: product.nombre_producto,
            cantidad,
            precio_unitario: precio,
            porcentaje_descuento: descuento,
            porcentaje_iva: iva,
          }
        : null,
    };
  };

  const handleSaveLine = async () => {
    if (disabled) return;
    const { valid, issues, nextErrors, payload } = validateDraft();
    if (!valid) {
      setDraftErrors(nextErrors);
      setErrorIssues(issues);
      onNotify?.('error', {
        title: isEditing ? 'Datos incompletos al actualizar línea' : 'Faltan datos en el detalle',
        message: 'Revisa los siguientes campos del producto:',
        items: issues,
      });
      return;
    }

    setSaving(true);
    setErrorIssues([]);
    setDraftErrors({});
    try {
      if (isEditing) {
        await onUpdate?.(activeEditingLine, payload);
        setEditingLine(null);
      } else {
        await onAdd?.(payload);
      }
      setDraft(EMPTY_DRAFT);
    } catch (err) {
      setErrorIssues([err.message]);
      onNotify?.('error', err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async (line) => {
    if (disabled) return;
    setRemovingKey(line.key);
    setErrorIssues([]);
    try {
      await onRemove?.(line);
      if (activeEditingLine && activeEditingLine.key === line.key) {
        cancelEdit();
      }
    } catch (err) {
      setErrorIssues([err.message]);
      onNotify?.('error', err.message);
    } finally {
      setRemovingKey(null);
    }
  };

  return (
    <div className="space-y-4">
      {!readOnly && (
        <div
          className={`rounded-xl border p-3.5 space-y-3 transition-all ${
            disabled
              ? 'border-dashed border-border bg-muted/30 opacity-75'
              : isEditing
                ? 'border-primary/50 bg-primary/5'
                : 'border-border bg-muted/40'
          }`}
        >
          {disabled && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-300 text-xs font-bold">
              <Lock className="w-4 h-4 flex-shrink-0" />
              <span>{disabledMessage}</span>
            </div>
          )}

          {!disabled && isEditing && (
            <div className="flex items-center justify-between gap-2 px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/25 text-xs font-bold text-primary">
              <span>Editando producto: {activeEditingLine.nombre_producto}</span>
              <button
                type="button"
                onClick={cancelEdit}
                className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
                Cancelar
              </button>
            </div>
          )}

          <div className="grid grid-cols-2 md:grid-cols-12 gap-2.5 items-end">
            <label className="col-span-2 md:col-span-4 block">
              <MiniLabel required>Producto</MiniLabel>
              <select
                value={activeDraft.id_producto}
                onChange={selectProduct}
                disabled={disabled || saving}
                className={fieldClass(activeErrors.id_producto)}
              >
                <option value="">
                  {disabled
                    ? 'Primero elige proveedor y categoría'
                    : productOptions.length
                      ? 'Selecciona un producto'
                      : 'Sin productos en la categoría'}
                </option>
                {productOptions.map((p) => (
                  <option key={p.id_producto} value={p.id_producto}>
                    {p.nombre_producto}
                  </option>
                ))}
              </select>
            </label>

            <label className="md:col-span-1 block">
              <MiniLabel required>Cant.</MiniLabel>
              <input
                type="number"
                min="1"
                step="1"
                value={activeDraft.cantidad}
                onChange={setField('cantidad')}
                disabled={disabled || saving}
                className={fieldClass(activeErrors.cantidad)}
              />
            </label>

            <label className="md:col-span-2 block">
              <MiniLabel required>Precio unit.</MiniLabel>
              <input
                type="number"
                min="0"
                step="1"
                value={activeDraft.precio_unitario}
                onChange={setField('precio_unitario')}
                placeholder="0"
                disabled={disabled || saving}
                className={fieldClass(activeErrors.precio_unitario)}
              />
            </label>

            <label className="md:col-span-2 block">
              <MiniLabel>Desc. %</MiniLabel>
              <input
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={activeDraft.porcentaje_descuento}
                onChange={setField('porcentaje_descuento')}
                disabled={disabled || saving}
                className={fieldClass(activeErrors.porcentaje_descuento)}
              />
            </label>

            <label className="md:col-span-1 block">
              <MiniLabel>IVA %</MiniLabel>
              <input
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={activeDraft.porcentaje_iva}
                onChange={setField('porcentaje_iva')}
                disabled={disabled || saving}
                className={fieldClass(activeErrors.porcentaje_iva)}
              />
            </label>

            <div className="col-span-2 md:col-span-2 flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleSaveLine}
                disabled={disabled || saving}
                className="flex-1 px-3 py-2 rounded-xl font-black text-white text-sm bg-primary hover:opacity-90 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {saving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : isEditing ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <Plus className="w-4 h-4" />
                )}
                {isEditing ? 'Actualizar' : 'Agregar'}
              </button>
              {isEditing && (
                <button
                  type="button"
                  onClick={cancelEdit}
                  disabled={disabled || saving}
                  title="Cancelar edición"
                  aria-label="Cancelar edición de línea"
                  className="p-2 rounded-xl bg-muted text-foreground hover:bg-muted/80 disabled:opacity-50 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {activeIssues.length > 0 && (
            <div
              role="alert"
              className="text-xs font-bold px-3 py-2 rounded-lg bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-300 border border-red-200 dark:border-red-800 space-y-1"
            >
              {activeIssues.length === 1 ? (
                <p>{activeIssues[0]}</p>
              ) : (
                <>
                  <p>Campos inválidos o faltantes en el detalle:</p>
                  <ul className="list-disc pl-4 font-semibold">
                    {activeIssues.map((issue) => (
                      <li key={issue}>{issue}</li>
                    ))}
                  </ul>
                </>
              )}
            </div>
          )}
        </div>
      )}

      {readOnly && activeIssues.length > 0 && (
        <p role="alert" className="text-xs font-bold text-red-600 dark:text-red-300">
          {activeIssues[0]}
        </p>
      )}

      <div
        className={`border rounded-xl overflow-x-auto ${
          hasLinesError ? 'border-red-500 ring-1 ring-red-500/30' : 'border-border'
        }`}
      >
        <table className="w-full text-sm min-w-[600px]">
          <thead>
            <tr className="border-b border-border bg-muted/30 text-left text-[11px] font-black uppercase tracking-wide text-muted-foreground">
              <th className="px-3 py-2.5">Producto</th>
              <th className="px-3 py-2.5 text-right">Cant.</th>
              <th className="px-3 py-2.5 text-right">Precio unit.</th>
              <th className="px-3 py-2.5 text-right">Desc.</th>
              <th className="px-3 py-2.5 text-right">IVA</th>
              <th className="px-3 py-2.5 text-right">Total</th>
              {!readOnly && <th className="px-3 py-2.5 text-center w-24">Acciones</th>}
            </tr>
          </thead>
          <tbody>
            {lines.length === 0 ? (
              <tr>
                <td colSpan={readOnly ? 6 : 7} className="px-3 py-6 text-center text-xs text-muted-foreground">
                  {disabled
                    ? 'Detalle desactivado: selecciona proveedor y categoría para agregar productos.'
                    : 'Aún no hay productos en el detalle de esta compra.'}
                </td>
              </tr>
            ) : (
              lines.map((line) => {
                const rowEditing = activeEditingLine?.key === line.key;
                return (
                  <tr
                    key={line.key}
                    className={`border-b border-border last:border-b-0 transition-colors ${
                      rowEditing ? 'bg-primary/5' : ''
                    }`}
                  >
                    <td className="px-3 py-2.5 font-bold text-foreground">{line.nombre_producto}</td>
                    <td className="px-3 py-2.5 text-right">{line.cantidad}</td>
                    <td className="px-3 py-2.5 text-right">{formatCOP(line.precio_unitario)}</td>
                    <td className="px-3 py-2.5 text-right text-muted-foreground">{line.porcentaje_descuento}%</td>
                    <td className="px-3 py-2.5 text-right text-muted-foreground">{line.porcentaje_iva}%</td>
                    <td className="px-3 py-2.5 text-right font-black text-primary">{formatCOP(calcLine(line).total)}</td>
                    {!readOnly && (
                      <td className="px-2 py-2.5">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            type="button"
                            onClick={() => startEdit(line)}
                            disabled={disabled || saving || removingKey === line.key}
                            title={`Editar ${line.nombre_producto}`}
                            aria-label={`Editar ${line.nombre_producto}`}
                            className="p-1.5 rounded-lg text-primary hover:bg-primary/10 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemove(line)}
                            disabled={disabled || saving || removingKey === line.key}
                            title={`Quitar ${line.nombre_producto}`}
                            aria-label={`Quitar ${line.nombre_producto}`}
                            className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                          >
                            {removingKey === line.key ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })
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
