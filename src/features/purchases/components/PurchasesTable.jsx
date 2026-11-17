import { Eye, Pencil, Trash2 } from 'lucide-react';
import PurchaseStatusSelect from './PurchaseStatusSelect';
import { formatCOP, formatDate } from '../utils/format';
import { isOpenStatus } from '../utils/purchaseStatus';

const th = 'px-5 py-3.5 text-xs font-black uppercase tracking-wide text-muted-foreground';
const iconBtn = 'p-2 rounded-lg transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed';

export default function PurchasesTable({ purchases, estados, onStatusChange, onDetail, onEdit, onDelete }) {
  return (
    <div className="bg-card border border-border rounded-2xl shadow-xs overflow-x-auto">
      <table className="w-full text-sm min-w-[900px]">
        <thead>
          <tr className="border-b border-border text-left">
            <th className={th}>ID</th>
            <th className={th}>Proveedor</th>
            <th className={th}>Fecha</th>
            <th className={th}>Productos</th>
            <th className={`${th} text-right`}>Total</th>
            <th className={th}>Estado</th>
            <th className={th}>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {purchases.map((p) => {
            const open = isOpenStatus(p.estado);
            return (
              <tr key={p.id} className="border-b border-border last:border-b-0 hover:bg-muted/40 transition-colors">
                <td className="px-5 py-3 font-mono text-xs font-medium text-primary">{p.code}</td>

                <td className="px-5 py-3">
                  <p className="font-black text-foreground leading-tight">{p.proveedor}</p>
                  {p.documento && <p className="font-mono text-[11px] text-muted-foreground">{p.documento}</p>}
                </td>

                <td className="px-5 py-3 text-foreground">{formatDate(p.fecha)}</td>

                <td className="px-5 py-3">
                  <span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-bold bg-muted text-foreground">
                    {p.items === null ? '—' : `${p.items} ítem(s)`}
                  </span>
                </td>

                <td className="px-5 py-3 text-right font-black text-primary">
                  {p.total === null ? '—' : formatCOP(p.total)}
                </td>

                <td className="px-5 py-3">
                  <PurchaseStatusSelect purchase={p} estados={estados} onChange={onStatusChange} />
                </td>

                <td className="px-5 py-3">
                  <div className="flex items-center gap-0.5">
                    <button
                      type="button"
                      onClick={() => onEdit(p)}
                      disabled={!open}
                      title={open ? 'Editar productos' : 'Solo se pueden editar compras pendientes o apartadas'}
                      aria-label={`Editar compra ${p.code}`}
                      className={`${iconBtn} text-primary hover:bg-primary/10`}
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDetail(p)}
                      title="Ver detalle"
                      aria-label={`Ver detalle de la compra ${p.code}`}
                      className={`${iconBtn} text-sky-500 hover:bg-sky-500/10`}
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete(p)}
                      disabled={!open}
                      title={open ? 'Eliminar compra' : 'Solo se pueden eliminar compras pendientes o apartadas'}
                      aria-label={`Eliminar compra ${p.code}`}
                      className={`${iconBtn} text-muted-foreground hover:text-destructive hover:bg-destructive/10`}
                    >
                      <Trash2 className="w-4 h-4" />
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
