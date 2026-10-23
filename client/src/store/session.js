import { create } from "zustand";
import { setAuthTokenGetter, setUnauthorizedHandler } from "../lib/api";

/**
 * Store de sesión (Zustand).
 * Persiste { token, usuario } en localStorage y lo restaura al iniciar.
 * `usuario` es la forma del backend: { id, nombre, email, rol }.
 */
const SESSION_KEY = "chatap.session";

function loadStoredSession() {
  try {
    const raw = window.localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    // `token` puede ser null para cuentas locales (ciudadano demo): se
    // restauran igual mientras haya usuario.
    if (
      parsed &&
      parsed.usuario?.id &&
      (parsed.token == null || typeof parsed.token === "string")
    )
      return parsed;
  } catch {
    /* sesión corrupta: se ignora */
  }
  return null;
}

const stored = loadStoredSession();

export const useSessionStore = create((set) => ({
  token: stored?.token || null,
  usuario: stored?.usuario || null,

  setSession({ token, usuario }) {
    const session = { token, usuario };
    try {
      window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    } catch {
      /* storage no disponible */
    }
    set(session);
  },

  logout() {
    try {
      window.localStorage.removeItem(SESSION_KEY);
    } catch {
      /* storage no disponible */
    }
    set({ token: null, usuario: null });
  },
}));

// El interceptor de Axios pide el token al store (fuera de React).
setAuthTokenGetter(() => useSessionStore.getState().token);

// 401 global: el backend revalida la sesión en cada request, así que un
// token válido puede recibir 401 en cualquier momento (p. ej. cuenta
// suspendida). Se cierra sesión y se va al login.
setUnauthorizedHandler(() => {
  const { token, logout } = useSessionStore.getState();
  if (!token) return;
  logout();
  if (window.location.pathname !== "/login") {
    window.location.assign("/login");
  }
});
