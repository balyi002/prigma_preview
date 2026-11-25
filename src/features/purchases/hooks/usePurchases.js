import { useCallback, useEffect, useMemo, useState } from 'react';
import { request } from '../utils/request';
import { calcTotals } from '../utils/purchaseCalculations';
import { mapLine, mapPurchase, readItems, readTotal } from '../utils/purchaseMapper';

export default function usePurchases({ estados, proveedores }) {
  const [rows, setRows] = useState([]);
  const [summaries, setSummaries] = useState({}); // { [id_compra]: { total, items } } (respaldo si la vista no los trae)
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setLoading(true);
    setError(null);
    try {
      setRows(await request('/compras'));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Respaldo: si la vista no devuelve total o # de productos, se calculan desde el detalle.
  useEffect(() => {
    const missing = rows.filter(
      (r) => (readTotal(r) === null || readItems(r) === null) && !summaries[r.id_compra]
    );
    if (missing.length === 0) return undefined;

    let cancelled = false;
    Promise.all(
      missing.map(async (r) => {
        try {
          const lines = (await request(`/compras/${r.id_compra}/detalle`)).map(mapLine);
          return [r.id_compra, { total: calcTotals(lines).total, items: lines.length }];
        } catch {
          return [r.id_compra, { total: null, items: null }];
        }
      })
    ).then((entries) => {
      if (!cancelled) setSummaries((prev) => ({ ...prev, ...Object.fromEntries(entries) }));
    });

    return () => {
      cancelled = true;
    };
  }, [rows, summaries]);

  const purchases = useMemo(
    () =>
      rows.map((row) => {
        const p = mapPurchase(row, { estados, proveedores });
        const s = summaries[p.id];
        return { ...p, total: p.total ?? s?.total ?? null, items: p.items ?? s?.items ?? null };
      }),
    [rows, summaries, estados, proveedores]
  );

  const invalidate = (id) =>
    setSummaries((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });

  const fetchDetail = useCallback(async (id) => (await request(`/compras/${id}/detalle`)).map(mapLine), []);

  // Maestro/detalle: primero la cabecera, luego cada línea. Si una línea falla (trigger),
  // se elimina la cabecera para no dejar una compra a medias.
  const createPurchase = async (header, lines) => {
    const { id } = await request('/compras', { method: 'POST', body: header });
    try {
      for (const line of lines) {
        await request(`/compras/${id}/detalle`, {
          method: 'POST',
          body: {
            id_producto: line.id_producto,
            cantidad: line.cantidad,
            precio_unitario: line.precio_unitario,
            porcentaje_descuento: line.porcentaje_descuento,
            porcentaje_iva: line.porcentaje_iva,
          },
        });
      }
    } catch (err) {
      await request(`/compras/${id}`, { method: 'DELETE' }).catch(() => {});
      throw err;
    }
    await load({ silent: true });
    return id;
  };

  const changeStatus = async (id, idEstado) => {
    await request(`/compras/${id}/estado`, { method: 'PATCH', body: { id_estado: idEstado } });
    invalidate(id);
    await load({ silent: true });
  };

  const updatePurchase = async (id, header) => {
    await request(`/compras/${id}`, { method: 'PUT', body: header });
    invalidate(id);
    await load({ silent: true });
  };

  const addLine = async (id, line) => {
    await request(`/compras/${id}/detalle`, {
      method: 'POST',
      body: {
        id_producto: line.id_producto,
        cantidad: line.cantidad,
        precio_unitario: line.precio_unitario,
        porcentaje_descuento: line.porcentaje_descuento,
        porcentaje_iva: line.porcentaje_iva,
      },
    });
    invalidate(id);
    await load({ silent: true });
  };

  const updateLine = async (id, idDetalle, line) => {
    await request(`/compras/${id}/detalle/${idDetalle}`, {
      method: 'PUT',
      body: {
        id_producto: line.id_producto,
        cantidad: line.cantidad,
        precio_unitario: line.precio_unitario,
        porcentaje_descuento: line.porcentaje_descuento,
        porcentaje_iva: line.porcentaje_iva,
      },
    });
    invalidate(id);
    await load({ silent: true });
  };

  const removeLine = async (id, idDetalle) => {
    await request(`/compras/${id}/detalle/${idDetalle}`, { method: 'DELETE' });
    invalidate(id);
    await load({ silent: true });
  };

  const deletePurchase = async (id) => {
    await request(`/compras/${id}`, { method: 'DELETE' });
    invalidate(id);
    await load({ silent: true });
  };

  return {
    purchases,
    loading,
    error,
    reload: load,
    fetchDetail,
    createPurchase,
    updatePurchase,
    changeStatus,
    addLine,
    updateLine,
    removeLine,
    deletePurchase,
  };
}
