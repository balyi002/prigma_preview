import React, { useState, useEffect, useMemo } from 'react';
import {
  Search,
  ShoppingBag,
  Plus,
  Minus,
  Trash2,
  ArrowLeft,
  CheckCircle2,
  Printer,
  CreditCard,
  Banknote
} from 'lucide-react';
import { orderService } from '../services/orderService';
import { formatCOP, printTicket } from '../../../utils/format';
import Modal from '../../../components/ui/Modal';

export default function POSView({ onBackToOrders, currentUser }) {
  const [catalog, setCatalog] = useState({
    productos: [],
    servicios: [],
    categorias: [],
    clientes: [],
    estados: []
  });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('Todos');
  const [cart, setCart] = useState([]);

  // Modal de Cobro / Checkout
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [clientInput, setClientInput] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Efectivo');
  const [orderStatus, setOrderStatus] = useState('Completado'); // Completado, Apartado, Pendiente
  const [montoAbono, setMontoAbono] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [lastCreatedOrder, setLastCreatedOrder] = useState(null);

  useEffect(() => {
    setLoading(true);
    orderService.getPOSCatalog()
      .then((data) => setCatalog(data))
      .catch((err) => console.error('Error cargando catálogo POS:', err))
      .finally(() => setLoading(false));
  }, []);

  // Unificar productos y servicios en un catálogo común
  const items = useMemo(() => {
    const prods = (catalog.productos || []).map((p) => ({
      id_unique: `p_${p.id_producto}`,
      id_producto: p.id_producto,
      id_servicio: null,
      tipo: 'Producto',
      nombre: p.nombre_producto,
      categoria: p.nombre_categoria || 'Varios',
      precio: Number(p.precio_venta),
      stock: p.stock,
      estado: p.estado
    }));

    const servs = (catalog.servicios || []).map((s) => ({
      id_unique: `s_${s.id_servicio}`,
      id_producto: null,
      id_servicio: s.id_servicio,
      tipo: 'Servicio',
      nombre: s.nombre_servicio,
      categoria: 'Servicios',
      precio: Number(s.precio_venta),
      stock: 9999, // ilimitado
      estado: s.estado
    }));

    return [...prods, ...servs].filter((i) => i.estado !== 0 && i.estado !== false);
  }, [catalog]);

  // Lista de categorías para las pestañas
  const categoryTabs = useMemo(() => {
    const set = new Set();
    set.add('Todos');
    (catalog.categorias || []).forEach((c) => set.add(c.nombre_categoria));
    set.add('Servicios');
    return Array.from(set);
  }, [catalog]);

  // Filtrado por buscador y categoría
  const filteredItems = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter((item) => {
      const matchCat = activeCategory === 'Todos' || item.categoria.toLowerCase() === activeCategory.toLowerCase();
      const matchQuery = !q || item.nombre.toLowerCase().includes(q) || item.categoria.toLowerCase().includes(q);
      return matchCat && matchQuery;
    });
  }, [items, search, activeCategory]);

  // Agregar al carrito
  const addToCart = (item) => {
    if (item.tipo === 'Producto' && item.stock <= 0) return;

    setCart((prev) => {
      const existing = prev.find((x) => x.id_unique === item.id_unique);
      if (existing) {
        if (item.tipo === 'Producto' && existing.qty >= item.stock) {
          alert(`Has alcanzado el stock máximo disponible (${item.stock}) para este producto.`);
          return prev;
        }
        return prev.map((x) =>
          x.id_unique === item.id_unique ? { ...x, qty: x.qty + 1 } : x
        );
      }
      return [...prev, { ...item, qty: 1 }];
    });
  };

  const updateQty = (id_unique, delta) => {
    setCart((prev) =>
      prev
        .map((x) => {
          if (x.id_unique !== id_unique) return x;
          const nextQty = x.qty + delta;
          if (x.tipo === 'Producto' && nextQty > x.stock) {
            alert(`Stock máximo disponible: ${x.stock}`);
            return x;
          }
          return { ...x, qty: nextQty };
        })
        .filter((x) => x.qty > 0)
    );
  };

  const removeFromCart = (id_unique) => {
    setCart((prev) => prev.filter((x) => x.id_unique !== id_unique));
  };

  const clearCart = () => {
    if (cart.length > 0 && window.confirm('¿Deseas vaciar todos los artículos del carrito?')) {
      setCart([]);
    }
  };

  // Cálculos del Carrito
  const total = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.precio * item.qty, 0);
  }, [cart]);

  const iva = Math.round((total * 19) / 119);
  const subtotal = total - iva;

  const handleOpenCheckout = () => {
    if (cart.length === 0) return;
    setClientInput('');
    setPaymentMethod('Efectivo');
    setOrderStatus('Completado');
    setMontoAbono(String(total));
    setCheckoutOpen(true);
  };

  const handleFinishCheckout = async (e) => {
    e.preventDefault();
    const clienteNombre = clientInput.trim() || 'Consumidor Final';

    setSubmitting(true);
    try {
      const productosPayload = cart
        .filter((x) => x.tipo === 'Producto')
        .map((x) => ({
          id_producto: x.id_producto,
          precio_unitario: x.precio,
          cantidad: x.qty
        }));

      const serviciosPayload = cart
        .filter((x) => x.tipo === 'Servicio')
        .map((x) => ({
          id_servicio: x.id_servicio,
          precio_unitario: x.precio,
          cantidad: x.qty
        }));

      const abonoFinal =
        orderStatus === 'Completado'
          ? total
          : montoAbono ? Number(montoAbono) : total;

      const checkoutData = {
        nombre_cliente: clienteNombre,
        id_usuario: currentUser?.id_usuario || 1,
        estado: orderStatus,
        metodo_pago: paymentMethod,
        descuento: 0,
        porcentaje_iva: 19,
        monto_abono: abonoFinal,
        productos: productosPayload,
        servicios: serviciosPayload
      };

      const result = await orderService.checkout(checkoutData);

      const createdOrderData = {
        id_pedido: result.id_pedido,
        nombre_cliente: clienteNombre,
        nombre_estado: orderStatus,
        metodo_pago: paymentMethod,
        total: total,
        items: cart.map((c) => ({
          name: c.nombre,
          qty: c.qty,
          price: c.precio
        }))
      };

      setLastCreatedOrder(createdOrderData);
      setCart([]);
      setCheckoutOpen(false);

      // Recargar catálogo para refrescar los stocks descontados por los triggers de la BD
      orderService.getPOSCatalog().then((data) => setCatalog(data));
    } catch (err) {
      console.error('Error procesando checkout:', err);
      alert(err.response?.data?.error || err.message || 'Error al procesar la venta');
    } finally {
      setSubmitting(false);
    }
  };

  // Helper de icono/emoji por categoría
  const getCategoryEmoji = (categoria, tipo) => {
    if (tipo === 'Servicio') return '⚡';
    const c = (categoria || '').toLowerCase();
    if (c.includes('papel')) return '📓';
    if (c.includes('belleza') || c.includes('cosm')) return '💄';
    if (c.includes('acces')) return '👜';
    if (c.includes('tecno')) return '🎧';
    if (c.includes('aseo')) return '✨';
    return '📦';
  };

  return (
    <div className="space-y-4">
      {/* Barra superior del POS */}
      <div className="flex items-center justify-between pb-2 border-b border-border">
        <button
          onClick={onBackToOrders}
          className="flex items-center gap-2 text-xs font-black text-primary hover:opacity-80 transition-opacity cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver a Pedidos
        </button>
        <span className="text-xs font-bold text-muted-foreground">
          Punto de Venta · Variedades Carito
        </span>
      </div>

      {/* Notificación de venta completada exitosamente */}
      {lastCreatedOrder && (
        <div className="bg-green-50 dark:bg-green-950/40 border border-green-200 dark:border-green-800 text-green-800 dark:text-green-300 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0" />
            <div className="text-xs">
              <span className="font-bold">¡Operación registrada con éxito!</span> Pedido{' '}
              <strong className="font-mono text-sm font-black">
                PED{String(lastCreatedOrder.id_pedido).padStart(3, '0')}
              </strong>{' '}
              ({lastCreatedOrder.nombre_estado}) por{' '}
              <strong className="font-mono text-sm">{formatCOP(lastCreatedOrder.total)}</strong>.
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => printTicket(lastCreatedOrder)}
              className="px-3 py-1.5 rounded-xl font-bold text-xs bg-green-600 text-white hover:bg-green-700 flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              Imprimir Ticket
            </button>
            <button
              onClick={() => setLastCreatedOrder(null)}
              className="text-xs text-green-700 dark:text-green-400 hover:underline cursor-pointer"
            >
              Descartar
            </button>
          </div>
        </div>
      )}

      {/* Contenedor principal: Catálogo a la izquierda + Carrito a la derecha */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Catálogo de Productos y Servicios (8 cols) */}
        <div className="lg:col-span-8 space-y-4 min-w-0">
          {/* Buscador de productos */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar producto o servicio..."
              className="w-full pl-10 pr-4 py-2.5 bg-card border border-border rounded-xl text-sm font-medium text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-ring transition-all shadow-xs"
            />
          </div>

          {/* Filtros por Categoría */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {categoryTabs.map((cat) => {
              const active = activeCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                    active
                      ? 'bg-primary text-white shadow-xs'
                      : 'bg-card border border-border text-foreground hover:bg-muted'
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>

          {/* Cuadrícula de Productos */}
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <div key={n} className="bg-card rounded-2xl border border-border p-4 h-36 animate-pulse" />
              ))}
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="bg-card border border-border rounded-2xl p-12 text-center text-muted-foreground">
              <ShoppingBag className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p className="font-bold text-foreground">No se encontraron productos o servicios</p>
              <p className="text-xs">Prueba seleccionando otra categoría o cambiando la búsqueda.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3 max-h-[calc(100vh-250px)] overflow-y-auto pr-1">
              {filteredItems.map((item) => {
                const inCart = cart.find((x) => x.id_unique === item.id_unique);
                const isOutOfStock = item.tipo === 'Producto' && item.stock <= 0;

                return (
                  <button
                    key={item.id_unique}
                    disabled={isOutOfStock}
                    onClick={() => addToCart(item)}
                    className={`bg-card rounded-2xl border p-4 flex flex-col items-center text-center justify-between gap-2 transition-all relative cursor-pointer select-none ${
                      inCart
                        ? 'border-primary ring-2 ring-primary/20 shadow-md shadow-primary/5'
                        : 'border-border hover:border-primary/40 hover:shadow-sm'
                    } ${isOutOfStock ? 'opacity-40 cursor-not-allowed' : 'active:scale-95'}`}
                  >
                    {/* Badge de cantidad en carrito */}
                    {inCart && (
                      <span className="absolute top-2 right-2 bg-primary text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center shadow-xs">
                        ×{inCart.qty}
                      </span>
                    )}

                    <span className="text-3xl mt-1 select-none">
                      {getCategoryEmoji(item.categoria, item.tipo)}
                    </span>

                    <div className="space-y-0.5 w-full">
                      <p className="font-bold text-xs text-foreground line-clamp-2 leading-tight">
                        {item.nombre}
                      </p>
                      <p className="text-primary font-black font-mono text-sm">
                        {formatCOP(item.precio)}
                      </p>
                    </div>

                    {/* Badge de Stock o Tipo */}
                    <div>
                      {item.tipo === 'Servicio' ? (
                        <span className="inline-block text-[10px] px-2 py-0.5 rounded-full font-bold bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-300 border border-blue-200/50">
                          Servicio
                        </span>
                      ) : isOutOfStock ? (
                        <span className="inline-block text-[10px] px-2 py-0.5 rounded-full font-bold bg-red-100 text-red-600 dark:bg-red-950/40 dark:text-red-300">
                          Sin Stock
                        </span>
                      ) : item.stock < 10 ? (
                        <span className="inline-block text-[10px] px-2 py-0.5 rounded-full font-bold bg-orange-100 text-orange-700 dark:bg-orange-950/40 dark:text-orange-300">
                          Stock: {item.stock}
                        </span>
                      ) : (
                        <span className="inline-block text-[10px] px-2 py-0.5 rounded-full font-bold bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-300">
                          Stock: {item.stock}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Panel del Carrito (4 cols) */}
        <div className="lg:col-span-4 bg-card border border-border rounded-2xl shadow-xs overflow-hidden flex flex-col min-h-[480px] sticky top-4">
          <div className="p-4 border-b border-border flex items-center justify-between bg-muted/20">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-primary" />
              <h3 className="font-black text-sm text-foreground">
                Carrito ({cart.reduce((s, x) => s + x.qty, 0)})
              </h3>
            </div>
            {cart.length > 0 && (
              <button
                onClick={clearCart}
                className="text-xs font-bold text-red-500 hover:text-red-700 transition-colors cursor-pointer"
              >
                Vaciar
              </button>
            )}
          </div>

          {/* Líneas del Carrito */}
          <div className="flex-1 p-3 overflow-y-auto space-y-2 max-h-80">
            {cart.length === 0 ? (
              <div className="py-16 text-center text-muted-foreground space-y-2">
                <ShoppingBag className="w-10 h-10 mx-auto opacity-30 stroke-[1.5]" />
                <p className="text-xs font-bold">Agrega productos al carrito</p>
                <p className="text-[11px] text-muted-foreground/80">Haz clic en cualquier producto del catálogo.</p>
              </div>
            ) : (
              cart.map((item) => (
                <div
                  key={item.id_unique}
                  className="p-2.5 rounded-xl border border-border bg-background flex items-center justify-between gap-2 shadow-2xs"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-foreground truncate">{item.nombre}</p>
                    <p className="text-[11px] font-mono text-primary font-bold">
                      {formatCOP(item.precio)}
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <button
                      onClick={() => updateQty(item.id_unique, -1)}
                      className="w-6 h-6 rounded-lg bg-muted text-foreground hover:bg-muted/80 flex items-center justify-center cursor-pointer transition-colors"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="w-6 text-center text-xs font-mono font-black">{item.qty}</span>
                    <button
                      onClick={() => updateQty(item.id_unique, 1)}
                      className="w-6 h-6 rounded-lg bg-muted text-foreground hover:bg-muted/80 flex items-center justify-center cursor-pointer transition-colors"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => removeFromCart(item.id_unique)}
                      className="w-6 h-6 rounded-lg text-muted-foreground hover:text-red-500 flex items-center justify-center cursor-pointer ml-1"
                      title="Quitar"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Resumen de Totales y Botón de Cobro */}
          <div className="p-4 border-t border-border bg-card space-y-3">
            <div className="space-y-1 text-xs">
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal (sin IVA):</span>
                <span className="font-mono font-semibold">{formatCOP(subtotal)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>IVA incluido (19%):</span>
                <span className="font-mono font-semibold">{formatCOP(iva)}</span>
              </div>
              <div className="flex justify-between text-base font-black text-foreground pt-2 border-t border-border">
                <span>Total:</span>
                <span className="text-primary font-mono text-lg">{formatCOP(total)}</span>
              </div>
            </div>

            <button
              onClick={handleOpenCheckout}
              disabled={cart.length === 0}
              className="w-full py-3 rounded-xl font-black text-white text-sm bg-primary hover:opacity-90 active:scale-[0.98] transition-all shadow-md shadow-primary/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              ✓ Cobrar
            </button>
          </div>
        </div>
      </div>

      {/* Modal de Finalización y Cobro (Checkout) */}
      <Modal
        open={checkoutOpen}
        onClose={() => setCheckoutOpen(false)}
        title="Finalizar Venta / Crear Pedido"
      >
        <form onSubmit={handleFinishCheckout} className="space-y-4 text-xs">
          {/* Nombre del Cliente */}
          <div className="space-y-1.5">
            <label className="font-bold text-foreground block">
              Nombre del Cliente <span className="text-primary">*</span>
            </label>
            <input
              type="text"
              value={clientInput}
              onChange={(e) => setClientInput(e.target.value)}
              placeholder="Ej: Sofía López, Consumidor Final..."
              required
              className="w-full px-3.5 py-2.5 bg-input-background border border-border rounded-xl text-sm font-medium text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-ring transition-all"
            />
          </div>

          {/* Tipo de Operación / Estado */}
          <div className="space-y-1.5">
            <label className="font-bold text-foreground block">Tipo de Operación</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'Completado', label: 'Venta Directa' },
                { id: 'Apartado', label: 'Apartado' },
                { id: 'Pendiente', label: 'Pendiente' },
              ].map((op) => (
                <button
                  type="button"
                  key={op.id}
                  onClick={() => {
                    setOrderStatus(op.id);
                    if (op.id === 'Completado') setMontoAbono(String(total));
                  }}
                  className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                    orderStatus === op.id
                      ? 'bg-primary text-white border-primary shadow-xs'
                      : 'bg-background border-border text-foreground hover:bg-muted'
                  }`}
                >
                  {op.label}
                </button>
              ))}
            </div>
          </div>

          {/* Método de Pago */}
          <div className="space-y-1.5">
            <label className="font-bold text-foreground block">Método de Pago</label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'Efectivo', icon: Banknote },
                { id: 'Transferencia', icon: CreditCard },
              ].map((mp) => (
                <button
                  type="button"
                  key={mp.id}
                  onClick={() => setPaymentMethod(mp.id)}
                  className={`py-2 px-3 rounded-xl text-xs font-bold border flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    paymentMethod === mp.id
                      ? 'bg-secondary text-secondary-foreground border-primary/40 shadow-xs'
                      : 'bg-background border-border text-foreground hover:bg-muted'
                  }`}
                >
                  <mp.icon className="w-4 h-4" />
                  {mp.id}
                </button>
              ))}
            </div>
          </div>

          {/* Monto de Pago / Abono */}
          <div className="space-y-1.5">
            <label className="font-bold text-foreground block">
              {orderStatus === 'Completado' ? 'Monto Recibido' : 'Monto de Abono Inicial'}
            </label>
            <input
              type="number"
              value={montoAbono}
              onChange={(e) => setMontoAbono(e.target.value)}
              placeholder="0"
              required
              className="w-full px-3.5 py-2.5 bg-input-background border border-border rounded-xl text-sm font-mono font-bold text-foreground outline-none focus:ring-2 focus:ring-ring transition-all"
            />
          </div>

          {/* Resumen Total */}
          <div className="bg-muted/40 p-3 rounded-xl border border-border flex justify-between items-center font-bold text-sm">
            <span>Total a Pagar:</span>
            <span className="font-mono text-primary font-black text-base">{formatCOP(total)}</span>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-border">
            <button
              type="button"
              onClick={() => setCheckoutOpen(false)}
              className="px-4 py-2.5 rounded-xl font-bold text-foreground text-xs bg-muted hover:bg-muted/80 transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 rounded-xl font-black text-white text-xs bg-primary hover:opacity-90 active:scale-[0.98] transition-all shadow-md shadow-primary/20 cursor-pointer disabled:opacity-50"
            >
              {submitting ? 'Procesando...' : 'Confirmar y Finalizar'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
