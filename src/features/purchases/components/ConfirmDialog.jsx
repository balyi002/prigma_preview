import { Loader2, Trash2 } from 'lucide-react';
import Modal from './Modal';

export default function ConfirmDialog({
  title,
  message,
  confirmLabel = 'Eliminar',
  loading = false,
  onConfirm,
  onClose,
}) {
  return (
    <Modal
      title={title}
      size="md"
      onClose={onClose}
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-sm font-bold bg-muted text-foreground hover:bg-muted/80 transition-colors cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="px-4 py-2 rounded-xl text-sm font-bold bg-destructive text-white hover:opacity-90 disabled:opacity-60 transition-opacity flex items-center gap-1.5 cursor-pointer"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
            {confirmLabel}
          </button>
        </>
      }
    >
      <p className="text-sm text-muted-foreground">{message}</p>
    </Modal>
  );
}
