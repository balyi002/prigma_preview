import api from '../../../utils/api';

export const userService = {
  getAll: async () => {
    try {
      const res = await api.get('/usuarios');
      return Array.isArray(res.data) ? res.data : [];
    } catch (err) {
      console.error('Error al obtener usuarios:', err);
      throw new Error(err.response?.data?.error || 'Error al obtener usuarios');
    }
  },

  getRoles: async () => {
    try {
      const res = await api.get('/roles');
      return Array.isArray(res.data) ? res.data : [];
    } catch (err) {
      console.error('Error al obtener roles:', err);
      throw new Error(err.response?.data?.error || 'Error al obtener roles');
    }
  },

  getTiposDocumento: async () => {
    try {
      const res = await api.get('/tipos-documento');
      return Array.isArray(res.data) ? res.data : [];
    } catch (err) {
      console.error('Error al obtener tipos de documento:', err);
      throw new Error(err.response?.data?.error || 'Error al obtener tipos de documento');
    }
  },

  create: async (data) => {
    try {
      const res = await api.post('/usuarios', data);
      return res.data;
    } catch (err) {
      throw new Error(err.response?.data?.error || 'Error al crear usuario');
    }
  },

  update: async (id, data) => {
    try {
      const res = await api.put(`/usuarios/${id}`, data);
      return res.data;
    } catch (err) {
      throw new Error(err.response?.data?.error || 'Error al actualizar usuario');
    }
  },

  updateStatus: async (id, estado) => {
    try {
      const res = await api.patch(`/usuarios/${id}/estado`, { estado: estado ? 1 : 0 });
      return res.data;
    } catch (err) {
      throw new Error(err.response?.data?.error || 'Error al actualizar estado del usuario');
    }
  },

  delete: async (id) => {
    try {
      const res = await api.delete(`/usuarios/${id}`);
      return res.data;
    } catch (err) {
      throw new Error(err.response?.data?.error || 'Error al eliminar usuario');
    }
  }
};
