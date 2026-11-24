import React, { useState, useEffect, useMemo } from 'react';
import Modal from '../../../components/ui/Modal';
import { formatCOP } from '../../../utils/format';
import { orderService } from '../services/orderService';
import { Search, Plus, Package, Sparkles } from 'lucide-react';

export default function AddItemsModal({ open, onClose, order, onItemsAdded }) {
  const [catalog, setCatalog] = useState({ productos: [], servicios: [] });
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('Productos'); // 'Productos' | 'Servicios'
  const [selectedItem, setSelectedItem] = useState(null);
  const [cantidad, setCantidad] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      setLoading(true);
      setError('');
      setSelectedItem(null);
      setCantidad(1);
      orderService.getPOSCatalog()
        .then((res) => {
          setCatalog({
            productos: res.productos || [],
            servicios: res.servicios || []
          });
        })
        .catch((err) => console.error('Error cargando catálogo:', err))
        .finally(() => setLoading(false));
    }
  }, [open]);

  const filteredItems = useMemo(() => {
    const q = search.trim().toLowerCase();
    const source = activeTab === 'Productos' ? catalog.productos : catalog.servicios;
    return source.filter((item) => {
      const name = (item.nombre_producto || item.nombre_servicio || '').toLowerCase();
      const cat = (item.nombre_categoria || '').toLowerCase();
      return !q || name.includes(q) || cat.includes(q);
    });
  }, [catalog, activeTab, search]);

  if (!order) return null;

  const idFormatted = `PED${String(order.id_pedido).padStart(3, '0')}`;

  const handleAddItem = async (e) => {
    e.preventDefault();
    if (!selectedItem) {
      setError('Selecciona un artículo para agregar.');
      return;
    }
    const qty = Number(cantidad);
    if (!qty || qty < 1) {
      setError('La cantidad debe ser al menos 1.');
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      if (activeTab === 'Productos') {
        if (selectedItem.stock !== undefined && qty > selectedItem.stock) {
          setError(`No hay stock suficiente (Disponible: ${selectedItem.stock}).`);
          setSubmitting(false);
          return;
        }
        await orderService.addProductToOrder(order.id_pedido, {
          id_producto: selectedItem.id_producto,
          precio_unitario: Number(selectedItem.precio_venta),
          cantidad: qty
        });
      } else {
        await orderService.addServiceToOrder(order.id_pedido, {
          id_servicio: selectedItem.id_servicio,
          precio_unitario: Number(selectedItem.precio_venta),
          cantidad: qty
        });
      }

      onClose();
      if (onItemsAdded) onItemsAdded();
    } catch (err) {
      console.error('Error agregando artículo:', err);
      setError(err.response?.data?.error || err.message || 'Error al agregar artículo');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Añadir Artículos a Pedido — ${idFormatted}`}
      wide={true}
    >
      <form onSubmit={handleAddItem} className="space-y-4">
        {error && (
          <div className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-300 text-xs font-bold rounded-xl p-3">
            {error}
          </div>
        )}

        {/* Pestañas Productos / Servicios */}
        <div className="flex gap-2 border-b border-border pb-2">
          <button
            type="button"
            onClick={() => {
              setActiveTab('Productos');
              setSelectedItem(null);
            }}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'Productos'
                ? 'bg-primary text-white shadow-xs'
                : 'bg-card border border-border text-foreground hover:bg-muted'
            }`}
          >
            <Package className="w-3.5 h-3.5 inline mr-1.5" />
            Productos ({catalog.productos.length})
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('Servicios');
              setSelectedItem(null);
            }}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'Servicios'
                ? 'bg-primary text-white shadow-xs'
                : 'bg-card border border-border text-foreground hover:bg-muted'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 inline mr-1.5" />
            Servicios ({catalog.servicios.length})
          </button>
        </div>

        {/* Buscador */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={`Buscar en ${activeTab.toLowerCase()}...`}
            className="w-full pl-10 pr-4 py-2 bg-input-background border border-border rounded-xl text-xs font-medium text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        {/* Listado con selección */}
        <div className="max-h-56 overflow-y-auto space-y-1.5 border border-border rounded-xl p-2 bg-muted/20">
          {loading ? (
            <p className="text-center text-xs py-8 text-muted-foreground">Cargando catálogo...</p>
          ) : filteredItems.length === 0 ? (
            <p className="text-center text-xs py-8 text-muted-foreground">No se encontraron {activeTab.toLowerCase()}.</p>
          ) : (
            filteredItems.map((item) => {
              const id = item.id_producto || item.id_servicio;
              const name = item.nombre_producto || item.nombre_servicio;
              const isSelected =
                selectedItem &&
                (selectedItem.id_producto === item.id_producto || selectedItem.id_servicio === item.id_servicio);
              const isOutOfStock = activeTab === 'Productos' && item.stock <= 0;

              return (
                <div
                  key={id}
                  onClick={() => {
                    if (!isOutOfStock) setSelectedItem(item);
                  }}
                  className={`p-2.5 rounded-xl border flex items-center justify-between gap-3 text-xs transition-all cursor-pointer ${
                    isSelected
                      ? 'border-primary bg-primary/10 shadow-xs'
                      : isOutOfStock
                      ? 'opacity-40 cursor-not-allowed border-border bg-card'
                      : 'border-border bg-card hover:border-primary/50'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-lg overflow-hidden bg-muted/60 border border-border/40 flex items-center justify-center flex-shrink-0">
                      {item.imagen ? (
                        <img src={item.imagen} alt={name} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-sm">📦</span>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-foreground truncate">{name}</p>
                      <p className="text-[10px] text-muted-foreground">{item.nombre_categoria || 'General'}</p>
                    </div>
                  </div>

                  <div className="text-right flex-shrink-0">
                    <p className="font-mono font-bold text-primary">{formatCOP(item.precio_venta)}</p>
                    {activeTab === 'Productos' && (
                      <span className={`text-[10px] font-bold ${isOutOfStock ? 'text-red-500' : 'text-muted-foreground'}`}>
                        {isOutOfStock ? 'Agotado' : `Stock: ${item.stock}`}
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Panel inferior: Artículo seleccionado y cantidad */}
        {selectedItem && (
          <div className="bg-primary/5 border border-primary/20 rounded-xl p-3 flex items-center justify-between gap-3">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-primary block">Seleccionado:</span>
              <span className="text-xs font-black text-foreground">
                {selectedItem.nombre_producto || selectedItem.nombre_servicio}
              </span>
              <span className="text-xs font-mono font-bold text-primary ml-2">
                {formatCOP(selectedItem.precio_venta)} c/u
              </span>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-xs font-bold text-foreground">Cant:</label>
              <input
                type="number"
                min="1"
                max={activeTab === 'Productos' ? selectedItem.stock : 9999}
                value={cantidad}
                onChange={(e) => setCantidad(Math.max(1, Number(e.target.value) || 1))}
                className="w-16 px-2 py-1 bg-input-background border border-border rounded-lg text-xs font-mono font-bold text-center text-foreground outline-none focus:ring-1 focus:ring-ring"
              />
            </div>
          </div>
        )}

        <div className="flex justify-end gap-2.5 pt-3 border-t border-border">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-muted text-foreground hover:bg-muted/80 transition-colors cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={submitting || !selectedItem}
            className="px-5 py-2 rounded-xl text-xs font-black bg-primary text-white hover:opacity-90 active:scale-[0.98] transition-all shadow-md shadow-primary/20 cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            {submitting ? 'Agregando...' : 'Agregar al Pedido'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
