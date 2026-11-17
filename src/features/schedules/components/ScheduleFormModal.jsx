import { useState } from 'react';
import { Loader2, Trash2 } from 'lucide-react';
import Modal from './Modal';
import { formatLongDate } from '../utils/dates';

const inputClass =
  'w-full px-3.5 py-2.5 bg-input-background border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-ring transition-all';

export default function ScheduleFormModal({
  schedule, // turno existente (edición) o null
  defaults, // { userId, fecha } al crear desde una celda vacía
  users,
  schedules,
  onSubmit,
  onRequestDelete,
  onClose,
}) {
  const isEdit = Boolean(schedule);
  const [userId, setUserId] = useState(String(schedule?.userId ?? defaults?.userId ?? ''));
  const [fecha, setFecha] = useState(schedule?.fecha ?? defaults?.fecha ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Solo empleados activos; en edición se conserva al empleado actual aunque esté inactivo.
  const options = users.filter((u) => u.estado || u.id_usuario === schedule?.userId);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!userId) return setError('Selecciona un empleado.');
    if (!fecha) return setError('Selecciona la fecha de trabajo.');

    const duplicated = schedules.some(
      (s) => String(s.userId) === userId && s.fecha === fecha && s.id !== schedule?.id
    );
    if (duplicated) return setError('Ese empleado ya tiene un turno asignado en esa fecha.');

    setSaving(true);
    setError('');
    try {
      await onSubmit({ id_usuario: Number(userId), fecha_trabajo: fecha });
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  };

  return (
    <Modal
      title={isEdit ? 'Editar turno' : 'Asignar turno'}
      subtitle={isEdit ? formatLongDate(schedule.fecha) : 'Registra el día en que trabaja el empleado'}
      size="md"
      onClose={onClose}
      footer={
        <>
          {isEdit && (
            <button
              type="button"
              onClick={() => onRequestDelete(schedule)}
              className="mr-auto px-3 py-2 rounded-xl font-bold text-white text-xs bg-destructive hover:opacity-90 transition-opacity flex items-center gap-1.5 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Eliminar
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-sm font-bold bg-muted text-foreground hover:bg-muted/80 transition-colors cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="submit"
            form="schedule-form"
            disabled={saving}
            className="px-4 py-2 rounded-xl text-sm font-black bg-primary text-white shadow-md shadow-primary/20 hover:opacity-90 active:scale-[0.98] disabled:opacity-60 transition-all flex items-center gap-2 cursor-pointer"
          >
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            {isEdit ? 'Guardar cambios' : 'Asignar turno'}
          </button>
        </>
      }
    >
      <form id="schedule-form" onSubmit={handleSubmit} className="space-y-4" noValidate>
        <label className="block space-y-1.5">
          <span className="text-xs font-bold text-foreground block">
            Empleado <span className="text-primary">*</span>
          </span>
          <select value={userId} onChange={(e) => setUserId(e.target.value)} className={inputClass}>
            <option value="">Selecciona un empleado</option>
            {options.map((u) => (
              <option key={u.id_usuario} value={u.id_usuario}>
                {u.nombre_usuario} {u.apellido_usuario} — {u.nombre_rol}
              </option>
            ))}
          </select>
        </label>

        <label className="block space-y-1.5">
          <span className="text-xs font-bold text-foreground block">
            Fecha de trabajo <span className="text-primary">*</span>
          </span>
          <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} className={inputClass} />
        </label>

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
