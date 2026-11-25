import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Plus, Download, Package, AlertCircle } from 'lucide-react';
import { productService } from '../services/productService';
import ProductModal from '../components/ProductModal';
import ProductsTable from '../components/ProductsTable';
import ProductFilters from '../components/ProductFilters';
import ActionConfirmDialog from '../../../components/ui/ActionConfirmDialog';
import FeedbackToast from '../../../components/ui/FeedbackToast';
import Pagination from '../../../components/ui/Pagination';

const ITEMS_PER_PAGE = 5;

const getProductCode = (id) => `P${String(id).padStart(3, '0')}`;

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  // Estados de filtros
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [stockFilter, setStockFilter] = useState('');
  const [page, setPage] = useState(1);

  // Estados de modales, confirmaciones y notificaciones
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [confirmState, setConfirmState] = useState(null);
  const [confirmBusy, setConfirmBusy] = useState(false);
  const [toast, setToast] = useState(null);

  const closeToast = useCallback(() => setToast(null), []);
  const notify = useCallback((type, payload) => {
    if (typeof payload === 'string') {
      setToast({ type, message: payload });
    } else {
      setToast({ type, ...payload });
    }
  }, []);

  // Cargar catálogo de productos y categorías desde la base de datos
  const loadData = async () => {
    try {
      setLoading(true);
      setErrorMsg('');
      const [prodsData, catsData] = await Promise.all([
        productService.getProducts(),
        productService.getCategories()
      ]);
      setProducts(prodsData || []);
      setCategories(catsData || []);
    } catch (err) {
      console.error('Error cargando productos:', err);
      const message = 'No se pudo conectar con el servidor para obtener los productos.';
      setErrorMsg(message);
      notify('error', { title: 'Error de conexión', message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filtrado reactivo en memoria
  const filteredProducts = useMemo(() => {
    const q = search.trim().toLowerCase();
    return products.filter((p) => {
      const code = getProductCode(p.id_producto).toLowerCase();
      const matchQuery =
        !q ||
        p.nombre_producto.toLowerCase().includes(q) ||
        (p.nombre_categoria && p.nombre_categoria.toLowerCase().includes(q)) ||
        code.includes(q);

      const matchCategory =
        !categoryFilter || String(p.id_categoria_producto) === String(categoryFilter);

      let matchStock = true;
      const s = Number(p.stock) || 0;
      const min = Number(p.stock_minimo) || 0;
      if (stockFilter === 'optimo') {
        matchStock = s > min;
      } else if (stockFilter === 'critico') {
        matchStock = s > 0 && s <= min;
      } else if (stockFilter === 'agotado') {
        matchStock = s <= 0;
      }

      return matchQuery && matchCategory && matchStock;
    });
  }, [products, search, categoryFilter, stockFilter]);

  // Paginación
  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / ITEMS_PER_PAGE));
  const pagedProducts = useMemo(() => {
    const start = (page - 1) * ITEMS_PER_PAGE;
    return filteredProducts.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredProducts, page]);

  useEffect(() => {
    setPage(1);
  }, [search, categoryFilter, stockFilter]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  // Handlers de creación y edición
  const handleOpenCreate = () => {
    setEditingProduct(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (prod) => {
    setEditingProduct(prod);
    setModalOpen(true);
  };

  const handleSave = async (formData, imageFile) => {
    try {
      setModalLoading(true);
      let imageUrl = formData.imagen;

      if (imageFile) {
        imageUrl = await productService.uploadProductImage(imageFile);
      }

      const payload = {
        ...formData,
        imagen: imageUrl || null
      };

      if (editingProduct) {
        const prevEstado = editingProduct.estado !== 0 && editingProduct.estado !== false;
        await productService.updateProduct(editingProduct.id_producto, payload);
        if (prevEstado !== payload.estado) {
          await productService.updateProductStatus(editingProduct.id_producto, payload.estado);
        }
        notify('success', `Producto «${payload.nombre_producto}» actualizado correctamente.`);
      } else {
        const created = await productService.createProduct(payload);
        if (payload.estado === false && created?.id) {
          await productService.updateProductStatus(created.id, false);
        }
        notify('success', `Producto «${payload.nombre_producto}» creado correctamente.`);
      }

      setModalOpen(false);
      setEditingProduct(null);
      await loadData();
    } catch (err) {
      console.error('Error guardando producto:', err);
      throw err;
    } finally {
      setModalLoading(false);
    }
  };

  // Confirmar y alternar estado activo / inactivo
  const handleToggleStatus = (prod) => {
    const isActivo = prod.estado === 1 || prod.estado === true;
    const newStatus = !isActivo;
    const code = getProductCode(prod.id_producto);

    setConfirmState({
      variant: 'warning',
      title: `¿${isActivo ? 'Desactivar' : 'Activar'} producto ${code}?`,
      message: `¿Estás seguro de que deseas ${isActivo ? 'desactivar' : 'activar'} «${prod.nombre_producto}»? ${
        isActivo
          ? 'Dejará de estar disponible para nuevas ventas.'
          : 'Volverá a estar disponible en el catálogo de ventas.'
      }`,
      confirmLabel: isActivo ? 'Desactivar' : 'Activar',
      onConfirm: async () => {
        setConfirmBusy(true);
        try {
          await productService.updateProductStatus(prod.id_producto, newStatus);
          setProducts((prev) =>
            prev.map((item) =>
              item.id_producto === prod.id_producto
                ? { ...item, estado: newStatus ? 1 : 0 }
                : item
            )
          );
          setConfirmState(null);
          notify('success', `Producto «${prod.nombre_producto}» ${newStatus ? 'activado' : 'desactivado'} correctamente.`);
        } catch (err) {
          console.error('Error actualizando estado del producto:', err);
          setConfirmState(null);
          notify('error', {
            title: 'No se pudo actualizar el estado',
            message: err.response?.data?.error || 'Error al actualizar el estado del producto.'
          });
        } finally {
          setConfirmBusy(false);
        }
      }
    });
  };

  // Confirmar y eliminar producto
  const handleDelete = (prod) => {
    const code = getProductCode(prod.id_producto);
    setConfirmState({
      variant: 'danger',
      title: `¿Eliminar producto ${code}?`,
      message: `¿Estás seguro de que deseas eliminar permanentemente «${prod.nombre_producto}»? Esta acción no se puede deshacer.`,
      confirmLabel: 'Eliminar Producto',
      onConfirm: async () => {
        setConfirmBusy(true);
        try {
          await productService.deleteProduct(prod.id_producto);
          setConfirmState(null);
          notify('success', `Producto «${prod.nombre_producto}» eliminado correctamente.`);
          await loadData();
        } catch (err) {
          console.error('Error eliminando producto:', err);
          setConfirmState(null);
          notify('error', {
            title: 'No se pudo eliminar el producto',
            message: err.response?.data?.error || err.message || 'El producto tiene movimientos asociados.'
          });
        } finally {
          setConfirmBusy(false);
        }
      }
    });
  };

  // Exportar listado a CSV
  const handleExportCSV = () => {
    if (!filteredProducts.length) {
      notify('warning', 'No hay productos para exportar con los filtros actuales.');
      return;
    }

    const headers = ['Código', 'Nombre', 'Categoría', 'Precio Venta', 'Costo', 'Stock', 'Stock Mínimo', 'Estado'];
    const rows = filteredProducts.map((p) => [
      getProductCode(p.id_producto),
      `"${(p.nombre_producto || '').replace(/"/g, '""')}"`,
      `"${(p.nombre_categoria || '').replace(/"/g, '""')}"`,
      p.precio_venta,
      p.costo,
      p.stock,
      p.stock_minimo,
      p.estado ? 'Activo' : 'Inactivo'
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `inventario_productos_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    notify('success', 'Inventario de productos exportado en formato CSV.');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Cabecera de la Vista */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-foreground tracking-tight">
            Gestión de Productos
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Administra el catálogo de inventario, precios y existencias en tiempo real
          </p>
        </div>

        {/* Botones de Cabecera: Exportar y + Nuevo */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2.5 rounded-xl font-bold text-xs border border-border bg-card hover:bg-muted text-foreground flex items-center gap-2 transition-colors cursor-pointer shadow-xs"
          >
            <Download className="w-4 h-4 text-muted-foreground" />
            <span>Exportar</span>
          </button>

          <button
            onClick={handleOpenCreate}
            className="px-4 py-2.5 rounded-xl font-black text-white text-sm bg-primary hover:opacity-90 active:scale-[0.98] transition-all shadow-md shadow-primary/20 flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Nuevo</span>
          </button>
        </div>
      </div>

      {/* Alerta de Error de Servidor si ocurriera */}
      {errorMsg && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-300 text-xs font-bold">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Barra de Filtros y Búsqueda */}
      <ProductFilters
        search={search}
        onSearchChange={setSearch}
        categoryFilter={categoryFilter}
        onCategoryFilterChange={setCategoryFilter}
        stockFilter={stockFilter}
        onStockFilterChange={setStockFilter}
        categories={categories}
      />

      {/* Contenedor de la Tabla o Estados de Carga / Vacío */}
      {loading ? (
        <div className="bg-card border border-border rounded-xl p-12 text-center text-sm font-bold text-muted-foreground">
          Cargando catálogo de productos...
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center mx-auto text-muted-foreground">
            <Package className="w-6 h-6" />
          </div>
          <p className="font-bold text-foreground text-sm">No se encontraron productos</p>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            {search || categoryFilter || stockFilter
              ? 'Prueba modificando tus términos de búsqueda o filtros para ver más resultados.'
              : 'Empieza agregando tu primer producto con el botón "+ Nuevo".'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <ProductsTable
            products={pagedProducts}
            onEdit={handleOpenEdit}
            onDelete={handleDelete}
            onToggleStatus={handleToggleStatus}
          />

          {/* Paginación */}
          <div className="pt-2">
            <Pagination
              page={page}
              total={totalPages}
              onPage={setPage}
            />
          </div>
        </div>
      )}

      {/* Modal de Creación / Edición */}
      <ProductModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingProduct(null);
        }}
        onSave={handleSave}
        onNotify={notify}
        product={editingProduct}
        categories={categories}
        loading={modalLoading}
      />

      {/* Diálogo de Confirmación para Eliminar o Cambiar Estado */}
      {confirmState && (
        <ActionConfirmDialog
          variant={confirmState.variant}
          title={confirmState.title}
          message={confirmState.message}
          confirmLabel={confirmState.confirmLabel}
          loading={confirmBusy}
          onConfirm={confirmState.onConfirm}
          onClose={() => !confirmBusy && setConfirmState(null)}
        />
      )}

      {/* Notificaciones */}
      <FeedbackToast toast={toast} onClose={closeToast} />
    </div>
  );
}
