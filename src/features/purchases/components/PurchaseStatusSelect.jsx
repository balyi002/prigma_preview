import { getStatusName, statusClasses } from '../utils/purchaseStatus';

export default function PurchaseStatusSelect({ purchase, estados, disabled, onChange }) {
  return (
    <select
      value={purchase.idEstado ?? ''}
      disabled={disabled}
      onChange={(e) => onChange(purchase, Number(e.target.value))}
      aria-label={`Estado de la compra ${purchase.code}`}
      className={`pl-2.5 pr-1.5 py-1 rounded-lg border text-xs font-bold outline-none focus:ring-2 focus:ring-ring disabled:opacity-60 cursor-pointer ${statusClasses(purchase.estado)}`}
    >
      {estados.map((e) => (
        <option key={e.id_estado} value={e.id_estado} className="bg-popover text-popover-foreground">
          {getStatusName(e)}
        </option>
      ))}
    </select>
  );
}
