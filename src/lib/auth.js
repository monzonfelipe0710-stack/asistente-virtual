export const USERS_KEY = "chatap.users";
export const SESSION_KEY = "chatap.session";

export function uid() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return "u_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export function readJSON(key, fallback) {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

export function writeJSON(key, value) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* quota / privacy mode */
  }
}

export function loadUsers() {
  const users = readJSON(USERS_KEY, []);
  return Array.isArray(users) ? users : [];
}

export function saveUsers(users) {
  writeJSON(USERS_KEY, users);
}

export function hashPassword(password) {
  // Hash de demostración estilo HMAC-SHA256. En producción delegar a una API
  // real con bcrypt/argon2; nunca almacenar contraseñas en claro.
  try {
    const data = new TextEncoder().encode("chatap::" + password + "::formosa");
    return crypto.subtle
      .digest("SHA-256", data)
      .then((buf) =>
        Array.from(new Uint8Array(buf))
          .map((b) => b.toString(16).padStart(2, "0"))
          .join("")
      );
  } catch {
    return Promise.resolve("plain:" + password);
  }
}

export function makeSession(user) {
  const session = {
    token: "sess_" + uid().replace(/-/g, "") + "_" + Date.now().toString(36),
    userId: user.id,
    issuedAt: new Date().toISOString(),
  };
  writeJSON(SESSION_KEY, session);
  return session;
}

// --- Cuentas de ciudadano (demo, sólo navegador) -------------------------
// El backend no expone registro público de ciudadanos, así que estas cuentas
// viven en localStorage y se validan localmente. No usan JWT.
const CIUDADANO = "CIUDADANO";

/** Busca una cuenta de ciudadano local por email. */
export function findLocalCitizen(email) {
  const target = (email || "").trim().toLowerCase();
  if (!target) return null;
  return (
    loadUsers().find(
      (u) => u.rol === CIUDADANO && (u.email || "").toLowerCase() === target
    ) || null
  );
}

/** Crea una cuenta de ciudadano local. Devuelve el usuario guardado. */
export async function registerLocalCitizen({ nombre, email, password }) {
  const target = (email || "").trim().toLowerCase();
  if (findLocalCitizen(target)) {
    throw new Error("Ya existe una cuenta con esa dirección de correo electrónico.");
  }
  const user = {
    id: uid(),
    nombre,
    email: target,
    passwordHash: await hashPassword(password),
    rol: CIUDADANO,
    createdAt: new Date().toISOString(),
  };
  saveUsers([...loadUsers(), user]);
  return user;
}

/** Valida credenciales de una cuenta de ciudadano local. */
export async function verifyLocalCitizen(email, password) {
  const user = findLocalCitizen(email);
  if (!user) return null;
  const hash = await hashPassword(password);
  return user.passwordHash === hash ? user : null;
}
