import { Pencil, Trash2 } from 'lucide-react';
import { formatCOP, serviceCode } from '../utils/format';

const th = 'px-5 py-3.5 text-xs font-black uppercase tracking-wide text-muted-foreground';

export default function ServicesTable({ services, onEdit, onToggle, onDelete }) {
  return (
    <div className="bg-card border border-border rounded-2xl shadow-xs overflow-x-auto">
      <table className="w-full text-sm min-w-[740px]">
        <thead>
          <tr className="border-b border-border text-left">
            <th className={th}>Servicio</th>
            <th className={th}>Categoría</th>
            <th className={`${th} text-right`}>Precio</th>
            <th className={`${th} text-right`}>Costo</th>
            <th className={th}>Estado</th>
            <th className={th}>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {services.map((s) => (
            <tr key={s.id_servicio} className="border-b border-border last:border-b-0 hover:bg-muted/40 transition-colors">
              <td className="px-5 py-3">
                <p className="font-black text-foreground leading-tight">{s.nombre_servicio}</p>
                <p className="font-mono text-[11px] font-medium text-primary">{serviceCode(s.id_servicio)}</p>
              </td>

              <td className="px-5 py-3">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-green-100 text-green-700 dark:bg-green-950/50 dark:text-green-300 border border-green-200 dark:border-green-800">
                  {s.nombre_categoria}
                </span>
              </td>

              <td className="px-5 py-3 text-right font-black text-foreground">{formatCOP(s.precio_venta)}</td>
              <td className="px-5 py-3 text-right text-muted-foreground">{formatCOP(s.costo)}</td>

              <td className="px-5 py-3">
                <button
                  type="button"
                  role="switch"
                  aria-checked={s.estado}
                  aria-label={`${s.estado ? 'Desactivar' : 'Activar'} ${s.nombre_servicio}`}
                  onClick={() => onToggle(s)}
                  className={`relative inline-flex h-6 w-10 items-center rounded-full transition-colors cursor-pointer ${
                    s.estado ? 'bg-green-500' : 'bg-switch-background'
                  }`}
                >
                  <span
                    className={`inline-block h-5 w-5 rounded-full bg-white shadow transition-transform ${
                      s.estado ? 'translate-x-[18px]' : 'translate-x-0.5'
                    }`}
                  />
                </button>
              </td>

              <td className="px-5 py-3">
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => onEdit(s)}
                    aria-label={`Editar ${s.nombre_servicio}`}
                    className="p-2 rounded-lg text-primary hover:bg-primary/10 transition-colors cursor-pointer"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onDelete(s)}
                    aria-label={`Eliminar ${s.nombre_servicio}`}
                    className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
