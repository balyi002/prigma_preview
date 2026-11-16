import api from '../../../utils/api';

export const clientService = {
  getAll: async () => {
    try {
      const res = await api.get('/clientes');
      return Array.isArray(res.data) ? res.data : [];
    } catch (err) {
      console.error('Error al obtener clientes:', err);
      throw new Error(err.response?.data?.error || 'Error al obtener clientes');
    }
  },

  create: async (data) => {
    try {
      const res = await api.post('/clientes', data);
      return res.data;
    } catch (err) {
      throw new Error(err.response?.data?.error || 'Error al crear cliente');
    }
  },

  update: async (id, data) => {
    try {
      const res = await api.put(`/clientes/${id}`, data);
      return res.data;
    } catch (err) {
      throw new Error(err.response?.data?.error || 'Error al actualizar cliente');
    }
  },

  updateStatus: async (id, estado) => {
    try {
      const res = await api.patch(`/clientes/${id}/estado`, { estado: estado ? 1 : 0 });
      return res.data;
    } catch (err) {
      throw new Error(err.response?.data?.error || 'Error al actualizar estado del cliente');
    }
  },

  delete: async (id) => {
    try {
      const res = await api.delete(`/clientes/${id}`);
      return res.data;
    } catch (err) {
      throw new Error(err.response?.data?.error || 'Error al eliminar cliente');
    }
  }
};
