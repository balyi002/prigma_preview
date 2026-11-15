import React, { useEffect } from 'react';
import { X } from 'lucide-react';

export default function Modal({ open, onClose, title, children, wide = false }) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && open) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className={`bg-popover text-popover-foreground border border-border w-full rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden ${
          wide ? 'max-w-3xl' : 'max-w-lg'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="text-lg font-black text-foreground">{title}</h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground p-1.5 rounded-lg hover:bg-muted transition-colors cursor-pointer"
            title="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-4">
          {children}
        </div>
      </div>
    </div>
  );
}
