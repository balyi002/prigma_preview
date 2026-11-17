// Cliente mínimo para el mini servidor Express (backend/server.js).
// La URL base se puede cambiar con VITE_API_URL en el .env del frontend.
const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api';

export async function request(path, { body, ...options } = {}) {
  let res;
  try {
    res = await fetch(`${API_URL}${path}`, {
      headers: { 'Content-Type': 'application/json' },
      ...options,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new Error('No se pudo conectar con el servidor. Verifica que el backend esté encendido.');
  }

  let data = null;
  try {
    data = await res.json();
  } catch {
    /* respuesta sin cuerpo */
  }

  // handleErr() del servidor siempre responde { error: "..." } (triggers, FK, duplicados)
  if (!res.ok) throw new Error(data?.error || `Error ${res.status} en la solicitud`);
  return data;
}
