import React, { useState, useEffect } from 'react';
import Modal from '../../../components/ui/Modal';
import ToggleSwitch from '../../../components/ui/ToggleSwitch';

export default function ProductModal({
  open,
  onClose,
  onSave,
  product = null,
  categories = [],
  loading = false
}) {
  const [formData, setFormData] = useState({
    nombre_producto: '',
    id_categoria_producto: '',
    precio_venta: '',
    costo: '',
    stock: 0,
    stock_minimo: 5,
    imagen: '',
    estado: true
  });
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      if (product) {
        setFormData({
          nombre_producto: product.nombre_producto || '',
          id_categoria_producto: product.id_categoria_producto || (categories[0]?.id_categoria_producto || ''),
          precio_venta: product.precio_venta || '',
          costo: product.costo || '',
          stock: product.stock ?? 0,
          stock_minimo: product.stock_minimo ?? 5,
          imagen: product.imagen || '',
          estado: product.estado !== 0 && product.estado !== false
        });
      } else {
        setFormData({
          nombre_producto: '',
          id_categoria_producto: categories[0]?.id_categoria_producto || '',
          precio_venta: '',
          costo: '',
          stock: 0,
          stock_minimo: 5,
          imagen: '',
          estado: true
        });
      }
      setError('');
    }
  }, [open, product, categories]);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setError('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!formData.nombre_producto.trim()) {
      setError('El nombre del producto es obligatorio.');
      return;
    }

    if (!formData.id_categoria_producto) {
      setError('Debes seleccionar una categoría de producto.');
      return;
    }

    const precioVenta = parseFloat(formData.precio_venta);
    const costo = parseFloat(formData.costo);

    if (isNaN(precioVenta) || precioVenta < 0) {
      setError('El precio de venta debe ser un número válido mayor o igual a 0.');
      return;
    }

    if (isNaN(costo) || costo < 0) {
      setError('El costo debe ser un número válido mayor o igual a 0.');
      return;
    }

    onSave({
      nombre_producto: formData.nombre_producto.trim(),
      id_categoria_producto: parseInt(formData.id_categoria_producto, 10),
      precio_venta: precioVenta,
      costo: costo,
      stock: parseInt(formData.stock, 10) || 0,
      stock_minimo: parseInt(formData.stock_minimo, 10) || 0,
      imagen: formData.imagen.trim() || null,
      estado: formData.estado
    });
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={product ? `Editar Producto — ${product.nombre_producto}` : 'Nuevo Producto'}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-300 text-xs font-bold rounded-xl p-3">
            {error}
          </div>
        )}

        {/* Nombre del Producto */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-foreground block">
            Nombre del Producto <span className="text-primary">*</span>
          </label>
          <input
            type="text"
            value={formData.nombre_producto}
            onChange={(e) => handleChange('nombre_producto', e.target.value)}
            placeholder="Ej: Cuaderno Rayado A4"
            maxLength={100}
            required
            className="w-full px-3.5 py-2.5 bg-input-background border border-border rounded-xl text-sm font-medium text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-ring transition-all"
          />
        </div>

        {/* Categoría */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-foreground block">
            Categoría <span className="text-primary">*</span>
          </label>
          <select
            value={formData.id_categoria_producto}
            onChange={(e) => handleChange('id_categoria_producto', e.target.value)}
            required
            className="w-full px-3.5 py-2.5 bg-input-background border border-border rounded-xl text-sm font-medium text-foreground outline-none focus:ring-2 focus:ring-ring transition-all"
          >
            <option value="" disabled>Selecciona una categoría...</option>
            {categories.map((c) => (
              <option key={c.id_categoria_producto} value={c.id_categoria_producto}>
                {c.nombre_categoria}
              </option>
            ))}
          </select>
        </div>

        {/* Precios: Venta y Costo */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-foreground block">
              Precio de Venta (COP) <span className="text-primary">*</span>
            </label>
            <input
              type="number"
              min="0"
              step="100"
              value={formData.precio_venta}
              onChange={(e) => handleChange('precio_venta', e.target.value)}
              placeholder="Ej: 8500"
              required
              className="w-full px-3.5 py-2.5 bg-input-background border border-border rounded-xl text-sm font-mono text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-ring transition-all"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-foreground block">
              Costo Unitario (COP) <span className="text-primary">*</span>
            </label>
            <input
              type="number"
              min="0"
              step="100"
              value={formData.costo}
              onChange={(e) => handleChange('costo', e.target.value)}
              placeholder="Ej: 5000"
              required
              className="w-full px-3.5 py-2.5 bg-input-background border border-border rounded-xl text-sm font-mono text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-ring transition-all"
            />
          </div>
        </div>

        {/* Stocks: Actual y Mínimo */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-foreground block">
              Stock Inicial / Actual
            </label>
            <input
              type="number"
              min="0"
              value={formData.stock}
              onChange={(e) => handleChange('stock', e.target.value)}
              placeholder="0"
              className="w-full px-3.5 py-2.5 bg-input-background border border-border rounded-xl text-sm font-mono text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-ring transition-all"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-foreground block">
              Stock Mínimo de Alerta
            </label>
            <input
              type="number"
              min="0"
              value={formData.stock_minimo}
              onChange={(e) => handleChange('stock_minimo', e.target.value)}
              placeholder="5"
              className="w-full px-3.5 py-2.5 bg-input-background border border-border rounded-xl text-sm font-mono text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-ring transition-all"
            />
          </div>
        </div>

        {/* Switch Estado */}
        <div className="flex items-center justify-between p-3 rounded-xl bg-input-background border border-border">
          <div>
            <p className="text-xs font-bold text-foreground">Estado del Producto</p>
            <p className="text-[11px] text-muted-foreground">
              {formData.estado ? 'Activo y disponible para ventas' : 'Inactivo en el inventario'}
            </p>
          </div>
          <ToggleSwitch
            checked={formData.estado}
            onChange={(val) => handleChange('estado', val)}
          />
        </div>

        {/* Botones de Acción */}
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
            {loading ? 'Guardando...' : product ? 'Actualizar Producto' : 'Crear Producto'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
