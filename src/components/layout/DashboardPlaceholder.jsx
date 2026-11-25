import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  TrendingUp,
  DollarSign,
  FileText,
  ShoppingBag,
  Calendar,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ArrowUpRight,
  ArrowDownRight,
  CreditCard,
  Wallet,
  Loader2,
  AlertCircle
} from 'lucide-react';
import api from '../../utils/api';
import { formatCOP } from '../../utils/format';
import StatusBadge from '../ui/StatusBadge';
import FeedbackToast from '../ui/FeedbackToast';

const PERIOD_OPTIONS = [
  { id: 'anio', label: 'Año' },
  { id: 'mes', label: 'Mes' },
  { id: 'semana', label: 'Semana' },
  { id: 'dia', label: 'Día' },
];

const MONTHS_FULL = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

const MONTHS_SHORT = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
const WEEKDAYS_SHORT = ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá', 'Do'];

const pad2 = (n) => String(n).padStart(2, '0');

const parseISODateUTC = (iso) => {
  const [y, m, d] = String(iso || '2026-11-24').slice(0, 10).split('-').map(Number);
  return new Date(Date.UTC(y || 2026, (m || 1) - 1, d || 1));
};

const formatISODateUTC = (dt) =>
  `${dt.getUTCFullYear()}-${pad2(dt.getUTCMonth() + 1)}-${pad2(dt.getUTCDate())}`;

const getTodayLocalISO = () => {
  const now = new Date();
  return `${now.getFullYear()}-${pad2(now.getMonth() + 1)}-${pad2(now.getDate())}`;
};

const getWeekBoundsUTC = (iso) => {
  const ref = parseISODateUTC(iso);
  const dow = (ref.getUTCDay() + 6) % 7; // Lu=0 .. Do=6
  const start = new Date(Date.UTC(ref.getUTCFullYear(), ref.getUTCMonth(), ref.getUTCDate() - dow));
  const end = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate() + 6));
  return { start, end, startIso: formatISODateUTC(start), endIso: formatISODateUTC(end) };
};

const getPeriodDisplayLabel = (tipo, iso) => {
  const dt = parseISODateUTC(iso);
  const y = dt.getUTCFullYear();
  const m = dt.getUTCMonth();
  const d = dt.getUTCDate();

  if (tipo === 'dia') {
    return `${pad2(d)} ${MONTHS_SHORT[m]} ${y}`;
  }
  if (tipo === 'semana') {
    const { start, end } = getWeekBoundsUTC(iso);
    return `${pad2(start.getUTCDate())} ${MONTHS_SHORT[start.getUTCMonth()]} – ${pad2(end.getUTCDate())} ${MONTHS_SHORT[end.getUTCMonth()]} ${end.getUTCFullYear()}`;
  }
  if (tipo === 'anio') {
    return `Año ${y}`;
  }
  return `${MONTHS_FULL[m]} ${y}`;
};

const formatDateTimeES = (val) => {
  if (!val) return '';
  const dt = new Date(val);
  if (Number.isNaN(dt.getTime())) return String(val);
  return dt.toLocaleString('es-CO', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const getInitials = (name) => {
  const parts = String(name || 'CL').trim().split(/\s+/);
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  return parts[0].substring(0, 2).toUpperCase();
};

const buildEmptyChart = (tipo, fechaRef) => {
  if (tipo === 'dia') {
    return [8, 10, 12, 14, 16, 18, 20].map((h) => ({
      label: `${pad2(h)}:00`,
      sublabel: `${pad2(h)}-${pad2(h + 2)}h`,
      total: 0,
      ventasCount: 0,
      porcentaje: 8,
    }));
  }
  if (tipo === 'semana') {
    const { start } = getWeekBoundsUTC(fechaRef);
    return ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map((diaNombre, idx) => {
      const dt = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate() + idx));
      return {
        label: diaNombre,
        sublabel: `${pad2(dt.getUTCDate())}/${pad2(dt.getUTCMonth() + 1)}`,
        total: 0,
        ventasCount: 0,
        porcentaje: 8,
      };
    });
  }
  if (tipo === 'anio') {
    const yr = fechaRef.slice(0, 4);
    return MONTHS_SHORT.map((mesNombre, idx) => ({
      label: mesNombre,
      sublabel: `${yr}-${pad2(idx + 1)}`,
      total: 0,
      ventasCount: 0,
      porcentaje: 8,
    }));
  }
  const dt = parseISODateUTC(fechaRef);
  const daysInMonth = new Date(Date.UTC(dt.getUTCFullYear(), dt.getUTCMonth() + 1, 0)).getUTCDate();
  const ranges = [[1, 7], [8, 14], [15, 21], [22, 28]];
  if (daysInMonth > 28) ranges.push([29, daysInMonth]);
  return ranges.map(([s, e], idx) => ({
    label: `Sem ${idx + 1}`,
    sublabel: `${pad2(s)}-${pad2(e)}`,
    total: 0,
    ventasCount: 0,
    porcentaje: 8,
  }));
};

// Respaldo cliente usando /api/pedidos si el backend aún no fue reiniciado con /api/dashboard
const computeFallbackFromPedidos = (pedidos, tipo, fechaRef) => {
  const ref = parseISODateUTC(fechaRef);
  const y = ref.getUTCFullYear();
  const m = ref.getUTCMonth();
  let start, end;
  if (tipo === 'dia') {
    start = new Date(ref);
    end = new Date(ref);
  } else if (tipo === 'semana') {
    ({ start, end } = getWeekBoundsUTC(fechaRef));
  } else if (tipo === 'anio') {
    start = new Date(Date.UTC(y, 0, 1));
    end = new Date(Date.UTC(y, 11, 31));
  } else {
    start = new Date(Date.UTC(y, m, 1));
    end = new Date(Date.UTC(y, m + 1, 0));
  }
  const startIso = formatISODateUTC(start);
  const endIso = formatISODateUTC(end);

  const enPeriodo = (Array.isArray(pedidos) ? pedidos : []).filter((p) => {
    const iso = String(p.fecha_pedido || '').slice(0, 10);
    return iso >= startIso && iso <= endIso;
  });
  const completadas = enPeriodo.filter((p) => (p.nombre_estado || '').toLowerCase() === 'completado');
  const activos = enPeriodo.filter((p) => ['apartado', 'pendiente'].includes((p.nombre_estado || '').toLowerCase()));
  const ingresos = completadas.reduce((acc, p) => acc + Number(p.total || 0), 0);
  const ventasCount = completadas.length;
  const ticketPromedio = ventasCount > 0 ? ingresos / ventasCount : 0;

  const baseChart = buildEmptyChart(tipo, fechaRef).map((bucket, idx) => {
    let matches = [];
    if (tipo === 'dia') {
      const hStart = 8 + idx * 2;
      matches = completadas.filter((p) => {
        const hr = new Date(p.fecha_pedido).getHours();
        return hr >= hStart && hr < hStart + 2;
      });
    } else if (tipo === 'semana') {
      const dt = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate() + idx));
      const iso = formatISODateUTC(dt);
      matches = completadas.filter((p) => String(p.fecha_pedido || '').slice(0, 10) === iso);
    } else if (tipo === 'anio') {
      matches = completadas.filter((p) => String(p.fecha_pedido || '').startsWith(bucket.sublabel));
    } else {
      const [ds, de] = bucket.sublabel.split('-').map(Number);
      const ym = startIso.slice(0, 7);
      matches = completadas.filter((p) => {
        const iso = String(p.fecha_pedido || '').slice(0, 10);
        return iso >= `${ym}-${pad2(ds)}` && iso <= `${ym}-${pad2(de)}`;
      });
    }
    return {
      ...bucket,
      total: matches.reduce((acc, p) => acc + Number(p.total || 0), 0),
      ventasCount: matches.length,
    };
  });

  const maxTotal = Math.max(...baseChart.map((b) => b.total), 0);
  const chart = baseChart.map((b) => ({
    ...b,
    porcentaje: maxTotal > 0 ? Math.max(b.total > 0 ? 14 : 8, Math.round((b.total / maxTotal) * 100)) : 8,
  }));

  return {
    period: { tipo, fecha: fechaRef, label: getPeriodDisplayLabel(tipo, fechaRef) },
    kpis: {
      ingresos,
      variacionIngresos: 0,
      ventasCount,
      variacionVentas: 0,
      ventasEfectivo: completadas.filter((p) => p.metodo_pago === 'Efectivo').length,
      ventasTransferencia: completadas.filter((p) => p.metodo_pago === 'Transferencia').length,
      pedidosActivos: activos.length,
      porLiquidar: activos.filter((p) => Number(p.saldo || 0) > 0).length,
      saldoPendiente: activos.reduce((acc, p) => acc + Number(p.saldo || 0), 0),
      ticketPromedio,
      variacionTicket: 0,
    },
    chart,
    topProductos: [],
    totalUnidades: 0,
    ultimasVentas: completadas.slice(0, 6).map((v) => ({
      id_pedido: v.id_pedido,
      codigo: `VTA-${String(v.id_pedido).padStart(3, '0')}`,
      cliente: v.nombre_cliente,
      metodo: v.metodo_pago || 'Efectivo',
      fecha_pedido: v.fecha_pedido,
      total: Number(v.total || 0),
      estado: v.nombre_estado,
    })),
  };
};

export default function Dashboard() {
  const [tipoPeriodo, setTipoPeriodo] = useState('mes');
  const [fechaRef, setFechaRef] = useState('2026-11-24');
  const [pickerOpen, setPickerOpen] = useState(false);
  const [viewYear, setViewYear] = useState(2026);
  const [viewMonth, setViewMonth] = useState(10); // 0-indexed (10 = Noviembre)
  const pickerContainerRef = useRef(null);

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState(null);

  const closeToast = useCallback(() => setToast(null), []);

  // Cerrar popover al hacer clic fuera o presionar Escape
  useEffect(() => {
    if (!pickerOpen) return undefined;
    const handleOutside = (e) => {
      if (pickerContainerRef.current && !pickerContainerRef.current.contains(e.target)) {
        setPickerOpen(false);
      }
    };
    const handleEsc = (e) => {
      if (e.key === 'Escape') setPickerOpen(false);
    };
    document.addEventListener('mousedown', handleOutside);
    document.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('mousedown', handleOutside);
      document.removeEventListener('keydown', handleEsc);
    };
  }, [pickerOpen]);

  const fetchDashboard = useCallback(async (tipo, fecha) => {
    try {
      setLoading(true);
      setError('');
      const res = await api.get('/dashboard', { params: { tipo, fecha } });
      setData(res.data);
    } catch (err) {
      // Si /api/dashboard responde 404 (servidor previo sin reiniciar), intentar respaldo con /api/pedidos
      if (err.response?.status === 404) {
        try {
          const pedRes = await api.get('/pedidos');
          setData(computeFallbackFromPedidos(pedRes.data, tipo, fecha));
          return;
        } catch {
          // cae al manejo normal de error
        }
      }
      const msg =
        err.response?.data?.error ||
        (err.code === 'ERR_NETWORK'
          ? 'No se pudo conectar con el servidor de PRIGMA.'
          : err.message || 'Error al cargar el dashboard.');
      setError(msg);
      setToast({ type: 'error', title: 'Error de carga', message: msg });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard(tipoPeriodo, fechaRef);
  }, [tipoPeriodo, fechaRef, fetchDashboard]);

  const togglePicker = () => {
    if (!pickerOpen) {
      const dt = parseISODateUTC(fechaRef);
      setViewYear(dt.getUTCFullYear());
      setViewMonth(dt.getUTCMonth());
    }
    setPickerOpen((prev) => !prev);
  };

  const handleSelectDate = (iso) => {
    setFechaRef(iso);
    setPickerOpen(false);
  };

  const handleSelectMonth = (monthIdx) => {
    setFechaRef(`${viewYear}-${pad2(monthIdx + 1)}-01`);
    setPickerOpen(false);
  };

  const handleSelectYear = (yr) => {
    setFechaRef(`${yr}-01-01`);
    setPickerOpen(false);
  };

  const handleResetCurrentPeriod = () => {
    const todayIso = getTodayLocalISO();
    const dt = parseISODateUTC(todayIso);
    setViewYear(dt.getUTCFullYear());
    setViewMonth(dt.getUTCMonth());
    setFechaRef(todayIso);
    setPickerOpen(false);
  };

  const stepCalendarMonth = (delta) => {
    const dt = new Date(Date.UTC(viewYear, viewMonth + delta, 1));
    setViewYear(dt.getUTCFullYear());
    setViewMonth(dt.getUTCMonth());
  };

  // Construcción de la grilla mensual (Lu..Do)
  const firstDayOfViewMonth = new Date(Date.UTC(viewYear, viewMonth, 1));
  const leadingEmptyDays = (firstDayOfViewMonth.getUTCDay() + 6) % 7;
  const daysInViewMonth = new Date(Date.UTC(viewYear, viewMonth + 1, 0)).getUTCDate();
  const calendarCells = [
    ...Array.from({ length: leadingEmptyDays }, () => null),
    ...Array.from({ length: daysInViewMonth }, (_, i) => i + 1),
  ];
  const weekBounds = getWeekBoundsUTC(fechaRef);

  const decadeStart = Math.floor(viewYear / 12) * 12;
  const yearGrid = Array.from({ length: 12 }, (_, i) => decadeStart + i);

  const kpis = data?.kpis || {
    ingresos: 0,
    variacionIngresos: 0,
    ventasCount: 0,
    variacionVentas: 0,
    ventasEfectivo: 0,
    ventasTransferencia: 0,
    pedidosActivos: 0,
    porLiquidar: 0,
    saldoPendiente: 0,
    ticketPromedio: 0,
    variacionTicket: 0,
  };

  const chart = data?.chart?.length ? data.chart : buildEmptyChart(tipoPeriodo, fechaRef);
  const hasSalesInChart = chart.some((c) => Number(c.total) > 0);
  const topProductos = data?.topProductos || [];
  const totalUnidades = data?.totalUnidades || 0;
  const ultimasVentas = data?.ultimasVentas || [];

  const chartTitleMap = {
    dia: { title: 'Ventas del Día', subtitle: 'Comportamiento por franjas horarias' },
    semana: { title: 'Ventas de la Semana', subtitle: 'Comportamiento de ingresos diarios' },
    mes: { title: 'Ventas del Mes', subtitle: 'Ingresos semanales dentro del mes seleccionado' },
    anio: { title: 'Ventas del Año', subtitle: 'Comportamiento mensual acumulado' },
  };
  const chartMeta = chartTitleMap[tipoPeriodo] || chartTitleMap.mes;
  const activePeriodLabel = data?.period?.label || getPeriodDisplayLabel(tipoPeriodo, fechaRef);

  const kpiCards = [
    {
      title: 'Ingresos del Período',
      value: formatCOP(kpis.ingresos),
      change: `${kpis.variacionIngresos >= 0 ? '+' : ''}${kpis.variacionIngresos}%`,
      isPositive: kpis.variacionIngresos >= 0,
      description: `${kpis.ventasCount} venta${kpis.ventasCount === 1 ? '' : 's'} completada${kpis.ventasCount === 1 ? '' : 's'}`,
      icon: DollarSign,
      color: 'bg-primary/10 text-primary border-primary/20',
    },
    {
      title: 'Ventas Realizadas',
      value: String(kpis.ventasCount),
      change: `${kpis.variacionVentas >= 0 ? '+' : ''}${kpis.variacionVentas}%`,
      isPositive: kpis.variacionVentas >= 0,
      description: `${kpis.ventasEfectivo} efectivo · ${kpis.ventasTransferencia} transf.`,
      icon: TrendingUp,
      color: 'bg-accent/20 text-foreground border-accent/35',
    },
    {
      title: 'Pedidos Activos',
      value: String(kpis.pedidosActivos),
      change: `${kpis.porLiquidar} por liquidar`,
      isPositive: true,
      description: kpis.saldoPendiente > 0 ? `Saldo: ${formatCOP(kpis.saldoPendiente)}` : 'Sin saldo pendiente',
      icon: FileText,
      color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
    },
    {
      title: 'Ticket Promedio',
      value: formatCOP(kpis.ticketPromedio),
      change: `${kpis.variacionTicket >= 0 ? '+' : ''}${kpis.variacionTicket}%`,
      isPositive: kpis.variacionTicket >= 0,
      description: 'Promedio por venta cerrada',
      icon: ShoppingBag,
      color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header del Dashboard con un único filtrador desplegable por fecha */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            MEDICIÓN Y DESEMPEÑO
          </span>
          <h1 className="text-2xl font-black tracking-tight text-foreground">Dashboard General</h1>
          <p className="text-sm text-muted-foreground">
            Resumen en tiempo real del flujo de ventas y rendimiento del negocio.
          </p>
        </div>

        {/* Único selector desplegable de período (Año / Mes / Semana / Día + calendario interactivo) */}
        <div ref={pickerContainerRef} className="relative self-start sm:self-auto">
          <button
            type="button"
            onClick={togglePicker}
            aria-expanded={pickerOpen}
            aria-haspopup="dialog"
            className="flex items-center gap-2.5 px-4 py-2 rounded-full border border-border bg-card hover:bg-muted/50 text-xs font-bold text-foreground shadow-xs transition-all cursor-pointer"
          >
            <Calendar className="w-4 h-4 text-primary flex-shrink-0" />
            <span className="whitespace-nowrap">{activePeriodLabel}</span>
            <ChevronDown
              className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${
                pickerOpen ? 'rotate-180' : ''
              }`}
            />
          </button>

          {pickerOpen && (
            <div
              role="dialog"
              aria-label="Selector de período y fecha"
              className="absolute right-0 mt-2 w-[310px] rounded-3xl border border-border bg-popover text-popover-foreground shadow-2xl p-4 z-40 animate-in fade-in zoom-in-95 duration-150"
            >
              {/* Tabs: Año | Mes | Semana | Día */}
              <div className="grid grid-cols-4 p-1 rounded-full bg-muted mb-4">
                {PERIOD_OPTIONS.map((opt) => {
                  const isActive = tipoPeriodo === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setTipoPeriodo(opt.id)}
                      className={`py-1.5 rounded-full text-xs transition-all cursor-pointer ${
                        isActive
                          ? 'bg-card text-foreground font-black shadow-xs'
                          : 'text-muted-foreground font-bold hover:text-foreground'
                      }`}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>

              {/* Contenido según modo */}
              {(tipoPeriodo === 'semana' || tipoPeriodo === 'dia') && (
                <>
                  <div className="flex items-center justify-between px-1 mb-3">
                    <button
                      type="button"
                      onClick={() => stepCalendarMonth(-1)}
                      aria-label="Mes anterior"
                      className="p-1.5 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="text-sm font-black text-foreground">
                      {MONTHS_FULL[viewMonth]} {viewYear}
                    </span>
                    <button
                      type="button"
                      onClick={() => stepCalendarMonth(1)}
                      aria-label="Mes siguiente"
                      className="p-1.5 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-7 text-center mb-1.5">
                    {WEEKDAYS_SHORT.map((wd) => (
                      <span key={wd} className="text-[11px] font-bold text-muted-foreground py-1">
                        {wd}
                      </span>
                    ))}
                  </div>

                  <div className="grid grid-cols-7 gap-y-1 text-center">
                    {calendarCells.map((dayNum, idx) => {
                      if (!dayNum) {
                        return <div key={`empty-${idx}`} className="h-8" />;
                      }
                      const iso = `${viewYear}-${pad2(viewMonth + 1)}-${pad2(dayNum)}`;
                      const isExactDay = iso === fechaRef;
                      const isInSelectedWeek =
                        tipoPeriodo === 'semana' && iso >= weekBounds.startIso && iso <= weekBounds.endIso;
                      const isWeekStart = iso === weekBounds.startIso;
                      const isWeekEnd = iso === weekBounds.endIso;

                      let btnClass =
                        'h-8 w-full flex items-center justify-center text-xs transition-all cursor-pointer ';
                      if (tipoPeriodo === 'semana') {
                        if (isInSelectedWeek) {
                          btnClass += 'bg-primary/20 text-primary font-black ';
                          if (isWeekStart && isWeekEnd) btnClass += 'rounded-lg ';
                          else if (isWeekStart) btnClass += 'rounded-l-lg ';
                          else if (isWeekEnd) btnClass += 'rounded-r-lg ';
                        } else {
                          btnClass += 'text-foreground font-bold hover:bg-muted rounded-lg ';
                        }
                      } else if (isExactDay) {
                        btnClass += 'bg-primary text-primary-foreground font-black rounded-lg shadow-xs ';
                      } else {
                        btnClass += 'text-foreground font-bold hover:bg-muted rounded-lg ';
                      }

                      return (
                        <button
                          key={iso}
                          type="button"
                          onClick={() => handleSelectDate(iso)}
                          className={btnClass}
                        >
                          {dayNum}
                        </button>
                      );
                    })}
                  </div>

                  <p className="text-[11px] text-center text-muted-foreground mt-3 mb-3">
                    {tipoPeriodo === 'semana'
                      ? 'Clic en cualquier día para seleccionar esa semana'
                      : 'Clic en cualquier día para seleccionar esa fecha'}
                  </p>
                </>
              )}

              {tipoPeriodo === 'mes' && (
                <>
                  <div className="flex items-center justify-between px-1 mb-3">
                    <button
                      type="button"
                      onClick={() => setViewYear((y) => y - 1)}
                      aria-label="Año anterior"
                      className="p-1.5 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="text-sm font-black text-foreground font-mono">{viewYear}</span>
                    <button
                      type="button"
                      onClick={() => setViewYear((y) => y + 1)}
                      aria-label="Año siguiente"
                      className="p-1.5 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    {MONTHS_SHORT.map((mName, idx) => {
                      const isSelected =
                        Number(fechaRef.slice(0, 4)) === viewYear &&
                        Number(fechaRef.slice(5, 7)) === idx + 1;
                      return (
                        <button
                          key={mName}
                          type="button"
                          onClick={() => handleSelectMonth(idx)}
                          className={`py-2 rounded-xl text-xs transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-primary/20 text-primary font-black border border-primary/30'
                              : 'text-foreground font-bold hover:bg-muted border border-transparent'
                          }`}
                        >
                          {mName}
                        </button>
                      );
                    })}
                  </div>

                  <p className="text-[11px] text-center text-muted-foreground mt-3 mb-3">
                    Clic en un mes para seleccionar ese período
                  </p>
                </>
              )}

              {tipoPeriodo === 'anio' && (
                <>
                  <div className="flex items-center justify-between px-1 mb-3">
                    <button
                      type="button"
                      onClick={() => setViewYear((y) => y - 12)}
                      aria-label="Rango anterior"
                      className="p-1.5 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="text-sm font-black text-foreground font-mono">
                      {decadeStart} – {decadeStart + 11}
                    </span>
                    <button
                      type="button"
                      onClick={() => setViewYear((y) => y + 12)}
                      aria-label="Rango siguiente"
                      className="p-1.5 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    {yearGrid.map((yr) => {
                      const isSelected = Number(fechaRef.slice(0, 4)) === yr;
                      return (
                        <button
                          key={yr}
                          type="button"
                          onClick={() => handleSelectYear(yr)}
                          className={`py-2 rounded-xl text-xs font-mono transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-primary/20 text-primary font-black border border-primary/30'
                              : 'text-foreground font-bold hover:bg-muted border border-transparent'
                          }`}
                        >
                          {yr}
                        </button>
                      );
                    })}
                  </div>

                  <p className="text-[11px] text-center text-muted-foreground mt-3 mb-3">
                    Clic en un año para seleccionar ese período
                  </p>
                </>
              )}

              <button
                type="button"
                onClick={handleResetCurrentPeriod}
                className="w-full py-2 rounded-full border border-border bg-card hover:bg-muted text-xs font-bold text-foreground transition-colors cursor-pointer"
              >
                Período actual
              </button>
            </div>
          )}
        </div>
      </div>

      {error && !loading && (
        <div className="p-4 rounded-2xl border border-destructive/30 bg-red-50 dark:bg-red-950/30 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 text-xs font-bold text-destructive">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={() => fetchDashboard(tipoPeriodo, fechaRef)}
            className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-bold cursor-pointer"
          >
            Reintentar
          </button>
        </div>
      )}

      {loading && !data ? (
        <div className="bg-card border border-border rounded-2xl py-20 flex flex-col items-center justify-center gap-3 text-muted-foreground">
          <Loader2 className="w-7 h-7 animate-spin text-primary" />
          <p className="text-sm font-bold">Cargando métricas del período...</p>
        </div>
      ) : (
        <>
          {/* Tarjetas KPI */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {kpiCards.map((kpi, idx) => {
              const Icon = kpi.icon;
              return (
                <div
                  key={idx}
                  className="p-5 rounded-2xl border border-border bg-card shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold text-muted-foreground">{kpi.title}</span>
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center border ${kpi.color}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-foreground tracking-tight">{kpi.value}</h3>
                    <div className="flex items-center gap-1.5 mt-2">
                      <span
                        className={`inline-flex items-center text-xs font-bold ${
                          kpi.isPositive
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-destructive'
                        }`}
                      >
                        {kpi.isPositive ? (
                          <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" />
                        ) : (
                          <ArrowDownRight className="w-3.5 h-3.5 mr-0.5" />
                        )}
                        {kpi.change}
                      </span>
                      <span className="text-xs text-muted-foreground truncate">· {kpi.description}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Gráfico de Barras + Artículos Más Vendidos */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 p-5 rounded-2xl border border-border bg-card shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-base font-black text-foreground">{chartMeta.title}</h2>
                  <p className="text-xs text-muted-foreground">{chartMeta.subtitle}</p>
                </div>
                <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-primary/10 text-primary border border-primary/20">
                  {hasSalesInChart ? activePeriodLabel : 'Sin ventas registradas'}
                </span>
              </div>

              <div className="h-56 flex items-end justify-between gap-2 sm:gap-3 pt-8 pb-1 px-1">
                {chart.map((item, i) => {
                  const barHeight = item.total > 0 ? Math.max(14, Number(item.porcentaje || 14)) : 8;
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1.5 group h-full min-w-0">
                      <div className="flex-1 w-full flex items-end justify-center relative">
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity text-[10px] font-bold text-popover-foreground bg-popover px-2 py-1 rounded-lg shadow-md border border-border whitespace-nowrap z-10 pointer-events-none absolute -top-2">
                          <div>{formatCOP(item.total)}</div>
                          <div className="text-muted-foreground font-semibold">
                            {item.ventasCount} vta(s)
                          </div>
                        </div>
                        <div
                          className={`w-full max-w-[42px] rounded-t-xl transition-all duration-300 ${
                            item.total > 0
                              ? 'bg-gradient-to-t from-primary to-pink-400 shadow-xs group-hover:opacity-90'
                              : 'bg-muted'
                          }`}
                          style={{ height: `${barHeight}%` }}
                        />
                      </div>
                      <span className="text-[11px] font-bold text-foreground truncate max-w-full">
                        {item.label}
                      </span>
                      <span className="text-[10px] font-mono text-muted-foreground hidden sm:block truncate max-w-full">
                        {item.sublabel}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Top Productos / Servicios */}
            <div className="p-5 rounded-2xl border border-border bg-card shadow-xs flex flex-col justify-between">
              <div>
                <h2 className="text-base font-black text-foreground">Artículos Más Vendidos</h2>
                <p className="text-xs text-muted-foreground mb-4">
                  Productos y servicios con mayor rotación en el período
                </p>

                {topProductos.length === 0 ? (
                  <div className="py-12 text-center text-xs font-semibold text-muted-foreground">
                    Sin ventas completadas en este período.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {topProductos.map((prod, i) => (
                      <div key={i} className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs gap-2">
                          <span className="font-bold text-foreground truncate">{prod.nombre}</span>
                          <span className="font-mono font-bold text-primary whitespace-nowrap">
                            {prod.cantidad} uds
                          </span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
                          <div
                            className="h-full rounded-full bg-primary transition-all duration-500"
                            style={{ width: `${prod.porcentaje}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
                <span>Total unidades del período:</span>
                <span className="font-mono font-black text-foreground">{totalUnidades}</span>
              </div>
            </div>
          </div>

          {/* Últimas Ventas Registradas del Período */}
          <div className="p-5 rounded-2xl border border-border bg-card shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-black text-foreground">Últimas Ventas Registradas</h2>
                <p className="text-xs text-muted-foreground">
                  Transacciones completadas dentro del período seleccionado
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-border text-muted-foreground font-bold uppercase tracking-wider text-[11px]">
                    <th className="pb-3 pr-3">ID Venta</th>
                    <th className="pb-3 pr-3">Cliente</th>
                    <th className="pb-3 pr-3">Método</th>
                    <th className="pb-3 pr-3">Fecha y Hora</th>
                    <th className="pb-3 pr-3 text-right">Monto</th>
                    <th className="pb-3 text-center">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {ultimasVentas.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="py-8 text-center text-muted-foreground font-semibold">
                        No se registraron ventas completadas en este período.
                      </td>
                    </tr>
                  ) : (
                    ultimasVentas.map((tx) => (
                      <tr key={tx.id_pedido} className="hover:bg-muted/40 transition-colors">
                        <td className="py-3 pr-3 font-mono font-bold text-primary">{tx.codigo}</td>
                        <td className="py-3 pr-3">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-primary/10 text-primary font-black text-[10px] flex items-center justify-center flex-shrink-0">
                              {getInitials(tx.cliente)}
                            </div>
                            <span className="font-bold text-foreground">{tx.cliente}</span>
                          </div>
                        </td>
                        <td className="py-3 pr-3">
                          <span className="inline-flex items-center gap-1.5 font-semibold text-foreground">
                            {tx.metodo === 'Efectivo' ? (
                              <Wallet className="w-3.5 h-3.5 text-emerald-500" />
                            ) : (
                              <CreditCard className="w-3.5 h-3.5 text-primary" />
                            )}
                            {tx.metodo}
                          </span>
                        </td>
                        <td className="py-3 pr-3 text-muted-foreground font-mono">
                          {formatDateTimeES(tx.fecha_pedido)}
                        </td>
                        <td className="py-3 pr-3 text-right font-mono font-black text-foreground">
                          {formatCOP(tx.total)}
                        </td>
                        <td className="py-3 text-center">
                          <StatusBadge status={tx.estado} />
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      <FeedbackToast toast={toast} onClose={closeToast} />
    </div>
  );
}
