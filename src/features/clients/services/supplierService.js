const API_URL = 'http://localhost:3000/api/proveedores';

export const supplierService = {
  getAll: async () => (await fetch(API_URL)).json(),
  create: async (data) => {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) { const err = await res.json(); throw new Error(err.error); }
    return res.json();
  },
  update: async (id, data) => {
    const res = await fetch(`${API_URL}/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) { const err = await res.json(); throw new Error(err.error); }
    return res.json();
  },
  updateStatus: async (id, estado) => {
    await fetch(`${API_URL}/${id}/estado`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ estado })
    });
  },
  delete: async (id) => {
    const res = await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
    if (!res.ok) { const err = await res.json(); throw new Error(err.error); }
    return res.json();
  }
};