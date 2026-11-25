import React from 'react';
import { Eye } from 'lucide-react';
import ToggleSwitch from '../../../components/ui/ToggleSwitch';

const AVATAR_COLORS = [
  'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-950/70 dark:text-purple-300 dark:border-purple-800',
  'bg-pink-100 text-pink-700 border-pink-200 dark:bg-pink-950/70 dark:text-pink-300 dark:border-pink-800',
  'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-950/70 dark:text-blue-300 dark:border-blue-800',
  'bg-indigo-100 text-indigo-700 border-indigo-200 dark:bg-indigo-950/70 dark:text-indigo-300 dark:border-indigo-800',
  'bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-950/70 dark:text-rose-300 dark:border-rose-800'
];

export default function EmployeesTable({
  employees = [],
  onViewEmployee,
  onToggleStatus
}) {
  const getInitials = (name, last) => {
    const f = (name || '').trim()[0] || 'E';
    const l = (last || '').trim()[0] || 'M';
    return `${f}${l}`.toUpperCase();
  };

  const getEmployeeCode = (id) => `EM${String(id).padStart(3, '0')}`;

  const getAvatarClass = (id) => {
    const idx = (Number(id) || 0) % AVATAR_COLORS.length;
    return AVATAR_COLORS[idx];
  };

  return (
    <div className="overflow-x-auto rounded-xl border border-border bg-card">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-border bg-muted/30 text-[11px] font-black uppercase tracking-wider text-muted-foreground">
            <th className="py-3.5 px-4">Empleado</th>
            <th className="py-3.5 px-4">Documento</th>
            <th className="py-3.5 px-4">Rol</th>
            <th className="py-3.5 px-4">Teléfono</th>
            <th className="py-3.5 px-4 text-center">Estado</th>
            <th className="py-3.5 px-4 text-right">Acciones</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border text-sm">
          {employees.map((emp) => {
            const isActivo = emp.estado === 1 || emp.estado === true;
            const fullName = `${emp.nombre_usuario || ''} ${emp.apellido_usuario || ''}`.trim() || 'Sin Nombre';
            const initials = getInitials(emp.nombre_usuario, emp.apellido_usuario);
            const avatarColorClass = getAvatarClass(emp.id_usuario);

            return (
              <tr
                key={emp.id_usuario}
                className="hover:bg-muted/40 transition-colors group"
              >
                {/* Empleado con Avatar circular e ID */}
                <td className="py-3.5 px-4">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-9 h-9 rounded-full flex items-center justify-center font-black text-xs border flex-shrink-0 ${avatarColorClass}`}
                    >
                      {initials}
                    </div>
                    <div className="flex flex-col">
                      <span className="font-bold text-foreground text-sm group-hover:text-primary transition-colors">
                        {fullName}
                      </span>
                      <span className="text-[11px] font-mono text-muted-foreground">
                        {getEmployeeCode(emp.id_usuario)}
                      </span>
                    </div>
                  </div>
                </td>

                {/* Documento */}
                <td className="py-3.5 px-4 font-mono text-xs text-foreground">
                  {emp.documento || 'No registrado'}
                </td>

                {/* Rol Badge */}
                <td className="py-3.5 px-4">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                    {emp.nombre_rol || 'Empleado'}
                  </span>
                </td>

                {/* Teléfono */}
                <td className="py-3.5 px-4 font-mono text-xs text-muted-foreground">
                  {emp.telefono || 'Sin teléfono'}
                </td>

                {/* Switch Estado */}
                <td className="py-3.5 px-4 text-center">
                  <ToggleSwitch
                    checked={isActivo}
                    onChange={() => onToggleStatus(emp)}
                  />
                </td>

                {/* Acciones */}
                <td className="py-3.5 px-4 text-right">
                  <button
                    type="button"
                    onClick={() => onViewEmployee(emp)}
                    title="Ver detalles del empleado"
                    aria-label={`Ver detalles de ${fullName}`}
                    className="p-2 rounded-lg text-sky-500 hover:bg-sky-500/10 transition-colors cursor-pointer"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
