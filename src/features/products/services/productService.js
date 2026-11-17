import api from '../../../utils/api';

export const productService = {
  // Obtener listado de productos con su categoría
  getProducts: async () => {
    const res = await api.get('/productos');
    return res.data;
  },

  // Crear un nuevo producto
  createProduct: async (productData) => {
    const res = await api.post('/productos', productData);
    return res.data;
  },

  // Actualizar un producto existente
  updateProduct: async (id, productData) => {
    const res = await api.put(`/productos/${id}`, productData);
    return res.data;
  },

  // Alternar o actualizar estado (activo/inactivo)
  updateProductStatus: async (id, estado) => {
    const res = await api.patch(`/productos/${id}/estado`, { estado });
    return res.data;
  },

  // Eliminar producto
  deleteProduct: async (id) => {
    const res = await api.delete(`/productos/${id}`);
    return res.data;
  },

  // Obtener categorías de productos para el selector del formulario
  getCategories: async () => {
    const res = await api.get('/categorias-producto');
    return res.data;
  }
};
