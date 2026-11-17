import { getStatusName } from './purchaseStatus';

// ─────────────────────────────────────────────────────────────────────────────
// vista_compras_resumen es una VISTA: no sabemos con certeza cómo se llaman sus
// columnas de total y de cantidad de productos. Se prueban varios nombres y, si
// ninguno existe, usePurchases calcula ambos valores desde /compras/:id/detalle.
// Si ves los datos en el JSON de GET /api/compras, agrega aquí el nombre real.
// ─────────────────────────────────────────────────────────────────────────────
const TOTAL_KEYS = ['total_compra', 'total', 'total_factura', 'valor_total', 'total_pagar', 'gran_total'];
const ITEM_KEYS = ['cantidad_items', 'total_items', 'num_items', 'items', 'cantidad_productos', 'total_productos'];

const pick = (row, keys) => {
  for (const key of keys) {
    if (row[key] !== undefined && row[key] !== null) return Number(row[key]);
  }
  return null;
};

export const readTotal = (row) => pick(row, TOTAL_KEYS);
export const readItems = (row) => pick(row, ITEM_KEYS);

export function mapPurchase(row, { estados = [], proveedores = [] } = {}) {
  const estado = estados.find((e) => e.id_estado === row.id_estado);
  const proveedor = proveedores.find((p) => p.id_proveedor === row.id_proveedor);

  const statusName =
    row.nombre_estado ??
    row.estado_nombre ??
    (typeof row.estado === 'string' ? row.estado : null) ??
    getStatusName(estado);

  return {
    id: row.id_compra,
    code: `COM${String(row.id_compra).padStart(3, '0')}`,
    factura: row.num_factura_proveedor ?? '',
    idProveedor: row.id_proveedor,
    proveedor: row.nombre_proveedor ?? proveedor?.nombre_proveedor ?? '—',
    documento: proveedor ? `${proveedor.tipo_documento ?? 'Doc'}: ${proveedor.documento}` : '',
    idCategoria: row.id_categoria_producto,
    categoria: row.nombre_categoria ?? '',
    idUsuario: row.id_usuario,
    usuario: row.nombre_usuario ?? '',
    fecha: row.fecha_compra,
    idEstado: row.id_estado,
    estado: statusName ?? '',
    total: readTotal(row),
    items: readItems(row),
  };
}

// Línea de detalle_compras (+ nombre_producto del JOIN)
export const mapLine = (d) => ({
  key: d.id_detalle_compra,
  idDetalle: d.id_detalle_compra,
  id_producto: d.id_producto,
  nombre_producto: d.nombre_producto,
  cantidad: Number(d.cantidad) || 0,
  precio_unitario: Number(d.precio_unitario) || 0,
  porcentaje_descuento: Number(d.porcentaje_descuento) || 0,
  porcentaje_iva: Number(d.porcentaje_iva) || 0,
});
