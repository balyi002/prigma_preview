import React from 'react';

export default function StatusBadge({ status }) {
  const norm = String(status || '').trim().toLowerCase();

  if (norm === 'activo' || norm === 'completado' || norm === 'pagado') {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-green-100 text-green-700 dark:bg-green-950/50 dark:text-green-300 border border-green-200 dark:border-green-800">
        {status}
      </span>
    );
  }

  if (norm === 'apartado') {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
        Apartado
      </span>
    );
  }

  if (norm === 'pendiente') {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-orange-100 text-orange-700 dark:bg-orange-950/50 dark:text-orange-300 border border-orange-200 dark:border-orange-800">
        Pendiente
      </span>
    );
  }

  if (norm === 'cancelado' || norm === 'inactivo' || norm === 'agotado') {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-600 dark:bg-red-950/50 dark:text-red-300 border border-red-200 dark:border-red-800">
        {status}
      </span>
    );
  }

  return (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-muted text-muted-foreground border border-border">
      {status || 'Desconocido'}
    </span>
  );
}
