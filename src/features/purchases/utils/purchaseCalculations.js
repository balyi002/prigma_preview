const num = (v) => Number(v) || 0;

// Descuento sobre el bruto, luego IVA sobre la base ya descontada.
export function calcLine({ cantidad, precio_unitario, porcentaje_descuento = 0, porcentaje_iva = 0 }) {
  const bruto = num(cantidad) * num(precio_unitario);
  const descuento = (bruto * num(porcentaje_descuento)) / 100;
  const base = bruto - descuento;
  const iva = (base * num(porcentaje_iva)) / 100;
  return { bruto, descuento, iva, total: base + iva };
}

export function calcTotals(lines) {
  return lines.reduce(
    (acc, line) => {
      const l = calcLine(line);
      return {
        bruto: acc.bruto + l.bruto,
        descuento: acc.descuento + l.descuento,
        iva: acc.iva + l.iva,
        total: acc.total + l.total,
      };
    },
    { bruto: 0, descuento: 0, iva: 0, total: 0 }
  );
}
