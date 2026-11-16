import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Search, Edit2, Trash2, Tag, AlertTriangle } from 'lucide-react';
import { categoryService } from '../services/categoryService';
import CategoryModal from '../components/CategoryModal';
import ToggleSwitch from '../../../components/ui/ToggleSwitch';
import ConfirmDialog from '../../../components/ui/ConfirmDialog';
import Pagination from '../../../components/ui/Pagination';

const ITEMS_PER_PAGE = 5;

export default function ProductCategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [confirmState, setConfirmState] = useState({ open: false, title: '', message: '', onConfirm: null });

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const data = await categoryService.getCategories();
      setCategories(data);
    } catch (err) {
      console.error('Error cargando categorías:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const filteredCategories = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return categories;
    return categories.filter((c) => {
      const code = `BC${String(c.id_categoria_producto).padStart(3, '0')}`.toLowerCase();
      return (
        c.nombre_categoria.toLowerCase().includes(q) ||
        (c.descripcion && c.descripcion.toLowerCase().includes(q)) ||
        code.includes(q)
      );
    });
  }, [categories, search]);

  const totalPages = Math.ceil(filteredCategories.length / ITEMS_PER_PAGE);
  const pagedCategories = useMemo(() => {
    const start = (page - 1) * ITEMS_PER_PAGE;
    return filteredCategories.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredCategories, page]);

  const handleCreate = () => {
    setEditingCategory(null);
    setModalOpen(true);
  };

  const handleEdit = (cat) => {
    setEditingCategory(cat);
    setModalOpen(true);
  };

  const handleSave = async (formData) => {
    try {
      if (editingCategory) {
        await categoryService.updateCategory(editingCategory.id_categoria_producto, formData);
      } else {
        await categoryService.createCategory(formData);
      }
      setModalOpen(false);
      setEditingCategory(null);
      await fetchCategories();
    } catch (err) {
      console.error('Error guardando categoría:', err);
      alert(err.response?.data?.error || err.message || 'Error al guardar la categoría');
    }
  };

  const handleToggleStatus = async (cat) => {
    const newStatus = !cat.estado;
    try {
      await categoryService.updateCategoryStatus(cat.id_categoria_producto, newStatus);
      setCategories((prev) =>
        prev.map((c) =>
          c.id_categoria_producto === cat.id_categoria_producto
            ? { ...c, estado: newStatus ? 1 : 0 }
            : c
        )
      );
    } catch (err) {
      console.error('Error cambiando estado:', err);
      alert(err.response?.data?.error || err.message || 'Error al actualizar estado');
    }
  };

  const handleDelete = (cat) => {
    setConfirmState({
      open: true,
      title: `¿Eliminar categoría "${cat.nombre_categoria}"?`,
      message: 'Si esta categoría contiene productos o compras asociadas, el sistema protegerá la integridad y no permitirá su eliminación física.',
      onConfirm: async () => {
        try {
          await categoryService.deleteCategory(cat.id_categoria_producto);
          setCategories((prev) =>
            prev.filter((c) => c.id_categoria_producto !== cat.id_categoria_producto)
          );
          setConfirmState({ open: false, title: '', message: '', onConfirm: null });
        } catch (err) {
          console.error('Error eliminando categoría:', err);
          alert(err.response?.data?.error || err.message || 'No se puede eliminar la categoría');
          setConfirmState({ open: false, title: '', message: '', onConfirm: null });
        }
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Cabecera del módulo */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-black text-xl text-foreground">Categoría de Productos</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Clasificación oficial de inventario y líneas de productos comerciales
          </p>
        </div>
        <button
          onClick={handleCreate}
          className="px-4 py-2.5 rounded-xl font-black text-white text-sm bg-primary hover:opacity-90 active:scale-[0.98] transition-all shadow-md shadow-primary/20 flex items-center justify-center gap-2 cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Nueva
        </button>
      </div>

      {/* Buscador de Categorías */}
      <div className="relative w-full">
        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          placeholder="Buscar categoría..."
          className="w-full pl-10 pr-4 py-2.5 bg-card border border-border rounded-xl text-sm font-medium text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-ring transition-all shadow-xs"
        />
      </div>

      {/* Tabla Principal */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border bg-muted/40 text-[11px] font-black uppercase tracking-wider text-muted-foreground">
                <th className="py-3.5 px-5">Categoría</th>
                <th className="py-3.5 px-5">Descripción</th>
                <th className="py-3.5 px-5 text-center">Estado</th>
                <th className="py-3.5 px-5 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60 text-sm">
              {loading ? (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-muted-foreground">
                    <span className="inline-block w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin mr-2 align-middle" />
                    Cargando categorías...
                  </td>
                </tr>
              ) : pagedCategories.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-muted-foreground">
                    <Tag className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    <p className="font-bold text-foreground">No se encontraron categorías</p>
                    <p className="text-xs">Prueba con otro término de búsqueda o crea una nueva.</p>
                  </td>
                </tr>
              ) : (
                pagedCategories.map((cat) => {
                  const code = `BC${String(cat.id_categoria_producto).padStart(3, '0')}`;
                  return (
                    <tr
                      key={cat.id_categoria_producto}
                      className="hover:bg-muted/30 transition-colors"
                    >
                      <td className="py-3.5 px-5">
                        <div className="font-bold text-foreground">{cat.nombre_categoria}</div>
                        <div className="text-[11px] font-mono font-bold text-muted-foreground mt-0.5">
                          {code}
                        </div>
                      </td>
                      <td className="py-3.5 px-5">
                        <span className="text-xs text-muted-foreground line-clamp-2">
                          {cat.descripcion || '—'}
                        </span>
                      </td>
                      <td className="py-3.5 px-5 text-center">
                        <ToggleSwitch
                          checked={Boolean(cat.estado !== 0 && cat.estado !== false)}
                          onChange={() => handleToggleStatus(cat)}
                        />
                      </td>
                      <td className="py-3.5 px-5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleEdit(cat)}
                            className="p-1.5 rounded-lg text-primary hover:bg-primary/10 transition-colors cursor-pointer"
                            title="Editar Categoría"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(cat)}
                            className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors cursor-pointer"
                            title="Eliminar Categoría"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Paginación */}
        <div className="p-4 border-t border-border">
          <Pagination page={page} total={totalPages} onPage={setPage} />
        </div>
      </div>

      {/* Modal de Creación / Edición */}
      <CategoryModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSave}
        category={editingCategory}
      />

      {/* Diálogo de Confirmación */}
      <ConfirmDialog
        open={confirmState.open}
        title={confirmState.title}
        message={confirmState.message}
        onConfirm={confirmState.onConfirm}
        onCancel={() => setConfirmState({ open: false, title: '', message: '', onConfirm: null })}
      />
    </div>
  );
}
