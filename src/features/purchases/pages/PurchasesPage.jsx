import { useCallback, useMemo, useState } from 'react';
import { Loader2, Plus, Search, ShoppingCart } from 'lucide-react';
import usePurchaseCatalogs from '../hooks/usePurchaseCatalogs';
import usePurchases from '../hooks/usePurchases';
import PurchaseStatsCards from '../components/PurchaseStatsCards';
import PurchasesTable from '../components/PurchasesTable';
import PurchaseFormModal from '../components/PurchaseFormModal';
import PurchaseDetailModal from '../components/PurchaseDetailModal';
import ConfirmDialog from '../components/ConfirmDialog';
import Toast from '../components/Toast';

/**
 * Gestión de Compras.
 * Prop opcional `currentUser` ({ id_usuario, ... }) para preseleccionar quién registra la compra
 * cuando el módulo de login del equipo exponga el usuario en sesión.
 */
export default function PurchasesPage({ currentUser = null }) {
  const catalogs = usePurchaseCatalogs();
  const {
    purchases,
    loading,
    error,
    reload,
    fetchDetail,
    createPurchase,
    changeStatus,
    addLine,
    removeLine,
    deletePurchase,
  } = usePurchases(catalogs);

  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(null); // { type: 'create' | 'edit' | 'detail', purchase? }
  const [deleting, setDeleting] = useState(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [toast, setToast] = useState(null);
  const closeToast = useCallback(() => setToast(null), []);
  const notify = (type, message) => setToast({ type, message });
  const closeModal = useCallback(() => setModal(null), []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return purchases;
    return purchases.filter(
      (p) =>
        p.code.toLowerCase().includes(q) ||
        p.proveedor.toLowerCase().includes(q) ||
        String(p.factura).toLowerCase().includes(q)
    );
  }, [purchases, search]);

  const handleCreate = async (header, lines) => {
    await createPurchase(header, lines);
    notify('success', 'Compra registrada.');
    setModal(null);
  };

  // El select solo cambia cuando el servidor confirma: si un trigger lo rechaza, muestra el motivo.
  const handleStatusChange = async (purchase, idEstado) => {
    try {
      await changeStatus(purchase.id, idEstado);
      notify('success', `Compra ${purchase.code} actualizada.`);
    } catch (err) {
      notify('error', err.message);
    }
  };

  const handleDelete = async () => {
    setDeleteBusy(true);
    try {
      await deletePurchase(deleting.id);
      notify('success', 'Compra eliminada.');
    } catch (err) {
      notify('error', err.message);
    } finally {
      setDeleteBusy(false);
      setDeleting(null);
    }
  };

  const catalogsReady = !catalogs.loading && !catalogs.error;

  return (
    <section className="p-6 space-y-5">
      <header className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-black text-foreground">Gestión de Compras</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Registro de compras realizadas a proveedores</p>
        </div>
        <button
          type="button"
          onClick={() => setModal({ type: 'create' })}
          disabled={!catalogsReady}
          className="px-5 py-2.5 rounded-full font-black text-white text-sm bg-primary hover:opacity-90 active:scale-[0.98] disabled:opacity-50 transition-all shadow-md shadow-primary/20 flex items-center justify-center gap-2 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Nueva Compra
        </button>
      </header>

      {catalogs.error && (
        <p role="alert" className="text-xs font-bold px-3 py-2 rounded-xl bg-red-100 text-red-600 dark:bg-red-950/50 dark:text-red-300 border border-red-200 dark:border-red-800">
          No se pudieron cargar los catálogos (proveedores, productos, estados…): {catalogs.error}
        </p>
      )}

      {!loading && !error && <PurchaseStatsCards purchases={purchases} />}

      <div className="relative">
        <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por proveedor o ID..."
          aria-label="Buscar compra"
          className="w-full pl-10 pr-4 py-2.5 bg-card border border-border rounded-full text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-ring transition-all"
        />
      </div>

      {loading ? (
        <div className="bg-card border border-border rounded-2xl py-16 flex items-center justify-center gap-2 text-sm font-bold text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin" />
          Cargando compras...
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
          <ShoppingCart className="w-8 h-8 mx-auto text-muted-foreground" />
          <p className="text-sm font-bold text-foreground">
            {search ? `Sin resultados para «${search}»` : 'Aún no hay compras registradas'}
          </p>
          {!search && <p className="text-xs text-muted-foreground">Usa el botón Nueva Compra para registrar la primera.</p>}
        </div>
      ) : (
        <PurchasesTable
          purchases={filtered}
          estados={catalogs.estados}
          onStatusChange={handleStatusChange}
          onDetail={(purchase) => setModal({ type: 'detail', purchase })}
          onEdit={(purchase) => setModal({ type: 'edit', purchase })}
          onDelete={setDeleting}
        />
      )}

      {modal?.type === 'create' && (
        <PurchaseFormModal
          mode="create"
          catalogs={catalogs}
          defaultUserId={currentUser?.id_usuario}
          onCreate={handleCreate}
          onClose={closeModal}
        />
      )}

      {modal?.type === 'edit' && (
        <PurchaseFormModal
          mode="edit"
          purchase={modal.purchase}
          catalogs={catalogs}
          fetchDetail={fetchDetail}
          onAddLine={addLine}
          onRemoveLine={removeLine}
          onClose={closeModal}
        />
      )}

      {modal?.type === 'detail' && (
        <PurchaseDetailModal purchase={modal.purchase} fetchDetail={fetchDetail} onClose={closeModal} />
      )}

      {deleting && (
        <ConfirmDialog
          title="Eliminar compra"
          message={`¿Eliminar la compra ${deleting.code} de ${deleting.proveedor} con todos sus productos? Esta acción no se puede deshacer.`}
          loading={deleteBusy}
          onConfirm={handleDelete}
          onClose={() => setDeleting(null)}
        />
      )}

      <Toast toast={toast} onClose={closeToast} />
    </section>
  );
}
