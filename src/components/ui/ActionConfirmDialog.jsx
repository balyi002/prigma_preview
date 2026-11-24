import { useEffect } from 'react';
import { AlertTriangle, CheckCircle2, Loader2, Trash2 } from 'lucide-react';

const VARIANTS = {
  danger: {
    badge: 'bg-red-100 text-red-500 dark:bg-red-950/60 dark:text-red-400',
    button: 'bg-destructive hover:opacity-90 shadow-red-500/20',
    Icon: Trash2,
  },
  warning: {
    badge: 'bg-amber-100 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400',
    button: 'bg-amber-500 hover:opacity-90 shadow-amber-500/20',
    Icon: AlertTriangle,
  },
  primary: {
    badge: 'bg-primary/15 text-primary',
    button: 'bg-primary hover:opacity-90 shadow-primary/20',
    Icon: CheckCircle2,
  },
};

export default function ActionConfirmDialog({
  title = '¿Confirmar acción?',
  message,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  variant = 'danger',
  loading = false,
  onConfirm,
  onClose,
}) {
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') {
        e.stopImmediatePropagation();
        if (!loading) onClose();
      }
    };
    document.addEventListener('keydown', onKey, true);
    return () => document.removeEventListener('keydown', onKey, true);
  }, [loading, onClose]);

  const { badge, button, Icon } = VARIANTS[variant] ?? VARIANTS.danger;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs"
      role="alertdialog"
      aria-modal="true"
      aria-label={title}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !loading) onClose();
      }}
    >
      <div className="bg-popover text-popover-foreground border border-border w-full max-w-md rounded-3xl p-6 shadow-2xl space-y-5">
        <div className="flex items-start gap-4">
          <div className={`w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 ${badge}`}>
            <Icon className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h3 className="text-base font-black text-foreground leading-snug">{title}</h3>
            {message && <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">{message}</p>}
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-5 py-2.5 rounded-full text-sm font-bold bg-muted text-foreground hover:bg-muted/80 disabled:opacity-50 transition-colors cursor-pointer"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`px-5 py-2.5 rounded-full text-sm font-black text-white shadow-md disabled:opacity-60 transition-all flex items-center gap-2 cursor-pointer ${button}`}
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
