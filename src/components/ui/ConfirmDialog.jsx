import React from 'react';
import { AlertTriangle, Trash2 } from 'lucide-react';

export default function ConfirmDialog({
  open,
  title = '¿Confirmar acción?',
  message,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  variant = 'danger',
  onConfirm,
  onCancel
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-popover text-popover-foreground border border-border w-full max-w-md rounded-2xl p-6 shadow-2xl space-y-4">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
            variant === 'danger' ? 'bg-red-100 text-red-600 dark:bg-red-950/50 dark:text-red-400' : 'bg-primary/10 text-primary'
          }`}>
            {variant === 'danger' ? <Trash2 className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
          </div>
          <div>
            <h3 className="font-black text-base text-foreground">{title}</h3>
            {message && <p className="text-xs text-muted-foreground mt-0.5">{message}</p>}
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-3 border-t border-border">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2.5 rounded-xl font-bold text-foreground text-sm bg-muted hover:bg-muted/80 transition-colors cursor-pointer"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`px-4 py-2.5 rounded-xl font-black text-white text-sm transition-all shadow-md cursor-pointer ${
              variant === 'danger'
                ? 'bg-destructive hover:opacity-90 shadow-red-500/20'
                : 'bg-primary hover:opacity-90 shadow-primary/20'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
