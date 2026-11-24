import api from '../../../utils/api';

export const categoryService = {
  getCategories: async () => {
    const res = await api.get('/categorias-producto');
    return res.data;
  },

  createCategory: async (categoryData) => {
    const res = await api.post('/categorias-producto', categoryData);
    return res.data;
  },

  updateCategory: async (id, categoryData) => {
    const res = await api.put(`/categorias-producto/${id}`, categoryData);
    return res.data;
  },

  deleteCategory: async (id) => {
    const res = await api.delete(`/categorias-producto/${id}`);
    return res.data;
  }
};
