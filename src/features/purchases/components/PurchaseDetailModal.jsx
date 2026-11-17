import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import Modal from './Modal';
import PurchaseLinesEditor from './PurchaseLinesEditor';
import { formatDate } from '../utils/format';
import { statusClasses } from '../utils/purchaseStatus';

export default function PurchaseDetailModal({ purchase, fetchDetail, onClose }) {
  const [lines, setLines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    fetchDetail(purchase.id)
      .then((rows) => !cancelled && setLines(rows))
      .catch((err) => !cancelled && setError(err.message))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [fetchDetail, purchase.id]);

  const info = [
    ['Proveedor', purchase.proveedor],
    ['N.º de factura', purchase.factura || '—'],
    ['Fecha', formatDate(purchase.fecha)],
    ['Categoría', purchase.categoria || '—'],
    ['Registrada por', purchase.usuario || '—'],
  ];

  return (
    <Modal
      title={`Compra ${purchase.code}`}
      subtitle={purchase.documento}
      size="xl"
      onClose={onClose}
      footer={
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 rounded-xl text-sm font-bold bg-muted text-foreground hover:bg-muted/80 transition-colors cursor-pointer"
        >
          Cerrar
        </button>
      }
    >
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <dl className="grid grid-cols-2 md:grid-cols-5 gap-3 flex-1 min-w-[280px]">
          {info.map(([label, value]) => (
            <div key={label}>
              <dt className="text-[11px] font-black uppercase tracking-wide text-muted-foreground">{label}</dt>
              <dd className="text-sm font-bold text-foreground truncate">{value}</dd>
            </div>
          ))}
        </dl>
        <span className={`px-3 py-1 rounded-lg border text-xs font-bold ${statusClasses(purchase.estado)}`}>
          {purchase.estado || 'Sin estado'}
        </span>
      </div>

      {error && (
        <p role="alert" className="text-xs font-bold text-red-600 dark:text-red-300">
          {error}
        </p>
      )}

      {loading ? (
        <div className="py-10 flex items-center justify-center gap-2 text-sm font-bold text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin" />
          Cargando detalle...
        </div>
      ) : (
        <PurchaseLinesEditor lines={lines} readOnly />
      )}
    </Modal>
  );
}
