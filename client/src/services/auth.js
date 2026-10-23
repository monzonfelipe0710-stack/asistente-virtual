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
