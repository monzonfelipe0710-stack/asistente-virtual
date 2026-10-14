import { api } from "../lib/api";

/** POST /api/auth/login — público. Devuelve { token, usuario }. */
export async function login({ email, password }) {
  const { data } = await api.post(
    "/api/auth/login",
    { email, password },
    { skipAuthHandler: true }
  );
  return data;
}
