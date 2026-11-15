import React, { useState, useEffect } from 'react';
import { Plus, Lock, Edit2, Trash2, Check, X, ShieldAlert } from 'lucide-react';
import { roleService } from '../services/roleService';
import RoleModal from '../components/RoleModal';
import ToggleSwitch from '../../../components/ui/ToggleSwitch';
import ConfirmDialog from '../../../components/ui/ConfirmDialog';

export default function RolesPage() {
  const [roles, setRoles] = useState([]);
  const [allPermisosPrivilegios, setAllPermisosPrivilegios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState(null);
  const [confirmState, setConfirmState] = useState({ open: false, title: '', message: '', onConfirm: null });

  // Lista canónica de los 14 permisos del sistema según el diseño oficial
  const canonicalPerms = [
    'Dashboard', 'Roles', 'Gestión de Usuarios', 'Categoría de Productos',
    'Gestión de Productos', 'Proveedores', 'Gestión de Compras', 'Categoría de Servicios',
    'Gestión de Servicios', 'Empleados', 'Agenda', 'Pedidos', 'Clientes', 'Ventas'
  ];

  const fetchRolesData = async () => {
    try {
      setLoading(true);
      const [rolesData, ppsData] = await Promise.all([
        roleService.getRoles(),
        roleService.getPermisosPrivilegios()
      ]);

      // Cargar permisos asignados para cada rol
      const rolesWithPerms = await Promise.all(
        rolesData.map(async (r) => {
          try {
            const assigned = await roleService.getRolePermisos(r.id_rol);
            return { ...r, assignedPermisos: assigned };
          } catch (e) {
            console.error('Error cargando permisos del rol', r.id_rol, e);
            return { ...r, assignedPermisos: [] };
          }
        })
      );

      setRoles(rolesWithPerms);
      setAllPermisosPrivilegios(ppsData);
    } catch (err) {
      console.error('Error cargando roles:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRolesData();
  }, []);

  const handleCreateNew = () => {
    setEditingRole(null);
    setModalOpen(true);
  };

  const handleEditRole = (role) => {
    setEditingRole(role);
    setModalOpen(true);
  };

  const handleSaveRole = async (formData) => {
    try {
      if (editingRole) {
        // Actualizar datos del rol
        await roleService.updateRole(editingRole.id_rol, {
          nombre_rol: formData.nombre_rol,
          descripcion: formData.descripcion
        });
        // Actualizar permisos/privilegios
        await roleService.updateRolePermisos(editingRole.id_rol, formData.asignaciones);
      } else {
        // Crear nuevo rol
        await roleService.createRole({
          nombre_rol: formData.nombre_rol,
          descripcion: formData.descripcion,
          asignaciones: formData.asignaciones
        });
      }
      setModalOpen(false);
      setEditingRole(null);
      await fetchRolesData();
    } catch (err) {
      console.error('Error al guardar el rol:', err);
      alert(err.response?.data?.error || err.message || 'Error al guardar el rol');
    }
  };

  const handleToggleStatus = async (role) => {
    const newStatus = !role.estado;
    try {
      await roleService.updateRoleStatus(role.id_rol, newStatus);
      setRoles((prev) =>
        prev.map((r) => (r.id_rol === role.id_rol ? { ...r, estado: newStatus ? 1 : 0 } : r))
      );
    } catch (err) {
      console.error('Error actualizando estado del rol:', err);
      alert(err.response?.data?.error || err.message || 'Error al cambiar estado');
    }
  };

  const handleDeleteRole = (role) => {
    setConfirmState({
      open: true,
      title: `¿Eliminar rol "${role.nombre_rol}"?`,
      message: 'Esta acción eliminará el rol y todas sus asignaciones de permisos. No se puede deshacer.',
      onConfirm: async () => {
        try {
          await roleService.deleteRole(role.id_rol);
          setRoles((prev) => prev.filter((r) => r.id_rol !== role.id_rol));
          setConfirmState({ open: false, title: '', message: '', onConfirm: null });
        } catch (err) {
          console.error('Error al eliminar rol:', err);
          alert(err.response?.data?.error || err.message || 'No se puede eliminar el rol');
          setConfirmState({ open: false, title: '', message: '', onConfirm: null });
        }
      }
    });
  };

  // Helper para verificar si un rol tiene activo un permiso canónico
  const hasPermiso = (role, permName) => {
    if (!role.assignedPermisos || !Array.isArray(role.assignedPermisos)) return false;
    return role.assignedPermisos.some(
      (p) => p.nombre_permiso === permName && Boolean(p.estado_permiso)
    );
  };

  return (
    <div className="space-y-6">
      {/* Cabecera del módulo */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-black text-xl text-foreground">Roles</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Gestión de roles y asignación de permisos del sistema
          </p>
        </div>
        <button
          onClick={handleCreateNew}
          className="px-4 py-2.5 rounded-xl font-black text-white text-sm bg-primary hover:opacity-90 active:scale-[0.98] transition-all shadow-md shadow-primary/20 flex items-center justify-center gap-2 cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Nuevo Rol
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {[1, 2].map((n) => (
            <div key={n} className="bg-card rounded-2xl border border-border p-6 h-64 animate-pulse" />
          ))}
        </div>
      ) : roles.length === 0 ? (
        <div className="bg-card border border-border rounded-2xl p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-muted text-muted-foreground flex items-center justify-center mx-auto">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <p className="font-bold text-foreground">No hay roles registrados</p>
          <p className="text-xs text-muted-foreground">Crea tu primer rol usando el botón superior.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {roles.map((role) => {
            const isAdmin = role.nombre_rol.toLowerCase().includes('admin');
            return (
              <div
                key={role.id_rol}
                className="bg-card rounded-2xl border border-border p-6 shadow-xs transition-all hover:border-primary/30 flex flex-col justify-between space-y-5"
              >
                {/* Cabecera de la tarjeta */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                        isAdmin
                          ? 'bg-purple-100 text-purple-600 dark:bg-purple-950/60 dark:text-purple-300'
                          : 'bg-blue-100 text-blue-600 dark:bg-blue-950/60 dark:text-blue-300'
                      }`}
                    >
                      <Lock className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-black text-base text-foreground truncate">
                        {role.nombre_rol}
                      </h3>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                        {role.descripcion || 'Sin descripción asignada'}
                      </p>
                    </div>
                  </div>

                  {/* Acciones de la tarjeta */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <ToggleSwitch
                      checked={Boolean(role.estado)}
                      onChange={() => handleToggleStatus(role)}
                    />
                    <button
                      onClick={() => handleEditRole(role)}
                      className="p-1.5 rounded-lg text-primary hover:bg-primary/10 transition-colors cursor-pointer"
                      title="Editar Rol y Permisos"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteRole(role)}
                      className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors cursor-pointer"
                      title="Eliminar Rol"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Lista de Permisos Asignados */}
                <div className="space-y-2.5 pt-2 border-t border-border">
                  <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                    PERMISOS ASIGNADOS
                  </p>
                  <div className="grid grid-cols-2 gap-1.5">
                    {canonicalPerms.map((permName) => {
                      const active = hasPermiso(role, permName);
                      return (
                        <div
                          key={permName}
                          className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                            active
                              ? 'bg-green-50 text-green-700 dark:bg-green-950/40 dark:text-green-300 border border-green-200/60 dark:border-green-800/40'
                              : 'bg-muted text-muted-foreground border border-transparent opacity-60'
                          }`}
                        >
                          {active ? (
                            <Check className="w-3.5 h-3.5 flex-shrink-0 stroke-[2.5]" />
                          ) : (
                            <X className="w-3.5 h-3.5 flex-shrink-0 stroke-[2.5]" />
                          )}
                          <span className="truncate">{permName}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal de Creación / Edición */}
      <RoleModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSaveRole}
        role={editingRole}
        allPermisosPrivilegios={allPermisosPrivilegios}
      />

      {/* Diálogo de Confirmación */}
      <ConfirmDialog
        open={confirmState.open}
        title={confirmState.title}
        message={confirmState.message}
        onConfirm={confirmState.onConfirm}
        onCancel={() => setConfirmState({ open: false, title: '', message: '', onConfirm: null })}
      />
    </div>
  );
}
