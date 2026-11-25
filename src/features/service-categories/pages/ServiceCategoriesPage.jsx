import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Plus, Search, Tag, AlertCircle, X } from 'lucide-react';
import { serviceCategoryService } from '../services/serviceCategoryService';
import ServiceCategoryModal from '../components/ServiceCategoryModal';
import ServiceCategoriesTable from '../components/ServiceCategoriesTable';
import ActionConfirmDialog from '../../../components/ui/ActionConfirmDialog';
import FeedbackToast from '../../../components/ui/FeedbackToast';
import Pagination from '../../../components/ui/Pagination';

const ITEMS_PER_PAGE = 5;

const getCategoryCode = (id) => `SC${String(id).padStart(3, '0')}`;

export default function ServiceCategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
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

  const fetchCategories = async () => {
    try {
      setLoading(true);
      setErrorMsg('');
      const data = await serviceCategoryService.getCategories();
      // Inicializar con estado activo si viene nulo
      const normalized = (data || []).map((c) => ({
        ...c,
        estado: c.estado !== undefined ? c.estado : true
      }));
      setCategories(normalized);
    } catch (err) {
      console.error('Error cargando categorías de servicios:', err);
      const message = 'No se pudo conectar con el servidor para obtener las categorías de servicios.';
      setErrorMsg(message);
      notify('error', { title: 'Error de conexión', message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  // Filtrado reactivo en memoria
  const filteredCategories = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return categories;
    return categories.filter((c) => {
      const code = getCategoryCode(c.id_categoria_servicio).toLowerCase();
      const name = (c.nombre_categoria || '').toLowerCase();
      const desc = (c.descripcion || '').toLowerCase();
      return name.includes(q) || desc.includes(q) || code.includes(q);
    });
  }, [categories, search]);

  const totalPages = Math.max(1, Math.ceil(filteredCategories.length / ITEMS_PER_PAGE));
  const pagedCategories = useMemo(() => {
    const start = (page - 1) * ITEMS_PER_PAGE;
    return filteredCategories.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredCategories, page]);

  useEffect(() => {
    setPage(1);
  }, [search]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  // Handlers Modal
  const handleOpenCreate = () => {
    setEditingCategory(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (cat) => {
    setEditingCategory(cat);
    setModalOpen(true);
  };

  const handleSave = async (formData) => {
    try {
      setModalLoading(true);
      if (editingCategory) {
        await serviceCategoryService.updateCategory(editingCategory.id_categoria_servicio, formData);
        notify('success', `Categoría «${formData.nombre_categoria}» actualizada correctamente.`);
      } else {
        await serviceCategoryService.createCategory(formData);
        notify('success', `Categoría «${formData.nombre_categoria}» creada correctamente.`);
      }
      setModalOpen(false);
      setEditingCategory(null);
      await fetchCategories();
    } catch (err) {
      console.error('Error guardando categoría de servicio:', err);
      throw err;
    } finally {
      setModalLoading(false);
    }
  };

  const handleToggleStatus = (cat) => {
    const isActivo = cat.estado !== 0 && cat.estado !== false;
    const newStatus = !isActivo;
    const code = getCategoryCode(cat.id_categoria_servicio);

    setConfirmState({
      variant: 'warning',
      title: `¿${isActivo ? 'Desactivar' : 'Activar'} categoría ${code}?`,
      message: `¿Estás seguro de que deseas ${isActivo ? 'desactivar' : 'activar'} la categoría «${cat.nombre_categoria}»?`,
      confirmLabel: isActivo ? 'Desactivar' : 'Activar',
      onConfirm: () => {
        setCategories((prev) =>
          prev.map((item) =>
            item.id_categoria_servicio === cat.id_categoria_servicio
              ? { ...item, estado: newStatus }
              : item
          )
        );
        setConfirmState(null);
        notify('success', `Categoría «${cat.nombre_categoria}» ${newStatus ? 'activada' : 'desactivada'} correctamente.`);
      }
    });
  };

  const handleDelete = (cat) => {
    const code = getCategoryCode(cat.id_categoria_servicio);
    setConfirmState({
      variant: 'danger',
      title: `¿Eliminar categoría ${code}?`,
      message: `¿Estás seguro de que deseas eliminar permanentemente «${cat.nombre_categoria}»? Si tiene servicios asociados, no podrá ser eliminada.`,
      confirmLabel: 'Eliminar Categoría',
      onConfirm: async () => {
        setConfirmBusy(true);
        try {
          await serviceCategoryService.deleteCategory(cat.id_categoria_servicio);
          setConfirmState(null);
          notify('success', `Categoría «${cat.nombre_categoria}» eliminada correctamente.`);
          await fetchCategories();
        } catch (err) {
          console.error('Error eliminando categoría:', err);
          setConfirmState(null);
          notify('error', {
            title: 'No se pudo eliminar la categoría',
            message: err.response?.data?.error || err.message || 'Tiene servicios asociados en el catálogo.'
          });
        } finally {
          setConfirmBusy(false);
        }
      }
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Cabecera */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-foreground tracking-tight">
            Categoría de Servicios
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Clasificación y gestión de las líneas de servicios operativos del negocio
          </p>
        </div>

        {/* Botón + Nuevo */}
        <button
          onClick={handleOpenCreate}
          className="px-4 py-2.5 rounded-xl font-black text-white text-sm bg-primary hover:opacity-90 active:scale-[0.98] transition-all shadow-md shadow-primary/20 flex items-center gap-2 cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Nuevo</span>
        </button>
      </div>

      {/* Alerta de Error de Servidor si ocurriera */}
      {errorMsg && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-300 text-xs font-bold">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Buscador de Categoría */}
      <div className="relative w-full">
        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar categoría..."
          className="w-full pl-9.5 pr-10 py-2.5 bg-input-background border border-border rounded-xl text-sm font-medium text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-ring transition-all"
        />
        {search && (
          <button
            type="button"
            onClick={() => setSearch('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Tabla de Categorías de Servicios */}
      {loading ? (
        <div className="bg-card border border-border rounded-xl p-12 text-center text-sm font-bold text-muted-foreground">
          Cargando categorías de servicios...
        </div>
      ) : filteredCategories.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center mx-auto text-muted-foreground">
            <Tag className="w-6 h-6" />
          </div>
          <p className="font-bold text-foreground text-sm">No se encontraron categorías de servicios</p>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            {search
              ? 'Prueba modificando tu búsqueda.'
              : 'Agrega tu primera categoría haciendo clic en "+ Nuevo".'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <ServiceCategoriesTable
            categories={pagedCategories}
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

      {/* Modal Crear / Editar */}
      <ServiceCategoryModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingCategory(null);
        }}
        onSave={handleSave}
        onNotify={notify}
        category={editingCategory}
        loading={modalLoading}
      />

      {/* Diálogo Confirmación para Eliminar o Cambiar Estado */}
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
