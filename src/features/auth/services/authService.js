import api from '../../../utils/api';

export const authService = {
  login: async (documento, contrasena) => {
    const response = await api.post('/login', { documento, contrasena });
    if (response.data && response.data.usuario) {
      localStorage.setItem('prigma_user', JSON.stringify(response.data.usuario));
    }
    return response.data;
  },

  getCurrentUser: () => {
    try {
      const user = localStorage.getItem('prigma_user');
      return user ? JSON.parse(user) : null;
    } catch {
      return null;
    }
  },

  logout: () => {
    localStorage.removeItem('prigma_user');
  }
};
