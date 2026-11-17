import { useMemo } from 'react';
import { formatCOP, formatDate, dateValue } from '../utils/format';
import { isCanceledStatus } from '../utils/purchaseStatus';

function Stat({ label, children }) {
  return (
    <div className="bg-card border border-border rounded-2xl px-5 py-4 shadow-xs">
      <p className="text-xs font-black uppercase tracking-wide text-muted-foreground">{label}</p>
      <div className="mt-1.5">{children}</div>
    </div>
  );
}

export default function PurchaseStatsCards({ purchases }) {
  const { spent, count, last } = useMemo(() => {
    const latest = purchases.reduce((best, p) => (dateValue(p.fecha) > dateValue(best?.fecha) ? p : best), null);
    return {
      // Una compra cancelada no es dinero gastado
      spent: purchases.filter((p) => !isCanceledStatus(p.estado)).reduce((sum, p) => sum + (p.total ?? 0), 0),
      count: purchases.length,
      last: latest?.fecha,
    };
  }, [purchases]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Stat label="Total gastado">
        <p className="text-xl font-black text-primary">{formatCOP(spent)}</p>
      </Stat>
      <Stat label="Nº de compras">
        <p className="text-xl font-black text-foreground">{count}</p>
      </Stat>
      <Stat label="Última compra">
        <p className="text-xl font-black text-foreground">{last ? formatDate(last) : '—'}</p>
      </Stat>
    </div>
  );
}
