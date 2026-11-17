import React from 'react';
import Modal from '../../../components/ui/Modal';
import { User, Phone, FileText, Shield, Calendar, CheckCircle2, XCircle } from 'lucide-react';

export default function EmployeeDetailModal({
  open,
  onClose,
  employee = null
}) {
  if (!employee) return null;

  const isActivo = employee.estado === 1 || employee.estado === true;
  const fullName = `${employee.nombre_usuario || ''} ${employee.apellido_usuario || ''}`.trim();
  const code = `EM${String(employee.id_usuario).padStart(3, '0')}`;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Ficha del Empleado — ${code}`}
    >
      <div className="space-y-4">
        {/* Banner Informativo */}
        <div className="p-3 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 text-[11px] text-purple-700 dark:text-purple-300 font-bold">
          Para editar credenciales, contraseñas o datos maestros de este empleado, debes hacerlo desde el módulo de <strong>Gestión de Usuarios</strong>.
        </div>

        {/* Perfil Principal */}
        <div className="flex items-center gap-3 p-4 rounded-xl bg-input-background border border-border">
          <div className="w-12 h-12 rounded-full bg-primary/10 text-primary font-black text-sm flex items-center justify-center border border-primary/20">
            {employee.nombre_usuario?.[0]?.toUpperCase()}{employee.apellido_usuario?.[0]?.toUpperCase()}
          </div>
          <div>
            <h3 className="font-black text-base text-foreground">{fullName}</h3>
            <p className="text-xs text-muted-foreground font-mono">{code} · {employee.nombre_rol || 'Empleado'}</p>
          </div>
        </div>

        {/* Datos en Grilla */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-card border border-border space-y-1">
            <span className="text-muted-foreground flex items-center gap-1.5 font-bold">
              <FileText className="w-3.5 h-3.5 text-primary" />
              Documento ({employee.tipo_documento || 'CC'})
            </span>
            <p className="font-mono font-bold text-foreground text-sm">
              {employee.documento || 'No registrado'}
            </p>
          </div>

          <div className="p-3 rounded-xl bg-card border border-border space-y-1">
            <span className="text-muted-foreground flex items-center gap-1.5 font-bold">
              <Phone className="w-3.5 h-3.5 text-primary" />
              Teléfono de Contacto
            </span>
            <p className="font-mono font-bold text-foreground text-sm">
              {employee.telefono || 'Sin teléfono'}
            </p>
          </div>

          <div className="p-3 rounded-xl bg-card border border-border space-y-1">
            <span className="text-muted-foreground flex items-center gap-1.5 font-bold">
              <Shield className="w-3.5 h-3.5 text-primary" />
              Rol Asignado
            </span>
            <p className="font-bold text-foreground">
              {employee.nombre_rol || 'Empleado'}
            </p>
          </div>

          <div className="p-3 rounded-xl bg-card border border-border space-y-1">
            <span className="text-muted-foreground flex items-center gap-1.5 font-bold">
              {isActivo ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
              ) : (
                <XCircle className="w-3.5 h-3.5 text-red-500" />
              )}
              Estado
            </span>
            <p className={`font-bold ${isActivo ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
              {isActivo ? 'Activo en el sistema' : 'Inactivo'}
            </p>
          </div>
        </div>

        {/* Botón Cerrar */}
        <div className="flex justify-end pt-3 border-t border-border">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl font-bold text-foreground text-sm bg-muted hover:bg-muted/80 transition-colors cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      </div>
    </Modal>
  );
}
