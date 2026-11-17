import { DAY_LABELS } from '../utils/dates';

// Colores de cabecera por día (igual que en el ejemplo visual)
const DAY_GRADIENTS = [
  ['#EC4899', '#F472B6'], // LUN
  ['#8B5CF6', '#A78BFA'], // MAR
  ['#0EA5E9', '#38BDF8'], // MIÉ
  ['#F59E0B', '#FBBF24'], // JUE
  ['#10B981', '#34D399'], // VIE
  ['#F97316', '#FB923C'], // SÁB
  ['#6B7280', '#9CA3AF'], // DOM
];

export default function WeekSummary({ days, counts, activeCount, todayIso }) {
  return (
    <div className="overflow-x-auto pb-1">
      <div className="grid grid-cols-7 gap-3 min-w-[860px]">
        {days.map((day, i) => {
          const isToday = day.iso === todayIso;
          const [from, to] = DAY_GRADIENTS[i];
          return (
            <div
              key={day.iso}
              className={`bg-card rounded-2xl overflow-hidden border shadow-xs ${
                isToday ? 'border-primary ring-2 ring-primary/30' : 'border-border'
              }`}
            >
              <div
                className="py-2 text-center text-white"
                style={{ background: `linear-gradient(180deg, ${from}, ${to})` }}
              >
                <p className="text-xs font-black tracking-wide">{DAY_LABELS[i]}</p>
                {isToday && (
                  <span className="inline-block mt-0.5 px-2 py-px rounded-full bg-white/25 text-[10px] font-black">
                    HOY
                  </span>
                )}
              </div>
              <div className="py-3 text-center">
                <p className="text-2xl font-black text-foreground leading-none">{counts[day.iso] ?? 0}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {(counts[day.iso] ?? 0) === 1 ? 'empleado' : 'empleados'}
                </p>
                <p className="text-xs font-bold text-primary mt-1">
                  {day.date.getDate()} · de {activeCount} activos
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
