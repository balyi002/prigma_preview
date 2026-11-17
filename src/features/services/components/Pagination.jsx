import { ChevronLeft, ChevronRight } from 'lucide-react';

function getPages(page, total) {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const visible = [...new Set([1, total, page - 1, page, page + 1])]
    .filter((p) => p >= 1 && p <= total)
    .sort((a, b) => a - b);
  const result = [];
  visible.forEach((p, i) => {
    if (i > 0 && p - visible[i - 1] > 1) result.push('gap');
    result.push(p);
  });
  return result;
}

const base =
  'min-w-9 h-9 px-2 rounded-xl border text-xs font-bold flex items-center justify-center transition-colors';

export default function Pagination({ page, totalPages, onChange }) {
  if (totalPages <= 1) return null;

  return (
    <nav className="flex items-center justify-center gap-1.5" aria-label="Paginación">
      <button
        type="button"
        onClick={() => onChange(page - 1)}
        disabled={page === 1}
        aria-label="Página anterior"
        className={`${base} bg-card border-border text-muted-foreground hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer`}
      >
        <ChevronLeft className="w-4 h-4" />
      </button>

      {getPages(page, totalPages).map((p, i) =>
        p === 'gap' ? (
          <span key={`gap-${i}`} className="px-1 text-muted-foreground">
            …
          </span>
        ) : (
          <button
            key={p}
            type="button"
            onClick={() => onChange(p)}
            aria-current={p === page ? 'page' : undefined}
            className={`${base} cursor-pointer ${
              p === page
                ? 'bg-primary border-primary text-white shadow-md shadow-primary/20'
                : 'bg-card border-border text-foreground hover:bg-muted'
            }`}
          >
            {p}
          </button>
        )
      )}

      <button
        type="button"
        onClick={() => onChange(page + 1)}
        disabled={page === totalPages}
        aria-label="Página siguiente"
        className={`${base} bg-card border-border text-foreground hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer`}
      >
        <ChevronRight className="w-4 h-4" />
      </button>
    </nav>
  );
}
