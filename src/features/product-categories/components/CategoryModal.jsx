import React, { useState, useEffect } from 'react';
import Modal from '../../../components/ui/Modal';

export default function CategoryModal({
  open,
  onClose,
  onSave,
  category = null,
  loading = false
}) {
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      if (category) {
        setNombre(category.nombre_categoria || '');
        setDescripcion(category.descripcion || '');
      } else {
        setNombre('');
        setDescripcion('');
      }
      setError('');
    }
  }, [open, category]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!nombre.trim()) {
      setError('El nombre de la categoría es obligatorio.');
      return;
    }

    onSave({
      nombre_categoria: nombre.trim(),
      descripcion: descripcion.trim() || null
    });
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={category ? `Editar Categoría — ${category.nombre_categoria}` : 'Nueva Categoría de Productos'}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-300 text-xs font-bold rounded-xl p-3">
            {error}
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
            }}
            placeholder="Ej: Papelería, Cosméticos, Accesorios..."
            maxLength={100}
            required
            className="w-full px-3.5 py-2.5 bg-input-background border border-border rounded-xl text-sm font-medium text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-ring transition-all"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold text-foreground block">
            Descripción
          </label>
          <textarea
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            placeholder="Ej: Cuadernos, bolígrafos, lápices y resmas..."
            rows={3}
            maxLength={255}
            className="w-full px-3.5 py-2.5 bg-input-background border border-border rounded-xl text-sm font-medium text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-ring transition-all resize-none"
          />
        </div>

        <div className="flex justify-end gap-3 pt-3 border-t border-border">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl font-bold text-foreground text-sm bg-muted hover:bg-muted/80 transition-colors cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2.5 rounded-xl font-black text-white text-sm bg-primary hover:opacity-90 active:scale-[0.98] transition-all shadow-md shadow-primary/20 cursor-pointer disabled:opacity-50"
          >
            {loading ? 'Guardando...' : category ? 'Actualizar' : 'Crear'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
