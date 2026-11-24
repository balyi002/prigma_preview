import { useEffect } from 'react';
import { AlertCircle, AlertTriangle, CheckCircle2, X } from 'lucide-react';

const STYLES = {
  success:
    'bg-green-100 text-green-700 border-green-200 dark:bg-green-950/90 dark:text-green-300 dark:border-green-800',
  warning:
    'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950/90 dark:text-amber-300 dark:border-amber-800',
  error: 'bg-red-100 text-red-600 border-red-200 dark:bg-red-950/90 dark:text-red-300 dark:border-red-800',
};

const ICONS = {
  success: CheckCircle2,
  warning: AlertTriangle,
  error: AlertCircle,
};

export default function FeedbackToast({ toast, onClose }) {
  useEffect(() => {
    if (!toast) return undefined;
    const duration = toast.type === 'error' || toast.type === 'warning' ? 6500 : 3500;
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [toast, onClose]);

  if (!toast) return null;
  const Icon = ICONS[toast.type] ?? CheckCircle2;
  const isRich = Boolean(toast.title) || (Array.isArray(toast.items) && toast.items.length > 0);

  return (
    <div
      role={toast.type === 'error' || toast.type === 'warning' ? 'alert' : 'status'}
      className={`fixed bottom-5 right-5 z-[70] max-w-sm flex items-start gap-2.5 border shadow-lg transition-all ${
        isRich ? 'px-4 py-3 rounded-2xl' : 'px-4 py-2.5 rounded-2xl items-center'
      } ${STYLES[toast.type] ?? STYLES.success}`}
    >
      <Icon className={`w-4 h-4 flex-shrink-0 ${isRich ? 'mt-0.5' : ''}`} />
      <div className="flex-1 min-w-0 space-y-1">
        {toast.title && <p className="font-black text-sm leading-tight">{toast.title}</p>}
        {toast.message && (
          <p className={isRich ? 'font-bold text-xs leading-snug' : 'font-bold text-sm leading-snug'}>
            {toast.message}
          </p>
        )}
        {Array.isArray(toast.items) && toast.items.length > 0 && (
          <ul className="list-disc pl-4 space-y-0.5 text-xs font-semibold">
            {toast.items.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        )}
      </div>
      {isRich && (
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar notificación"
          className="p-0.5 rounded-md opacity-70 hover:opacity-100 transition-opacity cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
