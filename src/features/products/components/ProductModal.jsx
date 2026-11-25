import React, { useState, useEffect, useRef } from 'react';
import { AlertCircle, ImagePlus, Link2, Package, Trash2, Upload } from 'lucide-react';
import Modal from '../../../components/ui/Modal';
import ToggleSwitch from '../../../components/ui/ToggleSwitch';
import ActionConfirmDialog from '../../../components/ui/ActionConfirmDialog';
import { formatCOP } from '../../../utils/format';

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5 MB

const baseInputClass =
  'w-full px-3.5 py-2.5 bg-input-background border rounded-xl text-sm font-medium text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-ring transition-all';

const fieldClass = (hasError, extra = '') =>
  `${baseInputClass} ${extra} ${hasError ? 'border-red-500 ring-1 ring-red-500/30' : 'border-border'}`;

export default function ProductModal({
  open,
  onClose,
  onSave,
  onNotify,
  product = null,
  categories = [],
  loading = false
}) {
  const isEdit = Boolean(product);
  const fileInputRef = useRef(null);

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
  const [imageFile, setImageFile] = useState(null);
  const [localPreviewUrl, setLocalPreviewUrl] = useState('');
  const [previewError, setPreviewError] = useState(false);

  const [missingItems, setMissingItems] = useState([]);
  const [serverError, setServerError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingPayload, setPendingPayload] = useState(null);

  useEffect(() => {
    if (open) {
      if (product) {
        setFormData({
          nombre_producto: product.nombre_producto || '',
          id_categoria_producto: product.id_categoria_producto || (categories[0]?.id_categoria_producto || ''),
          precio_venta: product.precio_venta ?? '',
          costo: product.costo ?? '',
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
      setImageFile(null);
      setLocalPreviewUrl('');
      setPreviewError(false);
      setMissingItems([]);
      setServerError('');
      setFieldErrors({});
      setConfirmOpen(false);
      setPendingPayload(null);
    }
  }, [open, product, categories]);

  useEffect(() => {
    return () => {
      if (localPreviewUrl) URL.revokeObjectURL(localPreviewUrl);
    };
  }, [localPreviewUrl]);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setMissingItems([]);
    setServerError('');
    setFieldErrors((prev) => (prev[field] ? { ...prev, [field]: false } : prev));
    if (field === 'imagen') {
      if (localPreviewUrl) {
        URL.revokeObjectURL(localPreviewUrl);
        setLocalPreviewUrl('');
      }
      setImageFile(null);
      setPreviewError(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    if (!ALLOWED_IMAGE_TYPES.includes(file.type.toLowerCase())) {
      const msg = 'Formato de imagen no válido. Selecciona un archivo JPG, PNG, WEBP o GIF.';
      setServerError(msg);
      onNotify?.('error', { title: 'Formato no compatible', message: msg });
      return;
    }

    if (file.size > MAX_IMAGE_SIZE) {
      const msg = 'La imagen supera el tamaño máximo permitido de 5 MB.';
      setServerError(msg);
      onNotify?.('error', { title: 'Imagen demasiado pesada', message: msg });
      return;
    }

    if (localPreviewUrl) URL.revokeObjectURL(localPreviewUrl);
    const objectUrl = URL.createObjectURL(file);
    setImageFile(file);
    setLocalPreviewUrl(objectUrl);
    setPreviewError(false);
    setServerError('');
    setMissingItems([]);
    setFieldErrors((prev) => (prev.imagen ? { ...prev, imagen: false } : prev));
  };

  const handleClearImage = () => {
    if (localPreviewUrl) URL.revokeObjectURL(localPreviewUrl);
    setLocalPreviewUrl('');
    setImageFile(null);
    setPreviewError(false);
    setFormData((prev) => ({ ...prev, imagen: '' }));
  };

  const validateAll = () => {
    const missing = [];
    const nextErrors = {};

    if (!formData.nombre_producto.trim()) {
      missing.push('Nombre del producto');
      nextErrors.nombre_producto = true;
    }

    if (!formData.id_categoria_producto) {
      missing.push('Categoría del producto');
      nextErrors.id_categoria_producto = true;
    }

    const precioVenta = Number(formData.precio_venta);
    if (formData.precio_venta === '' || Number.isNaN(precioVenta) || precioVenta < 0) {
      missing.push('Precio de venta válido (mayor o igual a 0)');
      nextErrors.precio_venta = true;
    }

    const costo = Number(formData.costo);
    if (formData.costo === '' || Number.isNaN(costo) || costo < 0) {
      missing.push('Costo unitario válido (mayor o igual a 0)');
      nextErrors.costo = true;
    }

    const stock = Number(formData.stock);
    if (formData.stock === '' || Number.isNaN(stock) || stock < 0 || !Number.isInteger(stock)) {
      missing.push('Stock válido (entero mayor o igual a 0)');
      nextErrors.stock = true;
    }

    const stockMinimo = Number(formData.stock_minimo);
    if (formData.stock_minimo === '' || Number.isNaN(stockMinimo) || stockMinimo < 0 || !Number.isInteger(stockMinimo)) {
      missing.push('Stock mínimo válido (entero mayor o igual a 0)');
      nextErrors.stock_minimo = true;
    }

    if (!imageFile && formData.imagen.trim().length > 255) {
      missing.push('URL de imagen de máximo 255 caracteres (o sube el archivo directamente)');
      nextErrors.imagen = true;
    }

    return {
      valid: missing.length === 0,
      missing,
      nextErrors,
      payload: {
        nombre_producto: formData.nombre_producto.trim(),
        id_categoria_producto: parseInt(formData.id_categoria_producto, 10),
        precio_venta: precioVenta,
        costo,
        stock: parseInt(formData.stock, 10) || 0,
        stock_minimo: parseInt(formData.stock_minimo, 10) || 0,
        imagen: formData.imagen.trim() || null,
        estado: formData.estado
      }
    };
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const { valid, missing, nextErrors, payload } = validateAll();

    if (!valid) {
      setFieldErrors(nextErrors);
      setMissingItems(missing);
      setServerError('');
      onNotify?.('error', {
        title: isEdit ? 'No se pudo actualizar el producto' : 'No se pudo crear el producto',
        message: 'Revisa los siguientes campos:',
        items: missing
      });
      return;
    }

    setMissingItems([]);
    setServerError('');
    setFieldErrors({});
    setPendingPayload(payload);
    setConfirmOpen(true);
  };

  const handleConfirmSave = async () => {
    if (!pendingPayload) return;
    try {
      await onSave(pendingPayload, imageFile);
      setConfirmOpen(false);
    } catch (err) {
      setConfirmOpen(false);
      const message = err.response?.data?.error || err.message || 'Error al guardar el producto.';
      setServerError(message);
      onNotify?.('error', { title: 'Error al guardar producto', message });
    }
  };

  const activePreview = localPreviewUrl || formData.imagen.trim();

  return (
    <>
      <Modal
        open={open}
        onClose={() => !loading && onClose()}
        title={isEdit ? `Editar Producto — ${product.nombre_producto}` : 'Nuevo Producto'}
      >
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          {(missingItems.length > 0 || serverError) && (
            <div
              role="alert"
              className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-300 text-xs font-bold rounded-xl p-3 space-y-1"
            >
              <div className="flex items-center gap-2 font-black">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{missingItems.length > 0 ? 'Completa los campos obligatorios:' : serverError}</span>
              </div>
              {missingItems.length > 0 && (
                <ul className="list-disc pl-8 space-y-0.5 font-semibold">
                  {missingItems.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {/* Imagen del Producto */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-foreground block">
              Imagen del Producto
            </label>
            <div className="p-3.5 rounded-xl bg-input-background border border-border space-y-3">
              <div className="flex items-center gap-3.5">
                <div className="w-16 h-16 rounded-xl overflow-hidden bg-card border border-border flex items-center justify-center flex-shrink-0 shadow-2xs">
                  {activePreview && !previewError ? (
                    <img
                      src={activePreview}
                      alt="Vista previa del producto"
                      className="w-full h-full object-cover"
                      onError={() => setPreviewError(true)}
                    />
                  ) : (
                    <Package className="w-6 h-6 text-muted-foreground" />
                  )}
                </div>

                <div className="flex-1 min-w-0 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3 py-1.5 rounded-lg text-xs font-bold bg-secondary text-secondary-foreground hover:opacity-90 transition-opacity flex items-center gap-1.5 cursor-pointer"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>{imageFile || activePreview ? 'Cambiar imagen' : 'Subir imagen'}</span>
                    </button>

                    {(imageFile || activePreview) && (
                      <button
                        type="button"
                        onClick={handleClearImage}
                        className="px-2.5 py-1.5 rounded-lg text-xs font-bold text-destructive hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Quitar</span>
                      </button>
                    )}
                  </div>

                  <p className="text-[11px] text-muted-foreground truncate">
                    {imageFile
                      ? `Archivo seleccionado: ${imageFile.name}`
                      : activePreview
                        ? previewError
                          ? 'No se pudo cargar la vista previa de esta URL.'
                          : 'Imagen configurada para este producto.'
                        : 'JPG, PNG, WEBP o GIF (máx. 5 MB) o pega una URL.'}
                  </p>
                </div>
              </div>

              <div className="relative">
                <Link2 className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="url"
                  value={imageFile ? '' : formData.imagen}
                  onChange={(e) => handleChange('imagen', e.target.value)}
                  placeholder={imageFile ? 'Se usará el archivo seleccionado arriba' : 'O pega la URL de la imagen (https://...)'}
                  disabled={Boolean(imageFile)}
                  maxLength={255}
                  className={fieldClass(
                    fieldErrors.imagen,
                    'pl-8.5 py-2 text-xs font-mono disabled:opacity-60 disabled:cursor-not-allowed'
                  )}
                />
              </div>
            </div>
          </div>

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
              className={fieldClass(fieldErrors.nombre_producto)}
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
              className={fieldClass(fieldErrors.id_categoria_producto)}
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
                className={fieldClass(fieldErrors.precio_venta, 'font-mono')}
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
                className={fieldClass(fieldErrors.costo, 'font-mono')}
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
                className={fieldClass(fieldErrors.stock, 'font-mono')}
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
                className={fieldClass(fieldErrors.stock_minimo, 'font-mono')}
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
              disabled={loading}
              className="px-4 py-2.5 rounded-xl font-bold text-foreground text-sm bg-muted hover:bg-muted/80 disabled:opacity-50 transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 rounded-xl font-black text-white text-sm bg-primary hover:opacity-90 active:scale-[0.98] transition-all shadow-md shadow-primary/20 cursor-pointer disabled:opacity-50 flex items-center gap-2"
            >
              <ImagePlus className="w-4 h-4" />
              <span>{loading ? 'Guardando...' : isEdit ? 'Actualizar Producto' : 'Crear Producto'}</span>
            </button>
          </div>
        </form>
      </Modal>

      {confirmOpen && pendingPayload && (
        <ActionConfirmDialog
          variant="primary"
          title={isEdit ? '¿Guardar cambios del producto?' : '¿Confirmar creación del producto?'}
          message={
            isEdit
              ? `¿Estás seguro de que deseas actualizar el producto «${pendingPayload.nombre_producto}» con precio de venta ${formatCOP(pendingPayload.precio_venta)}?`
              : `¿Estás seguro de que deseas crear el producto «${pendingPayload.nombre_producto}» con precio de venta ${formatCOP(pendingPayload.precio_venta)}?`
          }
          confirmLabel={isEdit ? 'Actualizar' : 'Crear Producto'}
          loading={loading}
          onConfirm={handleConfirmSave}
          onClose={() => !loading && setConfirmOpen(false)}
        />
      )}
    </>
  );
}
