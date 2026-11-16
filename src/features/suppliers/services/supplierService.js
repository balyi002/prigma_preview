import api from '../../../utils/api';

export const supplierService = {
  getAll: async () => {
    try {
      const res = await api.get('/proveedores');
      return Array.isArray(res.data) ? res.data : [];
    } catch (err) {
      console.error('Error al obtener proveedores:', err);
      throw new Error(err.response?.data?.error || 'Error al obtener proveedores');
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
      const res = await api.post('/proveedores', data);
      return res.data;
    } catch (err) {
      throw new Error(err.response?.data?.error || 'Error al crear proveedor');
    }
  },

  update: async (id, data) => {
    try {
      const res = await api.put(`/proveedores/${id}`, data);
      return res.data;
    } catch (err) {
      throw new Error(err.response?.data?.error || 'Error al actualizar proveedor');
    }
  },

  updateStatus: async (id, estado) => {
    try {
      const res = await api.patch(`/proveedores/${id}/estado`, { estado: estado ? 1 : 0 });
      return res.data;
    } catch (err) {
      throw new Error(err.response?.data?.error || 'Error al actualizar estado del proveedor');
    }
  },

  delete: async (id) => {
    try {
      const res = await api.delete(`/proveedores/${id}`);
      return res.data;
    } catch (err) {
      throw new Error(err.response?.data?.error || 'Error al eliminar proveedor');
    }
  }
};
