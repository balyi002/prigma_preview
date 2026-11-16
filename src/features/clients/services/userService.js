const API_URL = 'http://localhost:3000/api/usuarios';

export const userService = {
  getAll: async () => (await fetch(API_URL)).json(),
  getRoles: async () => (await fetch('http://localhost:3000/api/roles')).json(),
  getTiposDocumento: async () => (await fetch('http://localhost:3000/api/tipos-documento')).json(),
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