import React, { useState, useEffect } from 'react';
import { AlertCircle } from 'lucide-react';
import Modal from '../../../components/ui/Modal';
import ToggleSwitch from '../../../components/ui/ToggleSwitch';
import ActionConfirmDialog from '../../../components/ui/ActionConfirmDialog';

const baseInputClass =
  'w-full px-3.5 py-2.5 bg-input-background border rounded-xl text-sm font-medium text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-ring transition-all';

export default function ServiceCategoryModal({
  open,
  onClose,
  onSave,
  onNotify,
  category = null,
  loading = false
}) {
  const isEdit = Boolean(category);
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [estado, setEstado] = useState(true);
  const [error, setError] = useState('');
  const [nameError, setNameError] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingPayload, setPendingPayload] = useState(null);

  useEffect(() => {
    if (open) {
      if (category) {
        setNombre(category.nombre_categoria || '');
        setDescripcion(category.descripcion || '');
        setEstado(category.estado !== 0 && category.estado !== false);
      } else {
        setNombre('');
        setDescripcion('');
        setEstado(true);
      }
      setError('');
      setNameError(false);
      setConfirmOpen(false);
      setPendingPayload(null);
    }
  }, [open, category]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!nombre.trim()) {
      const msg = 'El nombre de la categoría es obligatorio.';
      setError(msg);
      setNameError(true);
      onNotify?.('error', {
        title: isEdit ? 'No se pudo actualizar la categoría' : 'No se pudo crear la categoría',
        message: 'Completa los campos obligatorios:',
        items: ['Nombre de la categoría']
      });
      return;
    }

    setError('');
    setNameError(false);
    setPendingPayload({
      nombre_categoria: nombre.trim(),
      descripcion: descripcion.trim() || null,
      estado
    });
    setConfirmOpen(true);
  };

  const handleConfirmSave = async () => {
    if (!pendingPayload) return;
    try {
      await onSave(pendingPayload);
      setConfirmOpen(false);
    } catch (err) {
      setConfirmOpen(false);
      const message = err.response?.data?.error || err.message || 'Error al guardar la categoría.';
      setError(message);
      onNotify?.('error', { title: 'Error al guardar categoría', message });
    }
  };

  return (
    <>
      <Modal
        open={open}
        onClose={() => !loading && onClose()}
        title={isEdit ? `Editar Categoría — ${category.nombre_categoria}` : 'Nueva Categoría de Servicios'}
      >
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          {error && (
            <div
              role="alert"
              className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-300 text-xs font-bold rounded-xl p-3 flex items-center gap-2"
            >
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-foreground block">
              Nombre de la Categoría <span className="text-primary">*</span>
            </label>
            <input
              type="text"
              value={nombre}
              onChange={(e) => {
                setNombre(e.target.value);
                setError('');
                setNameError(false);
              }}
              placeholder="Ej: Impresión, Recargas, Digital, Mensajería..."
              maxLength={100}
              required
              className={`${baseInputClass} ${
                nameError ? 'border-red-500 ring-1 ring-red-500/30' : 'border-border'
              }`}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-foreground block">
              Descripción del Servicio
            </label>
            <textarea
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              placeholder="Ej: Fotocopias, impresiones y plastificado..."
              rows={3}
              maxLength={255}
              className={`${baseInputClass} border-border resize-none`}
            />
          </div>

          <div className="flex items-center justify-between p-3 rounded-xl bg-input-background border border-border">
            <div>
              <p className="text-xs font-bold text-foreground">Estado de la Categoría</p>
              <p className="text-[11px] text-muted-foreground">
                {estado ? 'Disponible para registrar nuevos servicios' : 'Inactiva temporalmente'}
              </p>
            </div>
            <ToggleSwitch checked={estado} onChange={setEstado} />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-border">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2.5 rounded-xl font-bold text-foreground text-sm bg-muted hover:bg-muted/80 disabled:opacity-50 transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 rounded-xl font-black text-white text-sm bg-primary hover:opacity-90 active:scale-[0.98] transition-all shadow-md shadow-primary/20 cursor-pointer disabled:opacity-50"
            >
              {loading ? 'Guardando...' : isEdit ? 'Actualizar' : 'Crear'}
            </button>
          </div>
        </form>
      </Modal>

      {confirmOpen && pendingPayload && (
        <ActionConfirmDialog
          variant="primary"
          title={isEdit ? '¿Guardar cambios de la categoría?' : '¿Confirmar creación de categoría?'}
          message={
            isEdit
              ? `¿Estás seguro de que deseas actualizar la categoría de servicio «${pendingPayload.nombre_categoria}»?`
              : `¿Estás seguro de que deseas crear la categoría de servicio «${pendingPayload.nombre_categoria}»?`
          }
          confirmLabel={isEdit ? 'Actualizar' : 'Crear'}
          loading={loading}
          onConfirm={handleConfirmSave}
          onClose={() => !loading && setConfirmOpen(false)}
        />
      )}
    </>
  );
}
