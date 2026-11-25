import { useState } from 'react';
import { AlertCircle, Loader2 } from 'lucide-react';
import Modal from './Modal';
import ConfirmDialog from './ConfirmDialog';
import { formatCOP } from '../utils/format';

const baseInputClass =
  'w-full px-3.5 py-2.5 bg-input-background border rounded-xl text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-ring transition-all';

const fieldClass = (hasError) =>
  `${baseInputClass} ${hasError ? 'border-red-500 ring-1 ring-red-500/30' : 'border-border'}`;

function Field({ label, hint, children }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-xs font-bold text-foreground block">
        {label} <span className="text-primary">*</span>
      </span>
      {children}
      {hint && <span className="text-xs text-muted-foreground block">{hint}</span>}
    </label>
  );
}

const EMPTY = { nombre: '', categoria: '', precio: '', costo: '' };

const fromService = (s) => ({
  nombre: s.nombre_servicio,
  categoria: String(s.id_categoria_servicio),
  precio: String(s.precio_venta),
  costo: String(s.costo),
});

export default function ServiceFormModal({ service, categories, onSubmit, onNotify, onClose }) {
  const isEdit = Boolean(service);
  const [form, setForm] = useState(() => (service ? fromService(service) : EMPTY));
  const [saving, setSaving] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [missingItems, setMissingItems] = useState([]);
  const [serverError, setServerError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  const set = (key) => (e) => {
    setMissingItems([]);
    setServerError('');
    setFieldErrors((prev) => (prev[key] ? { ...prev, [key]: false } : prev));
    setForm((f) => ({ ...f, [key]: e.target.value }));
  };

  const precio = Number(form.precio);
  const costo = Number(form.costo);
  const hasMargin = form.precio !== '' && form.costo !== '' && !Number.isNaN(precio) && !Number.isNaN(costo);

  const validateAll = () => {
    const missing = [];
    const nextErrors = {};

    if (!form.nombre.trim()) {
      missing.push('Nombre del servicio');
      nextErrors.nombre = true;
    }
    if (!form.categoria) {
      missing.push('Categoría');
      nextErrors.categoria = true;
    }
    if (form.precio === '' || Number.isNaN(precio) || precio < 0) {
      missing.push('Precio de venta (mayor o igual a 0)');
      nextErrors.precio = true;
    }
    if (form.costo === '' || Number.isNaN(costo) || costo < 0) {
      missing.push('Costo (mayor o igual a 0)');
      nextErrors.costo = true;
    }

    return { valid: missing.length === 0, missing, nextErrors };
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const { valid, missing, nextErrors } = validateAll();
    if (!valid) {
      setFieldErrors(nextErrors);
      setMissingItems(missing);
      setServerError('');
      onNotify?.('error', {
        title: isEdit ? 'No se pudo actualizar el servicio' : 'No se pudo crear el servicio',
        message: 'Completa los siguientes campos obligatorios:',
        items: missing,
      });
      return;
    }

    setMissingItems([]);
    setServerError('');
    setFieldErrors({});
    setConfirmOpen(true);
  };

  const confirmSave = async () => {
    setSaving(true);
    try {
      await onSubmit({
        nombre_servicio: form.nombre.trim(),
        id_categoria_servicio: Number(form.categoria),
        precio_venta: precio,
        costo,
      });
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
        title={isEdit ? 'Editar servicio' : 'Nuevo servicio'}
        subtitle={isEdit ? 'Actualiza la información y tarifa del servicio' : 'Registra un nuevo servicio en el catálogo'}
        onClose={onClose}
        footer={
          <>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-sm font-bold bg-muted text-foreground hover:bg-muted/80 transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              form="service-form"
              disabled={saving}
              className="px-5 py-2 rounded-full text-sm font-black bg-primary text-white shadow-md shadow-primary/20 hover:opacity-90 active:scale-[0.98] disabled:opacity-60 transition-all flex items-center gap-2 cursor-pointer"
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              {isEdit ? 'Guardar cambios' : 'Crear servicio'}
            </button>
          </>
        }
      >
        <form id="service-form" onSubmit={handleSubmit} className="space-y-4" noValidate>
          <Field label="Nombre del servicio">
            <input
              type="text"
              value={form.nombre}
              onChange={set('nombre')}
              placeholder="Ej: Impresión Color A4"
              maxLength={100}
              autoFocus
              className={fieldClass(fieldErrors.nombre)}
            />
          </Field>

          <Field label="Categoría">
            <select value={form.categoria} onChange={set('categoria')} className={fieldClass(fieldErrors.categoria)}>
              <option value="">Selecciona una categoría</option>
              {categories.map((c) => (
                <option key={c.id_categoria_servicio} value={c.id_categoria_servicio}>
                  {c.nombre_categoria}
                </option>
              ))}
            </select>
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Precio de venta">
              <input
                type="number"
                min="0"
                step="1"
                inputMode="numeric"
                value={form.precio}
                onChange={set('precio')}
                placeholder="0"
                className={fieldClass(fieldErrors.precio)}
              />
            </Field>
            <Field label="Costo">
              <input
                type="number"
                min="0"
                step="1"
                inputMode="numeric"
                value={form.costo}
                onChange={set('costo')}
                placeholder="0"
                className={fieldClass(fieldErrors.costo)}
              />
            </Field>
          </div>

          {hasMargin && (
            <p
              className={`text-xs font-bold ${
                precio >= costo ? 'text-green-700 dark:text-green-300' : 'text-orange-700 dark:text-orange-300'
              }`}
            >
              {precio >= costo
                ? `Ganancia por servicio: ${formatCOP(precio - costo)}`
                : 'Atención: el costo es mayor que el precio de venta.'}
            </p>
          )}

          {(missingItems.length > 0 || serverError) && (
            <div
              role="alert"
              className="text-xs font-bold px-3.5 py-2.5 rounded-xl bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-300 border border-red-200 dark:border-red-800 space-y-1"
            >
              <div className="flex items-center gap-2 font-black">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{missingItems.length > 0 ? 'Faltan campos por completar:' : serverError}</span>
              </div>
              {missingItems.length > 0 && (
                <ul className="list-disc pl-9 space-y-0.5 font-semibold">
                  {missingItems.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </form>
      </Modal>

      {confirmOpen && (
        <ConfirmDialog
          variant="primary"
          title={isEdit ? '¿Guardar cambios del servicio?' : '¿Confirmar creación del servicio?'}
          message={
            isEdit
              ? `Se actualizará el servicio «${form.nombre.trim()}» con precio de venta ${formatCOP(precio)}.`
              : `Se creará el servicio «${form.nombre.trim()}» con precio de venta ${formatCOP(precio)}.`
          }
          confirmLabel="Confirmar"
          loading={saving}
          onConfirm={confirmSave}
          onClose={() => setConfirmOpen(false)}
        />
      )}
    </>
  );
}
