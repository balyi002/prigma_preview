import { CalendarCheck, Plus } from 'lucide-react';
import { DAY_LABELS } from '../utils/dates';
import { colorFor, initials } from '../utils/employeeColors';

const GRID_COLS = { gridTemplateColumns: '230px repeat(7, minmax(112px, 1fr))' };

export default function ScheduleGrid({ days, employees, byKey, colorIndex, todayIso, onCreate, onEdit }) {
  return (
    <div className="bg-card border border-border rounded-2xl shadow-xs overflow-x-auto">
      <div className="min-w-[1020px]">
        {/* Encabezado */}
        <div className="grid border-b border-border" style={GRID_COLS}>
          <div className="px-5 py-3.5 text-xs font-black uppercase tracking-wide text-muted-foreground">
            Empleado
          </div>
          {days.map((day, i) => {
            const isToday = day.iso === todayIso;
            return (
              <div
                key={day.iso}
                className={`py-3 text-center border-l border-border ${isToday ? 'bg-primary/5' : ''}`}
              >
                <p
                  className={`text-xs font-black tracking-wide ${isToday ? 'text-primary' : 'text-muted-foreground'}`}
                >
                  {DAY_LABELS[i]} {day.date.getDate()}
                </p>
                {isToday && <span className="block mx-auto mt-1 w-1.5 h-1.5 rounded-full bg-primary" />}
              </div>
            );
          })}
        </div>

        {/* Filas */}
        {employees.map((emp) => {
          const color = colorFor(colorIndex[emp.id_usuario] ?? 0);
          return (
            <div
              key={emp.id_usuario}
              className="grid border-b border-border last:border-b-0"
              style={GRID_COLS}
            >
              <div className="px-5 py-3 flex items-center gap-3">
                <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: color }} />
                <span
                  className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-black text-white flex-shrink-0"
                  style={{ background: color }}
                >
                  {initials(emp.nombre_usuario, emp.apellido_usuario)}
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-black text-foreground leading-tight truncate">
                    {emp.nombre_usuario} {emp.apellido_usuario}
                  </p>
                  <p className="font-mono text-[11px] text-muted-foreground truncate">{emp.documento}</p>
                  <p className="text-[11px] text-muted-foreground truncate">{emp.nombre_rol}</p>
                </div>
              </div>

              {days.map((day) => {
                const shift = byKey[`${emp.id_usuario}|${day.iso}`];
                const isToday = day.iso === todayIso;
                return (
                  <div
                    key={day.iso}
                    className={`p-2 border-l border-border flex items-center justify-center ${
                      isToday ? 'bg-primary/5' : ''
                    }`}
                  >
                    {shift ? (
                      <button
                        type="button"
                        onClick={() => onEdit(shift)}
                        aria-label={`Editar turno de ${emp.nombre_usuario} el ${day.iso}`}
                        className="w-full rounded-xl px-2.5 py-2 flex items-center gap-1.5 text-xs font-black border transition-transform hover:scale-[1.03] cursor-pointer"
                        style={{ background: `${color}1F`, borderColor: `${color}55`, color }}
                      >
                        <CalendarCheck className="w-3.5 h-3.5 flex-shrink-0" />
                        Trabaja
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => onCreate(emp.id_usuario, day.iso)}
                        aria-label={`Asignar turno a ${emp.nombre_usuario} el ${day.iso}`}
                        className="w-8 h-8 rounded-full border-2 border-dashed border-border text-muted-foreground/60 hover:text-primary hover:border-primary hover:bg-primary/5 flex items-center justify-center transition-colors cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}
