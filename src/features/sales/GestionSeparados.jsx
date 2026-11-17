import React, { useState } from 'react';
import { 
  BookmarkCheck, Plus, Search, DollarSign, Calendar, 
  User, CheckCircle, Clock, AlertTriangle, X, 
  Receipt, ArrowRight, ShieldCheck, Printer 
} from 'lucide-react';

export default function GestionSeparados() {
  const [busqueda, setBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('Todos');
  
  // Modales
  const [modalNuevo, setModalNuevo] = useState(false);
  const [modalAbonar, setModalAbonar] = useState(null);
  const [modalDetalle, setModalDetalle] = useState(null);

  // Formulario de nuevo separado
  const [formNuevo, setFormNuevo] = useState({
    cliente: '',
    telefono: '',
    documento: '',
    producto: '',
    total: '',
    abonoInicial: '',
    metodoPago: 'Efectivo',
    fechaLimite: '',
    notas: ''
  });

  // Formulario para registrar nuevo abono
  const [montoAbono, setMontoAbono] = useState('');
  const [metodoAbono, setMetodoAbono] = useState('Efectivo');

  // Base de datos simulada de Separados de Papelería
  const [separados, setSeparados] = useState([
    {
      id: 'SEP001',
      cliente: 'Carlos Valencia',
      avatar: 'CV',
      telefono: '312-456-7890',
      documento: '1098234567',
      producto: 'Mochila Totto Escolar + Cartuchera Doble Cierre',
      total: 185000,
      abonado: 90000,
      fechaCreacion: '05/11/2026',
      fechaLimite: '20/11/2026',
      estado: 'En Curso', // En Curso, Liquidado, Vencido
      historialAbonos: [
        { fecha: '05/11/2026 10:15', monto: 50000, metodo: 'Efectivo' },
        { fecha: '12/11/2026 16:30', monto: 40000, metodo: 'Transferencia' }
      ]
    },
    {
      id: 'SEP002',
      cliente: 'Lucía Fernández',
      avatar: 'LF',
      telefono: '315-998-1122',
      documento: '1023456789',
      producto: 'Calculadora Gráfica Casio fx-9860GII',
      total: 320000,
      abonado: 120000,
      fechaCreacion: '01/11/2026',
      fechaLimite: '18/11/2026',
      estado: 'En Curso',
      historialAbonos: [
        { fecha: '01/11/2026 11:00', monto: 120000, metodo: 'Efectivo' }
      ]
    },
    {
      id: 'SEP003',
      cliente: 'Andrés Gómez',
      avatar: 'AG',
      telefono: '300-112-3344',
      documento: '1034567890',
      producto: 'Set de Arte Profesional Acuarelas Faber-Castell 48 piezas',
      total: 140000,
      abonado: 140000,
      fechaCreacion: '28/10/2026',
      fechaLimite: '10/11/2026',
      estado: 'Liquidado',
      historialAbonos: [
        { fecha: '28/10/2026 15:00', monto: 70000, metodo: 'Efectivo' },
        { fecha: '08/11/2026 09:40', monto: 70000, metodo: 'Transferencia' }
      ]
    }
  ]);

  // Formato COP
  const formatoCOP = (m) => new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0
  }).format(m);

  // Cálculos de métricas
  const totalEnSeparados = separados.reduce((acc, s) => acc + s.total, 0);
  const totalAbonado = separados.reduce((acc, s) => acc + s.abonado, 0);
  const saldoPorCobrar = totalEnSeparados - totalAbonado;
  const cantidadActivos = separados.filter(s => s.estado === 'En Curso').length;

  // Filtrado
  const separadosFiltrados = separados.filter(s => {
    const coincideTexto = 
      s.cliente.toLowerCase().includes(busqueda.toLowerCase()) ||
      s.id.toLowerCase().includes(busqueda.toLowerCase()) ||
      s.producto.toLowerCase().includes(busqueda.toLowerCase());
    const coincideEstado = filtroEstado === 'Todos' || s.estado === filtroEstado;
    return coincideTexto && coincideEstado;
  });

  // Guardar nuevo separado
  const handleCrearSeparado = (e) => {
    e.preventDefault();
    const tot = parseFloat(formNuevo.total);
    const ab = parseFloat(formNuevo.abonoInicial || 0);

    if (ab > tot) {
      alert('El abono inicial no puede ser mayor que el total del producto.');
      return;
    }

    const nuevo = {
      id: `SEP00${separados.length + 1}`,
      cliente: formNuevo.cliente,
      avatar: formNuevo.cliente.substring(0, 2).toUpperCase(),
      telefono: formNuevo.telefono,
      documento: formNuevo.documento,
      producto: formNuevo.producto,
      total: tot,
      abonado: ab,
      fechaCreacion: new Date().toLocaleDateString('es-CO'),
      fechaLimite: formNuevo.fechaLimite || '15 días hábiles',
      estado: ab >= tot ? 'Liquidado' : 'En Curso',
      historialAbonos: ab > 0 ? [
        { 
          fecha: new Date().toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' }), 
          monto: ab, 
          metodo: formNuevo.metodoPago 
        }
      ] : []
    };

    setSeparados([nuevo, ...separados]);
    setModalNuevo(false);
    setFormNuevo({
      cliente: '',
      telefono: '',
      documento: '',
      producto: '',
      total: '',
      abonoInicial: '',
      metodoPago: 'Efectivo',
      fechaLimite: '',
      notas: ''
    });
  };

  // Registrar abono a un separado existente
  const handleRegistrarAbono = (e) => {
    e.preventDefault();
    const monto = parseFloat(montoAbono);
    if (!monto || monto <= 0) return;

    const saldoPendiente = modalAbonar.total - modalAbonar.abonado;
    if (monto > saldoPendiente) {
      alert(`El monto ($ ${monto}) supera el saldo pendiente de esta cuenta ($ ${saldoPendiente}).`);
      return;
    }

    const nuevoAbonado = modalAbonar.abonado + monto;
    const nuevoEstado = nuevoAbonado >= modalAbonar.total ? 'Liquidado' : 'En Curso';

    const actualizado = {
      ...modalAbonar,
      abonado: nuevoAbonado,
      estado: nuevoEstado,
      historialAbonos: [
        ...modalAbonar.historialAbonos,
        {
          fecha: new Date().toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' }),
          monto: monto,
          metodo: metodoAbono
        }
      ]
    };

    setSeparados(separados.map(s => s.id === modalAbonar.id ? actualizado : s));
    setModalAbonar(null);
    setMontoAbono('');
  };

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            VENTAS · SISTEMA DE APARTADOS
          </span>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Gestión de Separados</h1>
          <p className="text-sm text-muted-foreground">
            Reserva de artículos de papelería con pago por abonos y control de plazos
          </p>
        </div>

        <button
          onClick={() => setModalNuevo(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Nuevo Separado</span>
        </button>
      </div>

      {/* Métricas / KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl border border-border bg-card shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-muted-foreground">Total en Separados</span>
            <BookmarkCheck className="w-4 h-4 text-rose-500" />
          </div>
          <p className="text-xl font-black text-foreground">{formatoCOP(totalEnSeparados)}</p>
          <span className="text-[11px] text-muted-foreground">Valor total en mercancía apartada</span>
        </div>

        <div className="p-4 rounded-2xl border border-border bg-card shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-muted-foreground">Recaudado en Abonos</span>
            <DollarSign className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-xl font-black text-emerald-600">{formatoCOP(totalAbonado)}</p>
          <span className="text-[11px] text-muted-foreground">Dinero ingresado a caja</span>
        </div>

        <div className="p-4 rounded-2xl border border-border bg-card shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-muted-foreground">Saldo por Cobrar</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-xl font-black text-amber-600">{formatoCOP(saldoPorCobrar)}</p>
          <span className="text-[11px] text-muted-foreground">Pendiente para entrega de productos</span>
        </div>

        <div className="p-4 rounded-2xl border border-border bg-card shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-muted-foreground">Separados Activos</span>
            <ShieldCheck className="w-4 h-4 text-violet-500" />
          </div>
          <p className="text-xl font-black text-foreground">{cantidadActivos}</p>
          <span className="text-[11px] text-muted-foreground">Clientes con plan separe en curso</span>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por cliente, ID o producto..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-rose-500 shadow-sm"
          />
        </div>

        <select
          value={filtroEstado}
          onChange={(e) => setFiltroEstado(e.target.value)}
          className="w-full sm:w-auto px-3 py-2 text-xs rounded-xl border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-rose-500 shadow-sm font-medium"
        >
          <option value="Todos">Todos los estados</option>
          <option value="En Curso">En Curso</option>
          <option value="Liquidado">Liquidados / Entregados</option>
          <option value="Vencido">Vencidos</option>
        </select>
      </div>

      {/* Tabla de Separados */}
      <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-muted/50 border-b border-border text-muted-foreground font-semibold">
                <th className="py-3.5 px-4">Folio</th>
                <th className="py-3.5 px-4">Cliente / Contacto</th>
                <th className="py-3.5 px-4">Artículo de Papelería</th>
                <th className="py-3.5 px-4">Total</th>
                <th className="py-3.5 px-4">Progreso de Abono</th>
                <th className="py-3.5 px-4">Saldo Pendiente</th>
                <th className="py-3.5 px-4">Límite</th>
                <th className="py-3.5 px-4 text-center">Estado</th>
                <th className="py-3.5 px-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {separadosFiltrados.length === 0 ? (
                <tr>
                  <td colSpan="9" className="text-center py-8 text-muted-foreground">
                    No hay apartados registrados con los filtros seleccionados.
                  </td>
                </tr>
              ) : (
                separadosFiltrados.map((item) => {
                  const saldo = item.total - item.abonado;
                  const porcentaje = Math.min(100, Math.round((item.abonado / item.total) * 100));

                  return (
                    <tr key={item.id} className="hover:bg-muted/40 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-rose-500">{item.id}</td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-rose-500/10 text-rose-600 font-bold text-[11px] flex items-center justify-center">
                            {item.avatar}
                          </div>
                          <div>
                            <p className="font-semibold text-foreground">{item.cliente}</p>
                            <span className="text-[10px] text-muted-foreground">{item.telefono}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-medium text-foreground max-w-[200px] truncate">
                        {item.producto}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-foreground">{formatoCOP(item.total)}</td>
                      <td className="py-3.5 px-4 min-w-[140px]">
                        <div className="space-y-1">
                          <div className="flex justify-between text-[10px] font-semibold text-muted-foreground">
                            <span>{formatoCOP(item.abonado)}</span>
                            <span>{porcentaje}%</span>
                          </div>
                          <div className="w-full h-1.5 rounded-full bg-muted overflow-hidden">
                            <div 
                              className={`h-full rounded-full transition-all duration-300 ${
                                porcentaje >= 100 ? 'bg-emerald-500' : 'bg-rose-500'
                              }`}
                              style={{ width: `${porcentaje}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-black">
                        {saldo <= 0 ? (
                          <span className="text-emerald-500 font-bold">¡Pagado!</span>
                        ) : (
                          <span className="text-rose-500">{formatoCOP(saldo)}</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-muted-foreground font-medium">{item.fechaLimite}</td>
                      <td className="py-3.5 px-4 text-center">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                          item.estado === 'Liquidado'
                            ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                            : item.estado === 'En Curso'
                            ? 'bg-amber-500/10 text-amber-600 border-amber-500/20'
                            : 'bg-rose-500/10 text-rose-600 border-rose-500/20'
                        }`}>
                          {item.estado}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {item.estado === 'En Curso' && (
                            <button
                              onClick={() => {
                                setModalAbonar(item);
                                setMontoAbono('');
                              }}
                              className="px-2.5 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-[11px] transition-all cursor-pointer shadow-sm"
                            >
                              Abonar
                            </button>
                          )}
                          <button
                            onClick={() => setModalDetalle(item)}
                            title="Ver historial de abonos"
                            className="p-1.5 rounded-lg border border-border hover:bg-muted text-muted-foreground hover:text-foreground transition-all cursor-pointer"
                          >
                            <Receipt className="w-4 h-4 text-violet-500" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL 1: NUEVO SEPARADO */}
      {modalNuevo && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card w-full max-w-lg rounded-2xl border border-border shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
            <div className="px-5 py-4 border-b border-border flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-rose-500 uppercase tracking-widest">NUEVO REGISTRO</span>
                <h3 className="text-base font-bold text-foreground">Apartar Producto de Papelería</h3>
              </div>
              <button 
                onClick={() => setModalNuevo(false)}
                className="p-1 rounded-lg hover:bg-muted text-muted-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCrearSeparado} className="p-5 space-y-3.5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-muted-foreground font-semibold mb-1">Nombre del Cliente *</label>
                  <input
                    required
                    type="text"
                    placeholder="Ej. Juan Pérez"
                    value={formNuevo.cliente}
                    onChange={(e) => setFormNuevo({ ...formNuevo, cliente: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-border bg-card text-foreground focus:ring-2 focus:ring-rose-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-muted-foreground font-semibold mb-1">Teléfono / WhatsApp *</label>
                  <input
                    required
                    type="tel"
                    placeholder="Ej. 300 123 4567"
                    value={formNuevo.telefono}
                    onChange={(e) => setFormNuevo({ ...formNuevo, telefono: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-border bg-card text-foreground focus:ring-2 focus:ring-rose-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-muted-foreground font-semibold mb-1">Producto a Separar *</label>
                <input
                  required
                  type="text"
                  placeholder="Ej. Maletín Escolar Totto + Termo Metálico"
                  value={formNuevo.producto}
                  onChange={(e) => setFormNuevo({ ...formNuevo, producto: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-border bg-card text-foreground focus:ring-2 focus:ring-rose-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-muted-foreground font-semibold mb-1">Precio Total ($ COP) *</label>
                  <input
                    required
                    type="number"
                    min="1000"
                    placeholder="Ej. 150000"
                    value={formNuevo.total}
                    onChange={(e) => setFormNuevo({ ...formNuevo, total: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-border bg-card text-foreground font-bold focus:ring-2 focus:ring-rose-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-muted-foreground font-semibold mb-1">Abono Inicial ($ COP)</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="Ej. 50000"
                    value={formNuevo.abonoInicial}
                    onChange={(e) => setFormNuevo({ ...formNuevo, abonoInicial: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-border bg-card text-foreground font-bold focus:ring-2 focus:ring-rose-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-muted-foreground font-semibold mb-1">Método de Pago del Abono</label>
                  <select
                    value={formNuevo.metodoPago}
                    onChange={(e) => setFormNuevo({ ...formNuevo, metodoPago: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-border bg-card text-foreground focus:ring-2 focus:ring-rose-500 focus:outline-none"
                  >
                    <option value="Efectivo">Efectivo</option>
                    <option value="Transferencia">Transferencia / Nequi / Daviplata</option>
                  </select>
                </div>
                <div>
                  <label className="block text-muted-foreground font-semibold mb-1">Fecha Límite para Retirar *</label>
                  <input
                    required
                    type="date"
                    value={formNuevo.fechaLimite}
                    onChange={(e) => setFormNuevo({ ...formNuevo, fechaLimite: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-border bg-card text-foreground focus:ring-2 focus:ring-rose-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-border flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalNuevo(false)}
                  className="px-4 py-2 rounded-xl border border-border hover:bg-muted text-xs font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs shadow-md"
                >
                  Guardar Separado
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: REGISTRAR ABONO */}
      {modalAbonar && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card w-full max-w-md rounded-2xl border border-border shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
            <div className="px-5 py-4 border-b border-border flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">INGRESAR PAGO</span>
                <h3 className="text-base font-bold text-foreground">Abonar a {modalAbonar.id}</h3>
              </div>
              <button 
                onClick={() => setModalAbonar(null)}
                className="p-1 rounded-lg hover:bg-muted text-muted-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRegistrarAbono} className="p-5 space-y-4 text-xs">
              <div className="bg-muted/40 p-3 rounded-xl border border-border space-y-1">
                <p className="font-semibold text-foreground text-sm">{modalAbonar.cliente}</p>
                <p className="text-muted-foreground truncate">{modalAbonar.producto}</p>
                <div className="flex justify-between pt-2 border-t border-border mt-2 font-bold">
                  <span>Saldo Restante:</span>
                  <span className="text-rose-500 font-black">
                    {formatoCOP(modalAbonar.total - modalAbonar.abonado)}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-muted-foreground font-semibold mb-1">Monto a Abonar ($ COP) *</label>
                <input
                  required
                  autoFocus
                  type="number"
                  min="500"
                  max={modalAbonar.total - modalAbonar.abonado}
                  placeholder="Ingrese el monto recibido"
                  value={montoAbono}
                  onChange={(e) => setMontoAbono(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-border bg-card text-foreground font-black text-base focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-muted-foreground font-semibold mb-1">Método de Pago</label>
                <select
                  value={metodoAbono}
                  onChange={(e) => setMetodoAbono(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-border bg-card text-foreground focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                >
                  <option value="Efectivo">Efectivo</option>
                  <option value="Transferencia">Transferencia / Nequi / Daviplata</option>
                </select>
              </div>

              <div className="pt-3 border-t border-border flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalAbonar(null)}
                  className="px-4 py-2 rounded-xl border border-border hover:bg-muted text-xs font-semibold"
                >
                  Cerrar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs shadow-md"
                >
                  Confirmar Abono
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: HISTORIAL DE ABONOS Y DETALLE */}
      {modalDetalle && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card w-full max-w-lg rounded-2xl border border-border shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
            <div className="px-5 py-4 border-b border-border flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-violet-500 uppercase tracking-widest">HISTORIAL COMPLETO</span>
                <h3 className="text-base font-bold text-foreground">Detalle del Separado {modalDetalle.id}</h3>
              </div>
              <button 
                onClick={() => setModalDetalle(null)}
                className="p-1 rounded-lg hover:bg-muted text-muted-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3 bg-muted/40 p-3 rounded-xl border border-border">
                <div>
                  <span className="text-muted-foreground">Cliente:</span>
                  <p className="font-bold text-foreground">{modalDetalle.cliente}</p>
                  <span className="text-[10px] text-muted-foreground">{modalDetalle.telefono}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Fecha Límite:</span>
                  <p className="font-bold text-foreground">{modalDetalle.fechaLimite}</p>
                </div>
                <div className="col-span-2">
                  <span className="text-muted-foreground">Artículo:</span>
                  <p className="font-semibold text-foreground">{modalDetalle.producto}</p>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-foreground mb-2">Historial de Abonos Recibidos</h4>
                <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                  {modalDetalle.historialAbonos.map((ab, i) => (
                    <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-card border border-border">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-emerald-500" />
                        <div>
                          <p className="font-semibold text-foreground">{formatoCOP(ab.monto)}</p>
                          <span className="text-[10px] text-muted-foreground">{ab.fecha}</span>
                        </div>
                      </div>
                      <span className="text-[11px] font-medium text-muted-foreground">{ab.metodo}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-2 border-t border-border flex items-center justify-between text-sm font-bold">
                <span className="text-muted-foreground">Saldo Restante:</span>
                <span className={`text-base font-black ${
                  modalDetalle.total - modalDetalle.abonado <= 0 ? 'text-emerald-500' : 'text-rose-500'
                }`}>
                  {formatoCOP(modalDetalle.total - modalDetalle.abonado)}
                </span>
              </div>
            </div>

            <div className="px-5 py-3 border-t border-border bg-muted/20 flex items-center justify-end gap-2">
              <button
                onClick={() => setModalDetalle(null)}
                className="px-4 py-2 rounded-xl border border-border hover:bg-muted text-xs font-semibold"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}