import { useCallback, useEffect, useMemo, useState } from 'react';
import { Loader2, Plus, Search, Briefcase } from 'lucide-react';
import useServices from '../hooks/useServices';
import ServicesTable from '../components/ServicesTable';
import ServiceFormModal from '../components/ServiceFormModal';
import ConfirmDialog from '../components/ConfirmDialog';
import Pagination from '../components/Pagination';
import Toast from '../components/Toast';
import { serviceCode } from '../utils/format';

const PAGE_SIZE = 5;

export default function ServicesPage() {
  const { services, categories, loading, error, reload, createService, updateService, toggleStatus, deleteService } =
    useServices();

  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [formTarget, setFormTarget] = useState(null); // null | 'new' | servicio
  const [deleting, setDeleting] = useState(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [toast, setToast] = useState(null);
  const closeToast = useCallback(() => setToast(null), []);
  const notify = (type, message) => setToast({ type, message });

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return services;
    return services.filter(
      (s) =>
        s.nombre_servicio.toLowerCase().includes(q) ||
        (s.nombre_categoria ?? '').toLowerCase().includes(q) ||
        serviceCode(s.id_servicio).toLowerCase().includes(q)
    );
  }, [services, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const visible = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  // Si al eliminar/buscar la página actual deja de existir, vuelve a la última válida.
  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const handleSubmit = async (payload) => {
    if (formTarget === 'new') {
      await createService(payload);
      notify('success', 'Servicio creado.');
    } else {
      await updateService(formTarget.id_servicio, payload);
      notify('success', 'Servicio actualizado.');
    }
    setFormTarget(null);
  };

  const handleToggle = async (service) => {
    try {
      await toggleStatus(service);
      notify('success', service.estado ? 'Servicio desactivado.' : 'Servicio activado.');
    } catch (err) {
      notify('error', err.message);
    }
  };

  const handleDelete = async () => {
    setDeleteBusy(true);
    try {
      await deleteService(deleting.id_servicio);
      notify('success', 'Servicio eliminado.');
      setDeleting(null);
    } catch (err) {
      notify('error', err.message);
      setDeleting(null);
    } finally {
      setDeleteBusy(false);
    }
  };

  return (
    <section className="p-6 space-y-5">
      <header className="flex items-center justify-between gap-4 flex-wrap">
        <h1 className="text-xl font-black text-foreground">Gestión de Servicios</h1>
        <button
          type="button"
          onClick={() => setFormTarget('new')}
          disabled={loading || Boolean(error)}
          className="px-5 py-2.5 rounded-full font-black text-white text-sm bg-primary hover:opacity-90 active:scale-[0.98] disabled:opacity-50 transition-all shadow-md shadow-primary/20 flex items-center justify-center gap-2 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Nuevo
        </button>
      </header>

      <div className="relative">
        <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          placeholder="Buscar servicio..."
          aria-label="Buscar servicio"
          className="w-full pl-10 pr-4 py-2.5 bg-card border border-border rounded-full text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-ring transition-all"
        />
      </div>

      {loading ? (
        <div className="bg-card border border-border rounded-2xl py-16 flex items-center justify-center gap-2 text-sm font-bold text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin" />
          Cargando servicios...
        </div>
      ) : error ? (
        <div className="bg-card border border-border rounded-2xl py-14 text-center space-y-3">
          <p className="text-sm font-bold text-destructive">{error}</p>
          <button
            type="button"
            onClick={() => reload()}
            className="px-4 py-2 rounded-xl text-sm font-bold bg-muted text-foreground hover:bg-muted/80 cursor-pointer"
          >
            Reintentar
          </button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-card border border-border rounded-2xl py-14 text-center space-y-2">
          <Briefcase className="w-8 h-8 mx-auto text-muted-foreground" />
          <p className="text-sm font-bold text-foreground">
            {search ? `Sin resultados para «${search}»` : 'Aún no hay servicios registrados'}
          </p>
          {!search && <p className="text-xs text-muted-foreground">Usa el botón Nuevo para crear el primero.</p>}
        </div>
      ) : (
        <>
          <ServicesTable
            services={visible}
            onEdit={setFormTarget}
            onToggle={handleToggle}
            onDelete={setDeleting}
          />
          <Pagination page={currentPage} totalPages={totalPages} onChange={setPage} />
        </>
      )}

      {formTarget && (
        <ServiceFormModal
          service={formTarget === 'new' ? null : formTarget}
          categories={categories}
          onSubmit={handleSubmit}
          onClose={() => setFormTarget(null)}
        />
      )}

      {deleting && (
        <ConfirmDialog
          title="Eliminar servicio"
          message={`¿Eliminar «${deleting.nombre_servicio}» definitivamente? Si ya fue usado en pedidos, no se podrá eliminar: desactívalo con el interruptor.`}
          loading={deleteBusy}
          onConfirm={handleDelete}
          onClose={() => setDeleting(null)}
        />
      )}

      <Toast toast={toast} onClose={closeToast} />
    </section>
  );
}

