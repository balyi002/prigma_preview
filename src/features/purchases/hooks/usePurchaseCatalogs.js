import { useCallback, useEffect, useState } from 'react';
import { request } from '../utils/request';

const EMPTY = { estados: [], proveedores: [], productos: [], usuarios: [], categorias: [] };

// Catálogos de solo lectura que necesita el módulo de compras.
// (Se consumen directo de la API: no se importa código de otros módulos del equipo.)
export default function usePurchaseCatalogs() {
  const [data, setData] = useState(EMPTY);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      request('/estados'),
      request('/proveedores'),
      request('/productos'),
      request('/usuarios'),
      request('/categorias-producto'),
    ])
      .then(([estados, proveedores, productos, usuarios, categorias]) => {
        if (!cancelled) setData({ estados, proveedores, productos, usuarios, categorias });
      })
      .catch((err) => !cancelled && setError(err.message))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, []);

  // Categorías que surte un proveedor
  const getSupplierCategories = useCallback((idProveedor) => request(`/proveedores/${idProveedor}/categorias`), []);

  return { ...data, loading, error, getSupplierCategories };
}
