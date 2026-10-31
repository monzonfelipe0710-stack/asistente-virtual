import axios from "axios";

/**
 * Instancia única de Axios para toda la app.
 * - VITE_API_URL permite configurar la API en cada entorno.
 * - En desarrollo, si falta la variable, usa el backend local.
 * - En producción, si falta la variable, usa el mismo origen (sin
 *   intentar conectarse silenciosamente a localhost del navegador).
 * - El token y el handler 401 los aporta el store de sesión.
 */
const apiBaseURL =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.DEV ? "http://localhost:3001" : "/");

export const api = axios.create({
  baseURL: apiBaseURL,
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
