import api from '../../../utils/api';

export const employeeService = {
  // Obtiene el listado de empleados (excluye administradores) desde la base de datos
  getEmployees: async () => {
    const res = await api.get('/usuarios', {
      params: { excluir_admin: 'true' }
    });
    return res.data;
  },

  // Alterna o actualiza el estado de un empleado (activo / inactivo)
  updateEmployeeStatus: async (id, estado) => {
    const res = await api.patch(`/usuarios/${id}/estado`, { estado });
    return res.data;
  }
};
