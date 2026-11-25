import { useState } from 'react';
import { AlertCircle, Loader2, Trash2 } from 'lucide-react';
import Modal from './Modal';
import ConfirmDialog from './ConfirmDialog';
import { formatLongDate } from '../utils/dates';

const baseInputClass =
  'w-full px-3.5 py-2.5 bg-input-background border rounded-xl text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-ring transition-all';

const fieldClass = (hasError) =>
  `${baseInputClass} ${hasError ? 'border-red-500 ring-1 ring-red-500/30' : 'border-border'}`;

export default function ScheduleFormModal({
  schedule, // turno existente (edición) o null
  defaults, // { userId, fecha } al crear desde una celda vacía
  users,
  schedules,
  onSubmit,
  onRequestDelete,
  onNotify,
  onClose,
}) {
  const isEdit = Boolean(schedule);
  const [userId, setUserId] = useState(String(schedule?.userId ?? defaults?.userId ?? ''));
  const [fecha, setFecha] = useState(schedule?.fecha ?? defaults?.fecha ?? '');
  const [saving, setSaving] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [missingItems, setMissingItems] = useState([]);
  const [serverError, setServerError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  // Solo empleados activos; en edición se conserva al empleado actual aunque esté inactivo.
  const options = users.filter((u) => u.estado || u.id_usuario === schedule?.userId);
  const selectedUser = options.find((u) => String(u.id_usuario) === String(userId));

  const validateAll = () => {
    const missing = [];
    const nextErrors = {};

    if (!userId) {
      missing.push('Empleado');
      nextErrors.userId = true;
    }
    if (!fecha) {
      missing.push('Fecha de trabajo');
      nextErrors.fecha = true;
    }
    if (
      userId &&
      fecha &&
      schedules.some((s) => String(s.userId) === String(userId) && s.fecha === fecha && s.id !== schedule?.id)
    ) {
      missing.push('Ese empleado ya tiene un turno asignado en esa fecha');
      nextErrors.userId = true;
      nextErrors.fecha = true;
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
        title: isEdit ? 'No se pudo actualizar el turno' : 'No se pudo asignar el turno',
        message: 'Revisa los siguientes datos:',
        items: missing,
      });
      return;
    }

    setFieldErrors({});
    setMissingItems([]);
    setServerError('');
    setConfirmOpen(true);
  };

  const confirmSave = async () => {
    setSaving(true);
    try {
      await onSubmit({ id_usuario: Number(userId), fecha_trabajo: fecha });
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
                className="mr-auto px-3.5 py-2 rounded-full font-bold text-white text-xs bg-destructive hover:opacity-90 transition-opacity flex items-center gap-1.5 cursor-pointer"
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
              className="px-5 py-2 rounded-full text-sm font-black bg-primary text-white shadow-md shadow-primary/20 hover:opacity-90 active:scale-[0.98] disabled:opacity-60 transition-all flex items-center gap-2 cursor-pointer"
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
            <select
              value={userId}
              onChange={(e) => {
                setMissingItems([]);
                setServerError('');
                setFieldErrors((prev) => ({ ...prev, userId: false }));
                setUserId(e.target.value);
              }}
              className={fieldClass(fieldErrors.userId)}
            >
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
            <input
              type="date"
              value={fecha}
              onChange={(e) => {
                setMissingItems([]);
                setServerError('');
                setFieldErrors((prev) => ({ ...prev, fecha: false }));
                setFecha(e.target.value);
              }}
              className={fieldClass(fieldErrors.fecha)}
            />
          </label>

          {(missingItems.length > 0 || serverError) && (
            <div
              role="alert"
              className="text-xs font-bold px-3.5 py-2.5 rounded-xl bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-300 border border-red-200 dark:border-red-800 space-y-1"
            >
              <div className="flex items-center gap-2 font-black">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{missingItems.length > 0 ? 'Revisa los siguientes datos:' : serverError}</span>
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
          title={isEdit ? '¿Guardar cambios del turno?' : '¿Confirmar asignación de turno?'}
          message={`Se ${isEdit ? 'actualizará' : 'asignará'} el turno de ${
            selectedUser ? `${selectedUser.nombre_usuario} ${selectedUser.apellido_usuario}` : 'empleado'
          } para el ${fecha ? formatLongDate(fecha) : ''}.`}
          confirmLabel="Confirmar"
          loading={saving}
          onConfirm={confirmSave}
          onClose={() => setConfirmOpen(false)}
        />
      )}
    </>
  );
}
