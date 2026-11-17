import React from 'react';
import { Edit2, Trash2 } from 'lucide-react';
import ToggleSwitch from '../../../components/ui/ToggleSwitch';

export default function ServiceCategoriesTable({
  categories = [],
  onEdit,
  onDelete,
  onToggleStatus
}) {
  const getCategoryCode = (id) => `SC${String(id).padStart(3, '0')}`;

  return (
    <div className="overflow-x-auto rounded-xl border border-border bg-card">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-border bg-muted/30 text-[11px] font-black uppercase tracking-wider text-muted-foreground">
            <th className="py-3.5 px-4">Categoría</th>
            <th className="py-3.5 px-4">Descripción</th>
            <th className="py-3.5 px-4 text-center">Estado</th>
            <th className="py-3.5 px-4 text-right">Acciones</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border text-sm">
          {categories.map((cat) => {
            const isActivo = cat.estado !== 0 && cat.estado !== false;
            return (
              <tr
                key={cat.id_categoria_servicio}
                className="hover:bg-muted/40 transition-colors group"
              >
                {/* Categoría y Código */}
                <td className="py-3.5 px-4">
                  <div className="flex flex-col">
                    <span className="font-bold text-foreground text-sm group-hover:text-primary transition-colors">
                      {cat.nombre_categoria}
                    </span>
                    <span className="text-[11px] font-mono text-muted-foreground">
                      {getCategoryCode(cat.id_categoria_servicio)}
                    </span>
                  </div>
                </td>

                {/* Descripción */}
                <td className="py-3.5 px-4 text-xs text-muted-foreground max-w-md">
                  {cat.descripcion || 'Sin descripción'}
                </td>

                {/* Switch Estado */}
                <td className="py-3.5 px-4 text-center">
                  <ToggleSwitch
                    checked={isActivo}
                    onChange={() => onToggleStatus(cat)}
                  />
                </td>

                {/* Acciones */}
                <td className="py-3.5 px-4 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      onClick={() => onEdit(cat)}
                      title="Editar Categoría"
                      className="p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-muted transition-colors cursor-pointer"
                    >
                      <Edit2 className="w-4 h-4 text-pink-500" />
                    </button>
                    <button
                      onClick={() => onDelete(cat)}
                      title="Eliminar Categoría"
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
