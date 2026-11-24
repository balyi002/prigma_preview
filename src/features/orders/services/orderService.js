import api from '../../../utils/api';

export const orderService = {
  getOrders: async () => {
    const res = await api.get('/pedidos');
    return res.data;
  },

  getOrderDetail: async (id) => {
    const res = await api.get(`/pedidos/${id}/detalle`);
    return res.data;
  },

  updateOrderStatus: async (id, id_estado) => {
    const res = await api.patch(`/pedidos/${id}/estado`, { id_estado });
    return res.data;
  },

  deleteOrder: async (id) => {
    const res = await api.delete(`/pedidos/${id}`);
    return res.data;
  },

  addPayment: async (id, paymentData) => {
    const res = await api.post(`/pedidos/${id}/pagos`, paymentData);
    return res.data;
  },

  addProductToOrder: async (id, productData) => {
    const res = await api.post(`/pedidos/${id}/productos`, productData);
    return res.data;
  },

  addServiceToOrder: async (id, serviceData) => {
    const res = await api.post(`/pedidos/${id}/servicios`, serviceData);
    return res.data;
  },

  getPOSCatalog: async () => {
    const [prodsRes, servsRes, catsRes, clientsRes, estadosRes] = await Promise.all([
      api.get('/productos'),
      api.get('/servicios'),
      api.get('/categorias-producto'),
      api.get('/clientes'),
      api.get('/estados')
    ]);
    return {
      productos: prodsRes.data,
      servicios: servsRes.data,
      categorias: catsRes.data,
      clientes: clientsRes.data,
      estados: estadosRes.data
    };
  },

  checkout: async (checkoutData) => {
    const res = await api.post('/pos/checkout', checkoutData);
    return res.data;
  }
};
