import { useEffect } from 'react';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

const STYLES = {
  success:
    'bg-green-100 text-green-700 border-green-200 dark:bg-green-950/50 dark:text-green-300 dark:border-green-800',
  error: 'bg-red-100 text-red-600 border-red-200 dark:bg-red-950/50 dark:text-red-300 dark:border-red-800',
};

export default function Toast({ toast, onClose }) {
  useEffect(() => {
    if (!toast) return undefined;
    const timer = setTimeout(onClose, toast.type === 'error' ? 6000 : 3500);
    return () => clearTimeout(timer);
  }, [toast, onClose]);

  if (!toast) return null;
  const Icon = toast.type === 'error' ? AlertCircle : CheckCircle2;

  return (
    <div
      role="status"
      className={`fixed bottom-5 right-5 z-[60] max-w-sm flex items-start gap-2.5 px-4 py-3 rounded-xl border shadow-lg text-sm font-bold ${STYLES[toast.type] ?? STYLES.success}`}
    >
      <Icon className="w-4 h-4 mt-0.5 flex-shrink-0" />
      <span>{toast.message}</span>
    </div>
  );
}
