import { useCallback, useEffect, useState } from 'react';
import { request } from '../utils/request';

// mysql2 devuelve DECIMAL como string y BOOLEAN como 0/1: se normaliza una sola vez aquí.
const normalize = (s) => ({
  ...s,
  precio_venta: Number(s.precio_venta) || 0,
  costo: Number(s.costo) || 0,
  estado: Boolean(s.estado),
});

export default function useServices() {
  const [services, setServices] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setLoading(true);
    setError(null);
    try {
      const [serviceRows, categoryRows] = await Promise.all([
        request('/servicios'),
        request('/categorias-servicio'),
      ]);
      setServices(serviceRows.map(normalize));
      setCategories(categoryRows);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const createService = async (payload) => {
    await request('/servicios', { method: 'POST', body: payload });
    await load({ silent: true });
  };

  const updateService = async (id, payload) => {
    await request(`/servicios/${id}`, { method: 'PUT', body: payload });
    await load({ silent: true });
  };

  // Cambio optimista del interruptor: si el servidor falla, se revierte.
  const toggleStatus = async (service) => {
    const next = !service.estado;
    const setEstado = (value) =>
      setServices((prev) =>
        prev.map((s) => (s.id_servicio === service.id_servicio ? { ...s, estado: value } : s))
      );

    setEstado(next);
    try {
      await request(`/servicios/${service.id_servicio}/estado`, { method: 'PATCH', body: { estado: next } });
    } catch (err) {
      setEstado(service.estado);
      throw err;
    }
  };

  const deleteService = async (id) => {
    await request(`/servicios/${id}`, { method: 'DELETE' });
    await load({ silent: true });
  };

  return {
    services,
    categories,
    loading,
    error,
    reload: load,
    createService,
    updateService,
    toggleStatus,
    deleteService,
  };
}
