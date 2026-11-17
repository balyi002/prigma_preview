import api from '../../../utils/api';

export const serviceCategoryService = {
  // Obtener todas las categorías de servicio
  getCategories: async () => {
    const res = await api.get('/categorias-servicio');
    return res.data;
  },

  // Crear nueva categoría de servicio
  createCategory: async (categoryData) => {
    const res = await api.post('/categorias-servicio', categoryData);
    return res.data;
  },

  // Actualizar categoría de servicio
  updateCategory: async (id, categoryData) => {
    const res = await api.put(`/categorias-servicio/${id}`, categoryData);
    return res.data;
  },

  // Eliminar categoría de servicio
  deleteCategory: async (id) => {
    const res = await api.delete(`/categorias-servicio/${id}`);
    return res.data;
  }
};
