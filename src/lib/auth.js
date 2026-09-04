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
