import React from 'react';
import { Search, X } from 'lucide-react';

export default function ProductFilters({
  search,
  onSearchChange,
  categoryFilter,
  onCategoryFilterChange,
  stockFilter,
  onStockFilterChange,
  categories = []
}) {
  const hasActiveFilters = search || categoryFilter || stockFilter;

  const handleClear = () => {
    onSearchChange('');
    onCategoryFilterChange('');
    onStockFilterChange('');
  };

  return (
    <div className="space-y-3">
      {/* Buscador de texto */}
      <div className="relative w-full">
        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Buscar producto..."
          className="w-full pl-9.5 pr-10 py-2.5 bg-input-background border border-border rounded-xl text-sm font-medium text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-ring transition-all"
        />
        {search && (
          <button
            type="button"
            onClick={() => onSearchChange('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Selectores de Filtrado */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {/* Selector de Categorías */}
        <div>
          <select
            value={categoryFilter}
            onChange={(e) => onCategoryFilterChange(e.target.value)}
            className="w-full px-3.5 py-2 bg-input-background border border-border rounded-xl text-xs font-bold text-foreground outline-none focus:ring-2 focus:ring-ring transition-all cursor-pointer"
          >
            <option value="">Todos (Todas las categorías)</option>
            {categories.map((c) => (
              <option key={c.id_categoria_producto} value={c.id_categoria_producto}>
                {c.nombre_categoria}
              </option>
            ))}
          </select>
        </div>

        {/* Selector de Estado de Stock */}
        <div>
          <select
            value={stockFilter}
            onChange={(e) => onStockFilterChange(e.target.value)}
            className="w-full px-3.5 py-2 bg-input-background border border-border rounded-xl text-xs font-bold text-foreground outline-none focus:ring-2 focus:ring-ring transition-all cursor-pointer"
          >
            <option value="">Todos los stocks</option>
            <option value="optimo">Stock Óptimo</option>
            <option value="critico">Stock Crítico</option>
            <option value="agotado">Agotado (0 unidades)</option>
          </select>
        </div>

        {/* Botón para limpiar filtros si hay alguno activo */}
        {hasActiveFilters && (
          <div className="flex items-center">
            <button
              type="button"
              onClick={handleClear}
              className="text-xs font-bold text-primary hover:underline cursor-pointer"
            >
              Restablecer filtros
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
