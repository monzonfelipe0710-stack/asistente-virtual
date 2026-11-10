import { api } from "../lib/api";

/** POST /api/auth/login — público. Devuelve { token, usuario }. */
export async function login({ email, dni, password }) {
  const identificador = email ? { email } : { dni };
  const { data } = await api.post(
    "/api/auth/login",
    { ...identificador, password },
    { skipAuthHandler: true }
  );
  return data;
}

/** POST /api/auth/recuperar — público. Body { email }. Responde { mensaje }. */
export async function solicitarRecuperacion({ email }) {
  const { data } = await api.post("/api/auth/recuperar", { email }, { skipAuthHandler: true });
  return data;
}

/** POST /api/auth/restablecer — público. Body { token, password }. Responde { mensaje }. */
export async function restablecer({ token, password }) {
  const { data } = await api.post("/api/auth/restablecer", { token, password }, { skipAuthHandler: true });
  return data;
}

/** POST /api/auth/cambiar-password — autenticado. Body { passwordActual, passwordNueva }. Responde { mensaje, token, usuario }. */
export async function cambiarPassword({ passwordActual, passwordNueva }) {
  const { data } = await api.post("/api/auth/cambiar-password", { passwordActual, passwordNueva });
  return data;
}
