import { useEffect } from 'react';
import { X } from 'lucide-react';

const WIDTHS = { md: 'max-w-md', lg: 'max-w-lg', xl: 'max-w-3xl' };

export default function Modal({ title, subtitle, onClose, children, footer, size = 'lg' }) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className={`bg-popover text-popover-foreground border border-border w-full ${WIDTHS[size]} max-h-[90vh] flex flex-col rounded-xl shadow-2xl`}
      >
        <div className="flex items-start justify-between gap-4 px-6 pt-5 pb-3 border-b border-border">
          <div>
            <h2 className="text-lg font-black text-foreground">{title}</h2>
            {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="text-muted-foreground hover:text-foreground p-1 rounded-lg cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 py-4 overflow-y-auto space-y-4">{children}</div>

        {footer && (
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border">{footer}</div>
        )}
      </div>
    </div>
  );
}
