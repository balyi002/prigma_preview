const API_URL = 'http://localhost:3000/api/clientes';

export const clientService = {
  getAll: async () => {
    const res = await fetch(API_URL);
    if (!res.ok) throw new Error('Error al cargar clientes');
    return res.json();
  }
};