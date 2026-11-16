import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function Pagination({ page, total, onPage }) {
  if (total <= 1) return null;

  return (
    <div className="flex items-center justify-between pt-4 border-t border-border">
      <p className="text-xs text-muted-foreground font-bold">
        Página {page} de {total}
      </p>
      <div className="flex items-center gap-1.5">
        <button
          disabled={page <= 1}
          onClick={() => onPage(page - 1)}
          className="p-1.5 rounded-lg border border-border text-foreground hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
          title="Anterior"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        {Array.from({ length: total }, (_, i) => i + 1).map((p) => (
          <button
            key={p}
            onClick={() => onPage(p)}
            className={`w-8 h-8 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              page === p
                ? 'bg-primary text-white shadow-sm shadow-primary/25'
                : 'border border-border text-foreground hover:bg-muted'
            }`}
          >
            {p}
          </button>
        ))}
        <button
          disabled={page >= total}
          onClick={() => onPage(page + 1)}
          className="p-1.5 rounded-lg border border-border text-foreground hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
          title="Siguiente"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
