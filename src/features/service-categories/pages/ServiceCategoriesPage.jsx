import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Search, Tag, AlertCircle, X } from 'lucide-react';
import { serviceCategoryService } from '../services/serviceCategoryService';
import ServiceCategoryModal from '../components/ServiceCategoryModal';
import ServiceCategoriesTable from '../components/ServiceCategoriesTable';
import ConfirmDialog from '../../../components/ui/ConfirmDialog';
import Pagination from '../../../components/ui/Pagination';

const ITEMS_PER_PAGE = 5;

export default function ServiceCategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [confirmState, setConfirmState] = useState({
    open: false,
    title: '',
    message: '',
    onConfirm: null
  });

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
      setErrorMsg('No se pudo conectar con el servidor para obtener las categorías de servicios.');
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
      const code = `SC${String(c.id_categoria_servicio).padStart(3, '0')}`.toLowerCase();
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
      } else {
        await serviceCategoryService.createCategory(formData);
      }
      setModalOpen(false);
      setEditingCategory(null);
      await fetchCategories();
    } catch (err) {
      console.error('Error guardando categoría de servicio:', err);
      alert(err.response?.data?.error || err.message || 'Error al guardar la categoría');
    } finally {
      setModalLoading(false);
    }
  };

  const handleToggleStatus = (cat) => {
    const newStatus = !(cat.estado !== 0 && cat.estado !== false);
    setCategories((prev) =>
      prev.map((item) =>
        item.id_categoria_servicio === cat.id_categoria_servicio
          ? { ...item, estado: newStatus }
          : item
      )
    );
  };

  const handleDelete = (cat) => {
    setConfirmState({
      open: true,
      title: '¿Eliminar categoría de servicio?',
      message: `¿Estás seguro de que deseas eliminar permanentemente "${cat.nombre_categoria}"? Si tiene servicios asociados, no podrá ser eliminada.`,
      onConfirm: async () => {
        try {
          await serviceCategoryService.deleteCategory(cat.id_categoria_servicio);
          setConfirmState({ open: false, title: '', message: '', onConfirm: null });
          await fetchCategories();
        } catch (err) {
          console.error('Error eliminando categoría:', err);
          alert(err.response?.data?.error || err.message || 'No se pudo eliminar la categoría');
          setConfirmState({ open: false, title: '', message: '', onConfirm: null });
        }
      }
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Cabecera idéntica a la captura */}
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
          <div className="flex justify-center pt-2">
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              onPageChange={setPage}
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
        category={editingCategory}
        loading={modalLoading}
      />

      {/* Diálogo Confirmación para Eliminar */}
      <ConfirmDialog
        open={confirmState.open}
        title={confirmState.title}
        message={confirmState.message}
        confirmLabel="Eliminar Categoría"
        variant="danger"
        onConfirm={confirmState.onConfirm}
        onCancel={() => setConfirmState({ open: false, title: '', message: '', onConfirm: null })}
      />
    </div>
  );
}
