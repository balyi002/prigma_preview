import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AlertCircle, Loader2 } from 'lucide-react';
import Modal from './Modal';
import ConfirmDialog from './ConfirmDialog';
import PurchaseLinesEditor from './PurchaseLinesEditor';
import { calcTotals } from '../utils/purchaseCalculations';
import { formatCOP, formatDate } from '../utils/format';
import { getStatusName, isOpenStatus } from '../utils/purchaseStatus';

const baseInputClass =
  'w-full px-3.5 py-2.5 bg-input-background border rounded-xl text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-ring transition-all disabled:opacity-60 disabled:cursor-not-allowed';

const fieldClass = (hasError) =>
  `${baseInputClass} ${hasError ? 'border-red-500 ring-1 ring-red-500/30' : 'border-border'}`;

const secondaryBtn =
  'px-4 py-2 rounded-xl text-sm font-bold bg-muted text-foreground hover:bg-muted/80 transition-colors cursor-pointer';

const sameId = (a, b) => Number(a) === Number(b);

function Field({ label, hint, children }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-xs font-bold text-foreground block">
        {label} <span className="text-primary">*</span>
      </span>
      {children}
      {hint && <span className="text-[11px] text-muted-foreground block">{hint}</span>}
    </label>
  );
}

function ErrorBox({ title, items, message }) {
  if (!message && (!items || items.length === 0)) return null;
  return (
    <div
      role="alert"
      className="text-xs font-bold px-3.5 py-2.5 rounded-xl bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-300 border border-red-200 dark:border-red-800 space-y-1"
    >
      <div className="flex items-center gap-2 font-black">
        <AlertCircle className="w-4 h-4 flex-shrink-0" />
        <span>{title || message}</span>
      </div>
      {title && message && <p className="pl-6 font-semibold">{message}</p>}
      {Array.isArray(items) && items.length > 0 && (
        <ul className="list-disc pl-10 space-y-0.5 font-semibold">
          {items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

function validatePurchaseForm(form, lines, { isEditingLine = false } = {}) {
  const missing = [];
  const fieldErrors = {};

  if (!form.factura.trim()) {
    missing.push('N.º de factura del proveedor');
    fieldErrors.factura = true;
  }
  if (!form.idUsuario) {
    missing.push('Registrada por (usuario)');
    fieldErrors.idUsuario = true;
  }
  if (!form.idProveedor) {
    missing.push('Proveedor');
    fieldErrors.idProveedor = true;
  }
  if (!form.idCategoria) {
    missing.push('Categoría de productos');
    fieldErrors.idCategoria = true;
  }
  if (!form.idEstado) {
    missing.push('Estado inicial');
    fieldErrors.idEstado = true;
  }
  if (lines.length === 0) {
    missing.push('Detalle de productos (agrega al menos un producto)');
    fieldErrors.lines = true;
  }
  if (isEditingLine) {
    missing.push('Finaliza o cancela la edición de la línea en el detalle');
  }

  return { valid: missing.length === 0, missing, fieldErrors };
}

function PurchaseHeaderFields({
  form,
  onChangeField,
  onChangeProveedor,
  fieldErrors,
  locked,
  proveedores,
  usuarios,
  categoryOptions,
  estadoOptions,
  statusHint,
  autoFocusFactura = false,
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Field label="N.º de factura del proveedor">
        <input
          type="text"
          value={form.factura}
          onChange={onChangeField('factura')}
          placeholder="Ej: FAC-00123"
          maxLength={50}
          autoFocus={autoFocusFactura}
          className={fieldClass(fieldErrors.factura)}
        />
      </Field>

      <Field label="Registrada por">
        <select value={form.idUsuario} onChange={onChangeField('idUsuario')} className={fieldClass(fieldErrors.idUsuario)}>
          <option value="">Selecciona un usuario</option>
          {usuarios
            .filter((u) => u.estado || sameId(u.id_usuario, form.idUsuario))
            .map((u) => (
              <option key={u.id_usuario} value={u.id_usuario}>
                {u.nombre_usuario} {u.apellido_usuario}
              </option>
            ))}
        </select>
      </Field>

      <Field label="Proveedor" hint={locked ? 'Quita los productos del detalle para cambiar de proveedor.' : undefined}>
        <select
          value={form.idProveedor}
          disabled={locked}
          onChange={onChangeProveedor}
          className={fieldClass(fieldErrors.idProveedor)}
        >
          <option value="">Selecciona un proveedor</option>
          {proveedores
            .filter((p) => p.estado || sameId(p.id_proveedor, form.idProveedor))
            .map((p) => (
              <option key={p.id_proveedor} value={p.id_proveedor}>
                {p.nombre_proveedor}
              </option>
            ))}
        </select>
      </Field>

      <Field
        label="Categoría de productos"
        hint={locked ? 'Quita los productos del detalle para cambiar de categoría.' : undefined}
      >
        <select
          value={form.idCategoria}
          disabled={locked || !form.idProveedor}
          onChange={onChangeField('idCategoria')}
          className={fieldClass(fieldErrors.idCategoria)}
        >
          <option value="">{form.idProveedor ? 'Selecciona una categoría' : 'Primero elige un proveedor'}</option>
          {categoryOptions.map((c) => (
            <option key={c.id_categoria_producto} value={c.id_categoria_producto}>
              {c.nombre_categoria}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Estado" hint={statusHint}>
        <select value={form.idEstado} onChange={onChangeField('idEstado')} className={fieldClass(fieldErrors.idEstado)}>
          {estadoOptions.map((e) => (
            <option key={e.id_estado} value={e.id_estado}>
              {getStatusName(e)}
            </option>
          ))}
        </select>
      </Field>
    </div>
  );
}

/* ───────────────────────────── CREAR ───────────────────────────── */
function CreateForm({ catalogs, defaultUserId, onCreate, onNotify, onClose }) {
  const { estados, proveedores, productos, usuarios, categorias, getSupplierCategories } = catalogs;

  // Una compra nueva solo puede nacer abierta (Pendiente/Apartada); pasa a Pagada desde la tabla.
  const openEstados = useMemo(() => {
    const open = estados.filter((e) => isOpenStatus(getStatusName(e)));
    return open.length ? open : estados;
  }, [estados]);

  const [form, setForm] = useState({
    factura: '',
    idProveedor: '',
    idCategoria: '',
    idUsuario: defaultUserId ? String(defaultUserId) : '',
    idEstado: openEstados[0] ? String(openEstados[0].id_estado) : '',
  });
  const [lines, setLines] = useState([]);
  const [supplierCategories, setSupplierCategories] = useState(null);
  const [saving, setSaving] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [missingItems, setMissingItems] = useState([]);
  const [serverError, setServerError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [isEditingLine, setIsEditingLine] = useState(false);
  const counter = useRef(0);

  const clearErrorState = (key) => {
    setServerError('');
    setMissingItems([]);
    if (key) setFieldErrors((prev) => (prev[key] ? { ...prev, [key]: false } : prev));
  };

  const set = (key) => (e) => {
    clearErrorState(key);
    setForm((f) => ({ ...f, [key]: e.target.value }));
  };

  // Al elegir proveedor se cargan solo las categorías que surte.
  useEffect(() => {
    if (!form.idProveedor) return undefined;
    let cancelled = false;
    getSupplierCategories(form.idProveedor)
      .then((rows) => !cancelled && setSupplierCategories(rows))
      .catch(() => !cancelled && setSupplierCategories([]));
    return () => {
      cancelled = true;
    };
  }, [form.idProveedor, getSupplierCategories]);

  // categorias_producto ahora tiene `estado`: solo se ofrecen las categorías activas.
  const categoryOptions = useMemo(() => {
    const isActive = (c) => c.estado === undefined || Boolean(c.estado);
    const supplierActive = (supplierCategories ?? []).filter(isActive);
    return form.idProveedor && supplierActive.length ? supplierActive : categorias.filter(isActive);
  }, [form.idProveedor, supplierCategories, categorias]);

  const availableProducts = useMemo(
    () =>
      form.idCategoria
        ? productos.filter((p) => p.estado && sameId(p.id_categoria_producto, form.idCategoria))
        : [],
    [productos, form.idCategoria]
  );

  const locked = lines.length > 0; // con productos agregados no se puede cambiar proveedor/categoría
  const detailEnabled = Boolean(form.idProveedor && form.idCategoria);
  const selectedProveedor = proveedores.find((p) => sameId(p.id_proveedor, form.idProveedor));
  const createTotal = useMemo(() => calcTotals(lines).total, [lines]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const validation = validatePurchaseForm(form, lines, { isEditingLine });
    if (!validation.valid) {
      setFieldErrors(validation.fieldErrors);
      setMissingItems(validation.missing);
      setServerError('');
      onNotify?.('error', {
        title: 'No se pudo registrar la compra',
        message: 'Completa los siguientes campos obligatorios:',
        items: validation.missing,
      });
      return;
    }
    setServerError('');
    setMissingItems([]);
    setFieldErrors({});
    setConfirmOpen(true);
  };

  const confirmCreate = async () => {
    setSaving(true);
    try {
      await onCreate(
        {
          num_factura_proveedor: form.factura.trim(),
          id_proveedor: Number(form.idProveedor),
          id_categoria_producto: Number(form.idCategoria),
          id_usuario: Number(form.idUsuario),
          id_estado: Number(form.idEstado),
        },
        lines
      );
      setConfirmOpen(false);
    } catch (err) {
      setConfirmOpen(false);
      setServerError(err.message);
      onNotify?.('error', err.message);
      setSaving(false);
    }
  };

  return (
    <>
      <Modal
        title="Nueva compra"
        subtitle="Maestro / Detalle: completa la cabecera y gestiona los productos del detalle"
        size="xl"
        onClose={onClose}
        footer={
          <>
            <button type="button" onClick={onClose} className={secondaryBtn}>
              Cancelar
            </button>
            <button
              type="submit"
              form="purchase-form"
              disabled={saving}
              className="px-5 py-2 rounded-full text-sm font-black bg-primary text-white shadow-md shadow-primary/20 hover:opacity-90 active:scale-[0.98] disabled:opacity-60 transition-all flex items-center gap-2 cursor-pointer"
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              Registrar compra
            </button>
          </>
        }
      >
        <form id="purchase-form" onSubmit={handleSubmit} className="space-y-5" noValidate>
          <div className="space-y-3">
            <h3 className="text-xs font-black uppercase tracking-wide text-muted-foreground">
              Datos de la compra (Cabecera)
            </h3>
            <PurchaseHeaderFields
              form={form}
              onChangeField={set}
              onChangeProveedor={(e) => {
                clearErrorState('idProveedor');
                clearErrorState('idCategoria');
                setSupplierCategories(null);
                setForm((f) => ({ ...f, idProveedor: e.target.value, idCategoria: '' }));
              }}
              fieldErrors={fieldErrors}
              locked={locked}
              proveedores={proveedores}
              usuarios={usuarios}
              categoryOptions={categoryOptions}
              estadoOptions={openEstados}
              statusHint="Para marcarla como pagada, cámbiala desde la tabla."
              autoFocusFactura
            />
          </div>

          <div className="pt-2 border-t border-border space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-sm font-black text-foreground">Detalle de la compra (Productos)</h3>
              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-muted text-muted-foreground">
                {lines.length} {lines.length === 1 ? 'producto' : 'productos'}
              </span>
            </div>

            <PurchaseLinesEditor
              products={availableProducts}
              lines={lines}
              disabled={!detailEnabled}
              disabledMessage="El detalle está desactivado. Selecciona primero Proveedor y Categoría para poder agregar productos."
              hasLinesError={Boolean(fieldErrors.lines)}
              onNotify={onNotify}
              onEditingChange={setIsEditingLine}
              onAdd={async (line) => {
                clearErrorState('lines');
                setLines((prev) => [...prev, { ...line, key: `local-${++counter.current}` }]);
              }}
              onUpdate={async (targetLine, updated) => {
                clearErrorState('lines');
                setLines((prev) =>
                  prev.map((l) => (l.key === targetLine.key ? { ...l, ...updated } : l))
                );
              }}
              onRemove={async (line) => {
                setLines((prev) => prev.filter((l) => l.key !== line.key));
              }}
            />
          </div>

          <ErrorBox
            title={missingItems.length > 0 ? 'Faltan campos por completar:' : undefined}
            items={missingItems}
            message={serverError}
          />
        </form>
      </Modal>

      {confirmOpen && (
        <ConfirmDialog
          variant="primary"
          title="¿Confirmar registro de compra?"
          message={`Se registrará la factura ${form.factura.trim()} de ${selectedProveedor?.nombre_proveedor ?? 'proveedor'} con ${lines.length} producto(s) por un total de ${formatCOP(createTotal)}.`}
          confirmLabel="Confirmar"
          loading={saving}
          onConfirm={confirmCreate}
          onClose={() => setConfirmOpen(false)}
        />
      )}
    </>
  );
}

/* ───────────────────────────── EDITAR ───────────────────────────── */
function EditForm({
  purchase,
  catalogs,
  fetchDetail,
  onUpdatePurchase,
  onAddLine,
  onUpdateLine,
  onRemoveLine,
  onNotify,
  onClose,
}) {
  const { estados, proveedores, productos, usuarios, categorias, getSupplierCategories } = catalogs;

  const openEstados = useMemo(() => {
    const open = estados.filter((e) => isOpenStatus(getStatusName(e)) || sameId(e.id_estado, purchase.idEstado));
    return open.length ? open : estados;
  }, [estados, purchase.idEstado]);

  const [form, setForm] = useState({
    factura: purchase.factura || '',
    idProveedor: purchase.idProveedor ? String(purchase.idProveedor) : '',
    idCategoria: purchase.idCategoria ? String(purchase.idCategoria) : '',
    idUsuario: purchase.idUsuario ? String(purchase.idUsuario) : '',
    idEstado: purchase.idEstado ? String(purchase.idEstado) : '',
  });
  const [lines, setLines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [confirmSaveOpen, setConfirmSaveOpen] = useState(false);
  const [removingLine, setRemovingLine] = useState(null);
  const [removingBusy, setRemovingBusy] = useState(false);
  const [supplierCategories, setSupplierCategories] = useState(null);
  const [missingItems, setMissingItems] = useState([]);
  const [serverError, setServerError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [isEditingLine, setIsEditingLine] = useState(false);

  const clearErrorState = (key) => {
    setServerError('');
    setMissingItems([]);
    if (key) setFieldErrors((prev) => (prev[key] ? { ...prev, [key]: false } : prev));
  };

  const set = (key) => (e) => {
    clearErrorState(key);
    setForm((f) => ({ ...f, [key]: e.target.value }));
  };

  const refresh = useCallback(async () => {
    try {
      setLines(await fetchDetail(purchase.id));
    } catch (err) {
      setServerError(err.message);
      onNotify?.('error', err.message);
    } finally {
      setLoading(false);
    }
  }, [fetchDetail, purchase.id, onNotify]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    if (!form.idProveedor) return undefined;
    let cancelled = false;
    getSupplierCategories(form.idProveedor)
      .then((rows) => !cancelled && setSupplierCategories(rows))
      .catch(() => !cancelled && setSupplierCategories([]));
    return () => {
      cancelled = true;
    };
  }, [form.idProveedor, getSupplierCategories]);

  const categoryOptions = useMemo(() => {
    const isActive = (c) => c.estado === undefined || Boolean(c.estado) || sameId(c.id_categoria_producto, form.idCategoria);
    const supplierActive = (supplierCategories ?? []).filter(isActive);
    return form.idProveedor && supplierActive.length ? supplierActive : categorias.filter(isActive);
  }, [form.idProveedor, form.idCategoria, supplierCategories, categorias]);

  const availableProducts = useMemo(
    () =>
      form.idCategoria
        ? productos.filter((p) => p.estado && sameId(p.id_categoria_producto, form.idCategoria))
        : [],
    [productos, form.idCategoria]
  );

  const locked = lines.length > 0;
  const detailEnabled = Boolean(form.idProveedor && form.idCategoria);

  const handleSaveHeader = (e) => {
    e.preventDefault();
    const validation = validatePurchaseForm(form, lines, { isEditingLine });
    if (!validation.valid) {
      setFieldErrors(validation.fieldErrors);
      setMissingItems(validation.missing);
      setServerError('');
      onNotify?.('error', {
        title: 'No se pudo actualizar la compra',
        message: 'Revisa los siguientes campos obligatorios:',
        items: validation.missing,
      });
      return;
    }

    setServerError('');
    setMissingItems([]);
    setFieldErrors({});
    setConfirmSaveOpen(true);
  };

  const confirmUpdateHeader = async () => {
    setSaving(true);
    try {
      await onUpdatePurchase(purchase.id, {
        num_factura_proveedor: form.factura.trim(),
        id_proveedor: Number(form.idProveedor),
        id_categoria_producto: Number(form.idCategoria),
        id_usuario: Number(form.idUsuario),
        id_estado: Number(form.idEstado),
      });
      setConfirmSaveOpen(false);
      onNotify?.('success', `Compra ${purchase.code} actualizada.`);
      onClose();
    } catch (err) {
      setConfirmSaveOpen(false);
      setServerError(err.message);
      onNotify?.('error', err.message);
      setSaving(false);
    }
  };

  const confirmRemoveLine = async () => {
    if (!removingLine) return;
    setRemovingBusy(true);
    try {
      await onRemoveLine(purchase.id, removingLine.idDetalle);
      await refresh();
      onNotify?.('success', 'Producto eliminado del detalle.');
    } catch (err) {
      onNotify?.('error', err.message);
    } finally {
      setRemovingBusy(false);
      setRemovingLine(null);
    }
  };

  return (
    <>
      <Modal
        title={`Editar compra ${purchase.code}`}
        subtitle={`Registrada el ${formatDate(purchase.fecha)} · Edita cabecera y detalle mientras esté abierta`}
        size="xl"
        onClose={onClose}
        footer={
          <>
            <button type="button" onClick={onClose} className={secondaryBtn}>
              Cerrar
            </button>
            <button
              type="submit"
              form="purchase-edit-form"
              disabled={saving || loading}
              className="px-5 py-2 rounded-full text-sm font-black bg-primary text-white shadow-md shadow-primary/20 hover:opacity-90 active:scale-[0.98] disabled:opacity-60 transition-all flex items-center gap-2 cursor-pointer"
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              Guardar cambios
            </button>
          </>
        }
      >
        <form id="purchase-edit-form" onSubmit={handleSaveHeader} className="space-y-5" noValidate>
          <div className="space-y-3">
            <h3 className="text-xs font-black uppercase tracking-wide text-muted-foreground">
              Datos de la compra (Cabecera)
            </h3>
            <PurchaseHeaderFields
              form={form}
              onChangeField={set}
              onChangeProveedor={(e) => {
                clearErrorState('idProveedor');
                clearErrorState('idCategoria');
                setSupplierCategories(null);
                setForm((f) => ({ ...f, idProveedor: e.target.value, idCategoria: '' }));
              }}
              fieldErrors={fieldErrors}
              locked={locked}
              proveedores={proveedores}
              usuarios={usuarios}
              categoryOptions={categoryOptions}
              estadoOptions={openEstados}
            />
          </div>

          <div className="pt-2 border-t border-border space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-sm font-black text-foreground">Detalle de la compra (Productos)</h3>
              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-muted text-muted-foreground">
                {lines.length} {lines.length === 1 ? 'producto' : 'productos'}
              </span>
            </div>

            {loading ? (
              <div className="py-10 flex items-center justify-center gap-2 text-sm font-bold text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" />
                Cargando productos...
              </div>
            ) : (
              <PurchaseLinesEditor
                products={availableProducts}
                lines={lines}
                disabled={!detailEnabled}
                disabledMessage="El detalle está desactivado. Selecciona proveedor y categoría para gestionar productos."
                hasLinesError={Boolean(fieldErrors.lines)}
                onNotify={onNotify}
                onEditingChange={setIsEditingLine}
                onAdd={async (line) => {
                  clearErrorState('lines');
                  await onAddLine(purchase.id, line);
                  await refresh();
                  onNotify?.('success', 'Producto agregado al detalle.');
                }}
                onUpdate={async (targetLine, updated) => {
                  clearErrorState('lines');
                  await onUpdateLine(purchase.id, targetLine.idDetalle, updated);
                  await refresh();
                  onNotify?.('success', 'Producto actualizado en el detalle.');
                }}
                onRemove={async (line) => {
                  setRemovingLine(line);
                }}
              />
            )}
          </div>

          <ErrorBox
            title={missingItems.length > 0 ? 'Faltan campos por completar:' : undefined}
            items={missingItems}
            message={serverError}
          />
        </form>
      </Modal>

      {confirmSaveOpen && (
        <ConfirmDialog
          variant="primary"
          title={`¿Guardar cambios en ${purchase.code}?`}
          message={`Se actualizarán los datos de cabecera de la compra con factura ${form.factura.trim()}.`}
          confirmLabel="Confirmar"
          loading={saving}
          onConfirm={confirmUpdateHeader}
          onClose={() => setConfirmSaveOpen(false)}
        />
      )}

      {removingLine && (
        <ConfirmDialog
          variant="danger"
          title="¿Quitar producto del detalle?"
          message={`Se eliminará «${removingLine.nombre_producto}» de la compra ${purchase.code}.`}
          confirmLabel="Confirmar"
          loading={removingBusy}
          onConfirm={confirmRemoveLine}
          onClose={() => setRemovingLine(null)}
        />
      )}
    </>
  );
}

export default function PurchaseFormModal({ mode, purchase, catalogs, defaultUserId, ...handlers }) {
  if (mode === 'edit') {
    return (
      <EditForm
        purchase={purchase}
        catalogs={catalogs}
        fetchDetail={handlers.fetchDetail}
        onUpdatePurchase={handlers.onUpdatePurchase}
        onAddLine={handlers.onAddLine}
        onUpdateLine={handlers.onUpdateLine}
        onRemoveLine={handlers.onRemoveLine}
        onNotify={handlers.onNotify}
        onClose={handlers.onClose}
      />
    );
  }
  return (
    <CreateForm
      catalogs={catalogs}
      defaultUserId={defaultUserId}
      onCreate={handlers.onCreate}
      onNotify={handlers.onNotify}
      onClose={handlers.onClose}
    />
  );
}
