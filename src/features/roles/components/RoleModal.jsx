import React, { useState, useEffect } from 'react';
import Modal from '../../../components/ui/Modal';
import { Check, ShieldCheck, ChevronDown, ChevronUp } from 'lucide-react';
import { CANONICAL_PERMISOS, normalizePermName, isDashboardPerm } from '../utils/roleConstants';

export default function RoleModal({
  open,
  onClose,
  onSave,
  role = null,
  allPermisos = [],
  allPermisosPrivilegios = [],
  loading = false
}) {
  const [nombreRol, setNombreRol] = useState('');
  const [descripcion, setDescripcion] = useState('');
  // Map of id_permiso_privilegio -> boolean (active or not)
  const [selectedPrivs, setSelectedPrivs] = useState({});
  const [expandedPerms, setExpandedPerms] = useState({});
  const [error, setError] = useState('');

  // Agrupar permisos canónicos ordenados estrictamente por id_permiso (1..14)
  const permisosGrouped = React.useMemo(() => {
    const base = (allPermisos && allPermisos.length > 0)
      ? allPermisos
      : CANONICAL_PERMISOS;

    // Asegurar orden estricto por id_permiso (1 al 14)
    const sorted = [...base].sort((a, b) => a.id_permiso - b.id_permiso);

    return sorted.map((perm) => {
      const items = allPermisosPrivilegios.filter(
        (pp) =>
          pp.id_permiso === perm.id_permiso ||
          normalizePermName(pp.nombre_permiso) === normalizePermName(perm.nombre_permiso)
      );
      return {
        id_permiso: perm.id_permiso,
        nombre_permiso: perm.nombre_permiso,
        label: perm.label || perm.nombre_permiso,
        descripcion: perm.descripcion,
        isDashboard: isDashboardPerm(perm),
        items
      };
    });
  }, [allPermisos, allPermisosPrivilegios]);

  useEffect(() => {
    if (open) {
      if (role) {
        setNombreRol(role.nombre_rol || '');
        setDescripcion(role.descripcion || '');
        // Load role's active permissions/privileges
        const initialMap = {};
        if (role.assignedPermisos && Array.isArray(role.assignedPermisos)) {
          role.assignedPermisos.forEach((p) => {
            if (p.estado_permiso) {
              initialMap[p.id_permiso_privilegio] = true;
            }
          });
        }
        setSelectedPrivs(initialMap);
      } else {
        setNombreRol('');
        setDescripcion('');
        setSelectedPrivs({});
      }
      setError('');
    }
  }, [open, role]);

  // Check if a permission is active
  const isPermisoActive = (group) => {
    if (group.isDashboard) {
      // El dashboard no tiene privilegios, no se deben validar privilegios para este permiso
      return true;
    }
    return group.items.some((item) => !!selectedPrivs[item.id_permiso_privilegio]);
  };

  // Toggle all privileges for a given permission
  const handleTogglePermisoGroup = (group) => {
    if (group.isDashboard) {
      // Dashboard es de acceso base y no tiene privilegios asignables en la BD
      return;
    }
    const active = isPermisoActive(group);
    const newMap = { ...selectedPrivs };
    group.items.forEach((item) => {
      if (active) {
        delete newMap[item.id_permiso_privilegio];
      } else {
        newMap[item.id_permiso_privilegio] = true;
      }
    });
    setSelectedPrivs(newMap);
  };

  // Toggle single privilege
  const handleTogglePrivilegio = (id_permiso_privilegio) => {
    setSelectedPrivs((prev) => {
      const next = { ...prev };
      if (next[id_permiso_privilegio]) {
        delete next[id_permiso_privilegio];
      } else {
        next[id_permiso_privilegio] = true;
      }
      return next;
    });
  };

  // Select all or clear all
  const handleSelectAll = (select) => {
    if (!select) {
      setSelectedPrivs({});
      return;
    }
    const all = {};
    allPermisosPrivilegios.forEach((item) => {
      all[item.id_permiso_privilegio] = true;
    });
    setSelectedPrivs(all);
  };

  const handleToggleExpand = (nombrePermiso) => {
    setExpandedPerms((prev) => ({
      ...prev,
      [nombrePermiso]: !prev[nombrePermiso]
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!nombreRol.trim()) {
      setError('El nombre del rol es obligatorio.');
      return;
    }

    const asignaciones = Object.keys(selectedPrivs)
      .filter((k) => selectedPrivs[k] && Number(k) > 0)
      .map((k) => ({
        id_permiso_privilegio: Number(k),
        estado_permiso: true
      }));

    onSave({
      nombre_rol: nombreRol.trim(),
      descripcion: descripcion.trim() || null,
      asignaciones
    });
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={role ? `Editar Rol — ${role.nombre_rol}` : 'Nuevo Rol del Sistema'}
      wide={true}
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-300 text-xs font-bold rounded-xl p-3">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-foreground block">
              Nombre del Rol <span className="text-primary">*</span>
            </label>
            <input
              type="text"
              value={nombreRol}
              onChange={(e) => {
                setNombreRol(e.target.value);
                setError('');
              }}
              placeholder="Ej: Administrador, Supervisor, Empleado..."
              maxLength={50}
              required
              className="w-full px-3.5 py-2.5 bg-input-background border border-border rounded-xl text-sm font-medium text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-ring transition-all"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-foreground block">
              Descripción del Rol
            </label>
            <input
              type="text"
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              placeholder="Ej: Control total del sistema..."
              maxLength={150}
              className="w-full px-3.5 py-2.5 bg-input-background border border-border rounded-xl text-sm font-medium text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-ring transition-all"
            />
          </div>
        </div>

        {/* Sección de Permisos y Privilegios */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between pb-2 border-b border-border">
            <div>
              <p className="text-xs font-black uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-primary" /> Permisos y Privilegios Asignados
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Selecciona los módulos a los que tendrá acceso y sus privilegios específicos (Crear, Editar, Eliminar, etc.).
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleSelectAll(true)}
                className="text-xs font-bold text-primary hover:underline cursor-pointer"
              >
                Todos
              </button>
              <span className="text-border">|</span>
              <button
                type="button"
                onClick={() => handleSelectAll(false)}
                className="text-xs font-bold text-muted-foreground hover:underline cursor-pointer"
              >
                Ninguno
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-96 overflow-y-auto pr-1">
            {permisosGrouped.map((group) => {
              const active = isPermisoActive(group);
              const isExpanded = expandedPerms[group.nombre_permiso] ?? active;
              const displayName = group.label || group.nombre_permiso;

              return (
                <div
                  key={group.id_permiso || group.nombre_permiso}
                  className={`rounded-xl border p-3 transition-all ${
                    active
                      ? 'bg-card border-primary/30 shadow-xs'
                      : 'bg-muted/40 border-border opacity-75'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2.5 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={active}
                        disabled={group.isDashboard}
                        onChange={() => handleTogglePermisoGroup(group)}
                        className="sr-only"
                      />
                      <div
                        className={`w-4.5 h-4.5 rounded-md flex items-center justify-center transition-colors ${
                          active ? 'bg-primary text-white shadow-xs' : 'bg-muted border border-border'
                        }`}
                      >
                        {active && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>
                      <div>
                        <span className={`text-xs font-black ${active ? 'text-foreground' : 'text-muted-foreground'}`}>
                          {displayName}
                        </span>
                        {group.isDashboard && (
                          <span className="block text-[10px] text-muted-foreground font-semibold">
                            Acceso libre · Sin privilegios requeridos
                          </span>
                        )}
                      </div>
                    </label>

                    {!group.isDashboard && group.items.length > 0 && (
                      <button
                        type="button"
                        onClick={() => handleToggleExpand(group.nombre_permiso)}
                        className="p-1 rounded text-muted-foreground hover:text-foreground cursor-pointer"
                        title={isExpanded ? 'Ocultar privilegios' : 'Ver privilegios'}
                      >
                        {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      </button>
                    )}
                  </div>

                  {/* Privilegios desplegados */}
                  {!group.isDashboard && isExpanded && group.items.length > 0 && (
                    <div className="mt-2.5 pt-2 border-t border-border/60 flex flex-wrap gap-1.5">
                      {group.items.map((item) => {
                        const isPrivChecked = !!selectedPrivs[item.id_permiso_privilegio];
                        return (
                          <button
                            type="button"
                            key={item.id_permiso_privilegio}
                            onClick={() => handleTogglePrivilegio(item.id_permiso_privilegio)}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all border cursor-pointer ${
                              isPrivChecked
                                ? 'bg-primary/10 border-primary/40 text-primary'
                                : 'bg-background border-border text-muted-foreground hover:bg-muted'
                            }`}
                          >
                            {item.nombre_privilegio}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-border">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl font-bold text-foreground text-sm bg-muted hover:bg-muted/80 transition-colors cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2.5 rounded-xl font-black text-white text-sm bg-primary hover:opacity-90 active:scale-[0.98] transition-all shadow-md shadow-primary/20 cursor-pointer disabled:opacity-50"
          >
            {loading ? 'Guardando...' : role ? 'Actualizar Rol' : 'Crear Rol'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
