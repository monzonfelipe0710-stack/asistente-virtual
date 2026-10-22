import axios from "axios";

/**
 * Instancia única de Axios para toda la app.
 * - Base URL desde `VITE_API_URL` (desarrollo: http://localhost:3001).
 * - El token de sesión lo aporta el store vía `setAuthTokenGetter`.
 * - 401 global: el store de sesión registra su handler con
 *   `setUnauthorizedHandler` (cerrar sesión + redirigir al login).
 *   El backend revalida la sesión en cada request, así que un 401 puede
 *   llegar en cualquier momento (p. ej. cuenta suspendida).
 */
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:3000",
  timeout: 20000,
});

let getToken = () => null;
let unauthorizedHandler = null;

export function setAuthTokenGetter(fn) {
  getToken = typeof fn === "function" ? fn : () => null;
}

export function setUnauthorizedHandler(fn) {
  unauthorizedHandler = typeof fn === "function" ? fn : null;
}

api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    const skip = error?.config?.skipAuthHandler;
    if (status === 401 && !skip) {
      unauthorizedHandler?.();
    }
    return Promise.reject(error);
  }
);

/** Mensaje legible de un error: siempre `{ error: string }` en el backend. */
export function apiErrorMessage(error, fallback = "Ocurrió un error. Intentá nuevamente.") {
  const data = error?.response?.data;
  if (data && typeof data.error === "string" && data.error.trim()) return data.error;
  if (error?.code === "ECONNABORTED") return "La solicitud tardó demasiado. Revisá tu conexión.";
  if (!error?.response) return "No se pudo conectar con el servidor. Intentá nuevamente.";
  return fallback;
}
