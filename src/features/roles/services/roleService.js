import api from '../../../utils/api';

export const roleService = {
  getRoles: async () => {
    const res = await api.get('/roles');
    return res.data;
  },

  createRole: async (roleData) => {
    const res = await api.post('/roles', roleData);
    return res.data;
  },

  updateRole: async (id, roleData) => {
    const res = await api.put(`/roles/${id}`, roleData);
    return res.data;
  },

  updateRoleStatus: async (id, estado) => {
    const res = await api.patch(`/roles/${id}/estado`, { estado });
    return res.data;
  },

  deleteRole: async (id) => {
    const res = await api.delete(`/roles/${id}`);
    return res.data;
  },

  getPermisos: async () => {
    const res = await api.get('/permisos');
    return res.data;
  },

  getPrivilegios: async () => {
    const res = await api.get('/privilegios');
    return res.data;
  },

  getPermisosPrivilegios: async () => {
    const res = await api.get('/permisos-privilegios');
    return res.data;
  },

  getRolePermisos: async (idRol) => {
    const res = await api.get(`/roles/${idRol}/permisos`);
    return res.data;
  },

  updateRolePermisos: async (idRol, asignaciones) => {
    const res = await api.put(`/roles/${idRol}/permisos`, { asignaciones });
    return res.data;
  }
};
