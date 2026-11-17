import { useCallback, useEffect, useState } from 'react';
import { request } from '../utils/request';
import { dateKey } from '../utils/dates';

const mapSchedule = (h) => ({
  id: h.id_horario,
  userId: h.id_usuario,
  nombre: h.nombre_usuario,
  apellido: h.apellido_usuario,
  rol: h.nombre_rol,
  fecha: dateKey(h.fecha_trabajo),
});

const mapUser = (u) => ({ ...u, estado: Boolean(u.estado) });

export default function useSchedules() {
  const [schedules, setSchedules] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setLoading(true);
    setError(null);
    try {
      const [scheduleRows, userRows] = await Promise.all([request('/horarios'), request('/usuarios')]);
      setSchedules(scheduleRows.map(mapSchedule));
      setUsers(userRows.map(mapUser));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // payload: { id_usuario, fecha_trabajo: 'YYYY-MM-DD' }
  const createSchedule = async (payload) => {
    await request('/horarios', { method: 'POST', body: payload });
    await load({ silent: true });
  };

  const updateSchedule = async (id, payload) => {
    await request(`/horarios/${id}`, { method: 'PUT', body: payload });
    await load({ silent: true });
  };

  const deleteSchedule = async (id) => {
    await request(`/horarios/${id}`, { method: 'DELETE' });
    await load({ silent: true });
  };

  return { schedules, users, loading, error, reload: load, createSchedule, updateSchedule, deleteSchedule };
}
