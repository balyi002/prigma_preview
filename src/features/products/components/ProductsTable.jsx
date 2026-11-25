import React, { useState, useEffect } from 'react';
import { Edit2, Trash2, Package } from 'lucide-react';
import ToggleSwitch from '../../../components/ui/ToggleSwitch';
import { formatCOP } from '../../../utils/format';

function ProductThumbnail({ src, alt }) {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [src]);

  return (
    <div className="w-10 h-10 rounded-xl overflow-hidden bg-muted/50 border border-border flex items-center justify-center flex-shrink-0">
      {src && !failed ? (
        <img
          src={src}
          alt={alt}
          className="w-full h-full object-cover"
          onError={() => setFailed(true)}
        />
      ) : (
        <Package className="w-4 h-4 text-muted-foreground" />
      )}
    </div>
  );
}

export default function ProductsTable({
  products = [],
  onEdit,
  onDelete,
  onToggleStatus
}) {
  const getProductCode = (id) => `P${String(id).padStart(3, '0')}`;

  const renderStockBadge = (stock, min) => {
    const s = Number(stock) || 0;
    const m = Number(min) || 0;

    if (s <= 0) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 border border-gray-200 dark:border-gray-700">
          Agotado
        </span>
      );
    }
    if (s <= m) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-600 dark:bg-red-950/50 dark:text-red-300 border border-red-200 dark:border-red-800">
          Crítico
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-100 text-green-700 dark:bg-green-950/50 dark:text-green-300 border border-green-200 dark:border-green-800">
        Óptimo
      </span>
    );
  };

  return (
    <div className="overflow-x-auto rounded-xl border border-border bg-card">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-border bg-muted/30 text-[11px] font-black uppercase tracking-wider text-muted-foreground">
            <th className="py-3.5 px-4">Producto</th>
            <th className="py-3.5 px-4">Categoría</th>
            <th className="py-3.5 px-4">Precio</th>
            <th className="py-3.5 px-4">Costo</th>
            <th className="py-3.5 px-4">Stock</th>
            <th className="py-3.5 px-4 text-center">Estado</th>
            <th className="py-3.5 px-4 text-right">Acciones</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border text-sm">
          {products.map((p) => {
            const isActivo = p.estado === 1 || p.estado === true;
            return (
              <tr
                key={p.id_producto}
                className="hover:bg-muted/40 transition-colors group"
              >
                {/* Imagen pequeña, Nombre y Código */}
                <td className="py-3.5 px-4">
                  <div className="flex items-center gap-3">
                    <ProductThumbnail src={p.imagen} alt={p.nombre_producto} />
                    <div className="flex flex-col min-w-0">
                      <span className="font-bold text-foreground text-sm group-hover:text-primary transition-colors truncate">
                        {p.nombre_producto}
                      </span>
                      <span className="text-[11px] font-mono text-muted-foreground">
                        {getProductCode(p.id_producto)}
                      </span>
                    </div>
                  </div>
                </td>

                {/* Categoría */}
                <td className="py-3.5 px-4">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                    {p.nombre_categoria || 'Sin Categoría'}
                  </span>
                </td>

                {/* Precio de Venta */}
                <td className="py-3.5 px-4 font-black font-mono text-foreground">
                  {formatCOP(p.precio_venta)}
                </td>

                {/* Costo */}
                <td className="py-3.5 px-4 font-medium font-mono text-xs text-muted-foreground">
                  {formatCOP(p.costo)}
                </td>

                {/* Stock actual con badge */}
                <td className="py-3.5 px-4">
                  <div className="flex items-center gap-2 font-mono text-sm font-bold text-foreground">
                    <span>{p.stock}</span>
                    {renderStockBadge(p.stock, p.stock_minimo)}
                  </div>
                </td>

                {/* Switch Estado */}
                <td className="py-3.5 px-4 text-center">
                  <ToggleSwitch
                    checked={isActivo}
                    onChange={() => onToggleStatus(p)}
                  />
                </td>

                {/* Acciones */}
                <td className="py-3.5 px-4 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      onClick={() => onEdit(p)}
                      title="Editar Producto"
                      className="p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-muted transition-colors cursor-pointer"
                    >
                      <Edit2 className="w-4 h-4 text-pink-500" />
                    </button>
                    <button
                      onClick={() => onDelete(p)}
                      title="Eliminar Producto"
                      className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
