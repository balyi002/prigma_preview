import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';
import Modal from './Modal';
import PurchaseLinesEditor from './PurchaseLinesEditor';
import { formatDate } from '../utils/format';
import { getStatusName, isOpenStatus } from '../utils/purchaseStatus';

const inputClass =
  'w-full px-3.5 py-2.5 bg-input-background border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-ring transition-all disabled:opacity-60';

const secondaryBtn =
  'px-4 py-2 rounded-xl text-sm font-bold bg-muted text-foreground hover:bg-muted/80 transition-colors cursor-pointer';

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

const ErrorBox = ({ children }) => (
  <p
    role="alert"
    className="text-xs font-bold px-3 py-2 rounded-xl bg-red-100 text-red-600 dark:bg-red-950/50 dark:text-red-300 border border-red-200 dark:border-red-800"
  >
    {children}
  </p>
);

const sameId = (a, b) => Number(a) === Number(b);

/* ───────────────────────────── CREAR ───────────────────────────── */
function CreateForm({ catalogs, defaultUserId, onCreate, onClose }) {
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
  const [error, setError] = useState('');
  const counter = useRef(0);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.factura.trim()) return setError('Ingresa el número de factura del proveedor.');
    if (!form.idProveedor) return setError('Selecciona un proveedor.');
    if (!form.idCategoria) return setError('Selecciona la categoría de productos.');
    if (!form.idUsuario) return setError('Indica quién registra la compra.');
    if (!form.idEstado) return setError('No hay estados disponibles para la compra.');
    if (lines.length === 0) return setError('Agrega al menos un producto a la compra.');

    setSaving(true);
    setError('');
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
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  };

  return (
    <Modal
      title="Nueva compra"
      subtitle="Registra una compra a un proveedor y sus productos"
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
            className="px-4 py-2 rounded-xl text-sm font-black bg-primary text-white shadow-md shadow-primary/20 hover:opacity-90 active:scale-[0.98] disabled:opacity-60 transition-all flex items-center gap-2 cursor-pointer"
          >
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            Registrar compra
          </button>
        </>
      }
    >
      <form id="purchase-form" onSubmit={handleSubmit} className="space-y-4" noValidate>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="N.º de factura del proveedor">
            <input
              type="text"
              value={form.factura}
              onChange={set('factura')}
              placeholder="Ej: FAC-00123"
              maxLength={50}
              autoFocus
              className={inputClass}
            />
          </Field>

          <Field label="Registrada por">
            <select value={form.idUsuario} onChange={set('idUsuario')} className={inputClass}>
              <option value="">Selecciona un usuario</option>
              {usuarios
                .filter((u) => u.estado)
                .map((u) => (
                  <option key={u.id_usuario} value={u.id_usuario}>
                    {u.nombre_usuario} {u.apellido_usuario}
                  </option>
                ))}
            </select>
          </Field>

          <Field label="Proveedor" hint={locked ? 'Quita los productos para cambiar de proveedor.' : undefined}>
            <select
              value={form.idProveedor}
              disabled={locked}
              onChange={(e) => {
                setSupplierCategories(null);
                setForm((f) => ({ ...f, idProveedor: e.target.value, idCategoria: '' }));
              }}
              className={inputClass}
            >
              <option value="">Selecciona un proveedor</option>
              {proveedores
                .filter((p) => p.estado)
                .map((p) => (
                  <option key={p.id_proveedor} value={p.id_proveedor}>
                    {p.nombre_proveedor}
                  </option>
                ))}
            </select>
          </Field>

          <Field
            label="Categoría de productos"
            hint={locked ? 'Quita los productos para cambiar de categoría.' : undefined}
          >
            <select
              value={form.idCategoria}
              disabled={locked || !form.idProveedor}
              onChange={set('idCategoria')}
              className={inputClass}
            >
              <option value="">{form.idProveedor ? 'Selecciona una categoría' : 'Primero elige un proveedor'}</option>
              {categoryOptions.map((c) => (
                <option key={c.id_categoria_producto} value={c.id_categoria_producto}>
                  {c.nombre_categoria}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Estado inicial" hint="Para marcarla como pagada, cámbiala desde la tabla.">
            <select value={form.idEstado} onChange={set('idEstado')} className={inputClass}>
              {openEstados.map((e) => (
                <option key={e.id_estado} value={e.id_estado}>
                  {getStatusName(e)}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <div className="pt-1">
          <h3 className="text-sm font-black text-foreground mb-2">Productos de la compra</h3>
          {form.idCategoria ? (
            <PurchaseLinesEditor
              products={availableProducts}
              lines={lines}
              onAdd={async (line) => setLines((prev) => [...prev, { ...line, key: `local-${++counter.current}` }])}
              onRemove={async (line) => setLines((prev) => prev.filter((l) => l.key !== line.key))}
            />
          ) : (
            <p className="text-xs text-muted-foreground border border-dashed border-border rounded-xl px-4 py-6 text-center">
              Elige proveedor y categoría para agregar productos.
            </p>
          )}
        </div>

        {error && <ErrorBox>{error}</ErrorBox>}
      </form>
    </Modal>
  );
}

/* ───────────────────────────── EDITAR ───────────────────────────── */
// El servidor no tiene PUT para la cabecera de compras: se editan los productos (agregar/quitar).
function EditForm({ purchase, catalogs, fetchDetail, onAddLine, onRemoveLine, onClose }) {
  const [lines, setLines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const refresh = useCallback(async () => {
    try {
      setLines(await fetchDetail(purchase.id));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [fetchDetail, purchase.id]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const products = useMemo(
    () => catalogs.productos.filter((p) => p.estado && sameId(p.id_categoria_producto, purchase.idCategoria)),
    [catalogs.productos, purchase.idCategoria]
  );

  const info = [
    ['Proveedor', purchase.proveedor],
    ['N.º de factura', purchase.factura || '—'],
    ['Fecha', formatDate(purchase.fecha)],
    ['Categoría', purchase.categoria || '—'],
  ];

  return (
    <Modal
      title={`Editar compra ${purchase.code}`}
      subtitle="Puedes agregar o quitar productos mientras la compra esté abierta"
      size="xl"
      onClose={onClose}
      footer={
        <button type="button" onClick={onClose} className={secondaryBtn}>
          Cerrar
        </button>
      }
    >
      <dl className="grid grid-cols-2 md:grid-cols-4 gap-3 rounded-xl bg-muted/50 border border-border p-3">
        {info.map(([label, value]) => (
          <div key={label}>
            <dt className="text-[11px] font-black uppercase tracking-wide text-muted-foreground">{label}</dt>
            <dd className="text-sm font-bold text-foreground truncate">{value}</dd>
          </div>
        ))}
      </dl>

      {error && <ErrorBox>{error}</ErrorBox>}

      {loading ? (
        <div className="py-10 flex items-center justify-center gap-2 text-sm font-bold text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin" />
          Cargando productos...
        </div>
      ) : (
        <PurchaseLinesEditor
          products={products}
          lines={lines}
          onAdd={async (line) => {
            await onAddLine(purchase.id, line);
            await refresh();
          }}
          onRemove={async (line) => {
            await onRemoveLine(purchase.id, line.idDetalle);
            await refresh();
          }}
        />
      )}
    </Modal>
  );
}

export default function PurchaseFormModal({ mode, purchase, catalogs, defaultUserId, ...handlers }) {
  if (mode === 'edit') {
    return (
      <EditForm
        purchase={purchase}
        catalogs={catalogs}
        fetchDetail={handlers.fetchDetail}
        onAddLine={handlers.onAddLine}
        onRemoveLine={handlers.onRemoveLine}
        onClose={handlers.onClose}
      />
    );
  }
  return (
    <CreateForm
      catalogs={catalogs}
      defaultUserId={defaultUserId}
      onCreate={handlers.onCreate}
      onClose={handlers.onClose}
    />
  );
}
