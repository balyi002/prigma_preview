import { useCallback, useMemo, useState } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight, Loader2, Plus } from 'lucide-react';
import useSchedules from '../hooks/useSchedules';
import WeekSummary from '../components/WeekSummary';
import ScheduleGrid from '../components/ScheduleGrid';
import ScheduleFormModal from '../components/ScheduleFormModal';
import ConfirmDialog from '../components/ConfirmDialog';
import Toast from '../components/Toast';
import { addDays, formatWeekRange, parseISODate, startOfWeek, toISODate } from '../utils/dates';
import { colorFor } from '../utils/employeeColors';

export default function SchedulesPage() {
  const { schedules, users, loading, error, reload, createSchedule, updateSchedule, deleteSchedule } =
    useSchedules();

  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()));
  const [form, setForm] = useState(null); // { schedule?, defaults? }
  const [deleting, setDeleting] = useState(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [toast, setToast] = useState(null);
  const closeToast = useCallback(() => setToast(null), []);
  const notify = (type, message) => setToast({ type, message });

  const todayIso = toISODate(new Date());

  const days = useMemo(
    () =>
      Array.from({ length: 7 }, (_, i) => {
        const date = addDays(weekStart, i);
        return { date, iso: toISODate(date) };
      }),
    [weekStart]
  );

  const { byKey, counts, employees, colorIndex, activeCount, legend } = useMemo(() => {
    const first = days[0].iso;
    const last = days[6].iso;
    const weekSchedules = schedules.filter((s) => s.fecha >= first && s.fecha <= last);

    const byKey = {};
    const counts = {};
    weekSchedules.forEach((s) => {
      byKey[`${s.userId}|${s.fecha}`] = s;
      counts[s.fecha] = (counts[s.fecha] ?? 0) + 1;
    });

    const withShift = new Set(weekSchedules.map((s) => s.userId));
    const employees = users.filter((u) => u.estado || withShift.has(u.id_usuario));
    const colorIndex = Object.fromEntries(users.map((u, i) => [u.id_usuario, i]));

    return {
      byKey,
      counts,
      employees,
      colorIndex,
      activeCount: users.filter((u) => u.estado).length,
      legend: employees.map((u) => ({
        id: u.id_usuario,
        name: `${u.nombre_usuario} ${u.apellido_usuario}`,
        color: colorFor(colorIndex[u.id_usuario]),
      })),
    };
  }, [schedules, users, days]);

  const goToWeekOf = (iso) => setWeekStart(startOfWeek(parseISODate(iso)));

  const handleSubmit = async (payload) => {
    if (form.schedule) {
      await updateSchedule(form.schedule.id, payload);
      notify('success', 'Turno actualizado.');
    } else {
      await createSchedule(payload);
      notify('success', 'Turno asignado.');
    }
    goToWeekOf(payload.fecha_trabajo); // muestra la semana donde quedó el turno
    setForm(null);
  };

  const handleDelete = async () => {
    setDeleteBusy(true);
    try {
      await deleteSchedule(deleting.id);
      notify('success', 'Turno eliminado.');
    } catch (err) {
      notify('error', err.message);
    } finally {
      setDeleteBusy(false);
      setDeleting(null);
    }
  };

  const navButton =
    'w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer';

  return (
    <section className="p-6 space-y-5">
      <header className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-black text-foreground">Agenda Semanal</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Turnos de empleados activos — haz clic en cualquier celda para asignar o editar
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-1 bg-card border border-border rounded-full px-2 py-1">
            <button type="button" onClick={() => setWeekStart((w) => addDays(w, -7))} aria-label="Semana anterior" className={navButton}>
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-2 text-xs font-bold text-foreground flex items-center gap-1.5 min-w-[150px] justify-center">
              <CalendarDays className="w-3.5 h-3.5 text-muted-foreground" />
              {formatWeekRange(weekStart)}
            </span>
            <button type="button" onClick={() => setWeekStart((w) => addDays(w, 7))} aria-label="Semana siguiente" className={navButton}>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <button
            type="button"
            onClick={() => setWeekStart(startOfWeek(new Date()))}
            className="px-3.5 py-2 rounded-full text-xs font-bold bg-muted text-foreground hover:bg-muted/80 transition-colors cursor-pointer"
          >
            Hoy
          </button>

          <button
            type="button"
            onClick={() => setForm({ defaults: { fecha: todayIso } })}
            disabled={loading || Boolean(error)}
            className="px-5 py-2.5 rounded-full font-black text-white text-sm bg-primary hover:opacity-90 active:scale-[0.98] disabled:opacity-50 transition-all shadow-md shadow-primary/20 flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Nuevo turno
          </button>
        </div>
      </header>

      {loading ? (
        <div className="bg-card border border-border rounded-2xl py-16 flex items-center justify-center gap-2 text-sm font-bold text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin" />
          Cargando agenda...
        </div>
      ) : error ? (
        <div className="bg-card border border-border rounded-2xl py-14 text-center space-y-3">
          <p className="text-sm font-bold text-destructive">{error}</p>
          <button
            type="button"
            onClick={() => reload()}
            className="px-4 py-2 rounded-xl text-sm font-bold bg-muted text-foreground hover:bg-muted/80 cursor-pointer"
          >
            Reintentar
          </button>
        </div>
      ) : (
        <>
          <WeekSummary days={days} counts={counts} activeCount={activeCount} todayIso={todayIso} />

          {employees.length === 0 ? (
            <div className="bg-card border border-border rounded-2xl py-14 text-center space-y-2">
              <CalendarDays className="w-8 h-8 mx-auto text-muted-foreground" />
              <p className="text-sm font-bold text-foreground">No hay empleados activos</p>
              <p className="text-xs text-muted-foreground">Activa o crea usuarios en el módulo de Usuarios para asignarles turnos.</p>
            </div>
          ) : (
            <>
              <ScheduleGrid
                days={days}
                employees={employees}
                byKey={byKey}
                colorIndex={colorIndex}
                todayIso={todayIso}
                onCreate={(userId, fecha) => setForm({ defaults: { userId, fecha } })}
                onEdit={(schedule) => setForm({ schedule })}
              />

              <div className="flex items-center gap-x-5 gap-y-2 flex-wrap text-xs font-bold text-muted-foreground">
                {legend.map((item) => (
                  <span key={item.id} className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ background: item.color }} />
                    {item.name}
                  </span>
                ))}
              </div>
            </>
          )}
        </>
      )}

      {form && (
        <ScheduleFormModal
          schedule={form.schedule ?? null}
          defaults={form.defaults}
          users={users}
          schedules={schedules}
          onSubmit={handleSubmit}
          onRequestDelete={(schedule) => {
            setForm(null);
            setDeleting(schedule);
          }}
          onClose={() => setForm(null)}
        />
      )}

      {deleting && (
        <ConfirmDialog
          title="Eliminar turno"
          message={`¿Quitar el turno de ${deleting.nombre} ${deleting.apellido} del ${deleting.fecha}? Esta acción no se puede deshacer.`}
          loading={deleteBusy}
          onConfirm={handleDelete}
          onClose={() => setDeleting(null)}
        />
      )}

      <Toast toast={toast} onClose={closeToast} />
    </section>
  );
}
