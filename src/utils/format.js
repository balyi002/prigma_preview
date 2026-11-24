// Formateo oficial de moneda en Pesos Colombianos (COP) sin decimales
export const formatCOP = (val) => {
  const num = Number(val) || 0;
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0
  }).format(num);
};

// Impresión de ticket térmico oficial para pedidos y ventas
export const printTicket = (order) => {
  const w = window.open('', '_blank', 'width=400,height=620');
  if (!w) {
    alert('Habilita las ventanas emergentes en tu navegador para imprimir el ticket.');
    return;
  }

  const items = order.items || order.productos || [];
  const rows = items.map((i) => {
    const name = i.nombre_producto || i.name || 'Producto';
    const qty = i.cantidad || i.qty || 1;
    const price = Number(i.precio_unitario || i.price || 0);
    const sub = qty * price;
    return `<tr>
      <td>${name}</td>
      <td style="text-align:center">${qty}</td>
      <td style="text-align:right">${formatCOP(price)}</td>
      <td style="text-align:right">${formatCOP(sub)}</td>
    </tr>`;
  }).join('');

  const total = Number(order.total || 0);
  const iva = Number(order.iva_incluido || order.iva || Math.round(total * 19 / 119));
  const subtotal = total - iva;
  const fechaStr = order.fecha || (order.fecha_pedido ? new Date(order.fecha_pedido).toLocaleDateString('es-CO') : new Date().toLocaleDateString('es-CO'));
  const horaStr = order.hora || (order.fecha_pedido ? new Date(order.fecha_pedido).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }) : new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }));
  const idStr = order.id || (order.id_pedido ? `PED${String(order.id_pedido).padStart(3, '0')}` : 'PED-000');

  w.document.write(`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Ticket ${idStr}</title>
  <style>
    body { font-family: monospace; font-size: 12px; padding: 16px; max-width: 320px; margin: auto; color: #111; }
    h2 { text-align: center; font-size: 16px; margin: 0 0 2px; }
    p.sub { text-align: center; font-size: 11px; color: #666; margin: 1px 0; }
    hr { border: none; border-top: 1px dashed #999; margin: 8px 0; }
    table { width: 100%; border-collapse: collapse; font-size: 11px; }
    th, td { padding: 3px 2px; }
    th { border-bottom: 1px solid #ccc; text-align: left; }
    .tot { font-weight: bold; font-size: 12px; }
    .thanks { text-align: center; margin-top: 12px; font-size: 11px; color: #555; }
    @media print { body { padding: 4px; } }
  </style>
</head>
<body>
  <div style="text-align:center; margin-bottom: 6px;">
    <img src="https://github.com/user-attachments/assets/f6f8df77-3049-4267-8d54-f054466943aa" alt="Logo PRIGMA" style="width: 48px; height: 48px; object-fit: contain;" />
  </div>
  <h2>Variedades Carito</h2>
  <p class="sub">CRA. 25 #75C-01 Int. 499 · Medellín</p>
  <p class="sub">NIT: 901.234.567-8</p>
  <hr>
  <p style="font-size: 11px; margin: 4px 0;">
    <strong>${idStr}</strong> | ${fechaStr} ${horaStr}<br>
    Cliente: <strong>${order.nombre_cliente || order.cliente || 'Consumidor Final'}</strong><br>
    Pago: ${order.metodo_pago || order.metodoPago || 'Efectivo'} | Estado: ${order.nombre_estado || order.estado || 'Completado'}
  </p>
  <hr>
  <table>
    <thead>
      <tr>
        <th>Artículo</th>
        <th style="text-align:center">Cant</th>
        <th style="text-align:right">Precio</th>
        <th style="text-align:right">Total</th>
      </tr>
    </thead>
    <tbody>${rows || '<tr><td colspan="4">Venta directa</td></tr>'}</tbody>
  </table>
  <hr>
  <table>
    <tr><td>Subtotal (sin IVA):</td><td style="text-align:right">${formatCOP(subtotal)}</td></tr>
    <tr><td>IVA incluido (19%):</td><td style="text-align:right">${formatCOP(iva)}</td></tr>
    <tr class="tot"><td>TOTAL:</td><td style="text-align:right">${formatCOP(total)}</td></tr>
  </table>
  <p class="thanks">¡Gracias por su compra!<br>Sistema PRIGMA v4.0</p>
</body>
</html>`);
  w.document.close();
  setTimeout(() => {
    w.focus();
    w.print();
  }, 400);
};
