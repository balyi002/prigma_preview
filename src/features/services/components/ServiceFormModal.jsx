import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import Modal from './Modal';
import { formatCOP } from '../utils/format';

const inputClass =
  'w-full px-3.5 py-2.5 bg-input-background border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-ring transition-all';

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

const EMPTY = { nombre: '', categoria: '', precio: '', costo: '', duracion: '0' };

const fromService = (s) => ({
  nombre: s.nombre_servicio,
  categoria: String(s.id_categoria_servicio),
  precio: String(s.precio_venta),
  costo: String(s.costo),
  duracion: String(s.duracion_minutos),
});

export default function ServiceFormModal({ service, categories, onSubmit, onClose }) {
  const isEdit = Boolean(service);
  const [form, setForm] = useState(() => (service ? fromService(service) : EMPTY));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const precio = Number(form.precio);
  const costo = Number(form.costo);
  const hasMargin = form.precio !== '' && form.costo !== '' && !Number.isNaN(precio) && !Number.isNaN(costo);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.nombre.trim()) return setError('Ingresa el nombre del servicio.');
    if (!form.categoria) return setError('Selecciona una categoría.');
    if (form.precio === '' || !(precio >= 0)) return setError('Ingresa un precio de venta válido.');
    if (form.costo === '' || !(costo >= 0)) return setError('Ingresa un costo válido.');
    const duracion = Number(form.duracion);
    if (!Number.isInteger(duracion) || duracion < 0) {
      return setError('El tiempo debe ser un número entero de minutos (0 = inmediato).');
    }

    setSaving(true);
    setError('');
    try {
      await onSubmit({
        nombre_servicio: form.nombre.trim(),
        id_categoria_servicio: Number(form.categoria),
        precio_venta: precio,
        costo,
        duracion_minutos: duracion,
      });
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  };

  return (
    <Modal
      title={isEdit ? 'Editar servicio' : 'Nuevo servicio'}
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
            className="px-4 py-2 rounded-xl text-sm font-black bg-primary text-white shadow-md shadow-primary/20 hover:opacity-90 active:scale-[0.98] disabled:opacity-60 transition-all flex items-center gap-2 cursor-pointer"
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
            className={inputClass}
          />
        </Field>

        <Field label="Categoría">
          <select value={form.categoria} onChange={set('categoria')} className={inputClass}>
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
              className={inputClass}
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
              className={inputClass}
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

        <Field label="Tiempo (minutos)" hint="Usa 0 para servicios inmediatos, como las recargas.">
          <input
            type="number"
            min="0"
            step="1"
            inputMode="numeric"
            value={form.duracion}
            onChange={set('duracion')}
            className={inputClass}
          />
        </Field>

        {error && (
          <p
            role="alert"
            className="text-xs font-bold px-3 py-2 rounded-xl bg-red-100 text-red-600 dark:bg-red-950/50 dark:text-red-300 border border-red-200 dark:border-red-800"
          >
            {error}
          </p>
        )}
      </form>
    </Modal>
  );
}
