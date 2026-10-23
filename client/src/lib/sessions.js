import { readJSON, writeJSON, uid } from "./auth";
import { SESSION_KEY } from "./auth";

// Registro de sesiones por usuario.
// En la demo (localStorage + una sola sesión por navegador) este registro
// representa los inicios de sesión de la cuenta en este u otros navegadores
// que compartan el almacenamiento.
//
// NOTA BACKEND: el cierre de sesión "en otros dispositivos" requiere un backend
// real con tokens revocables (p. ej. jti en JWT) y un endpoint
//   DELETE /auth/sessions/:id   ó   POST /auth/sessions/revoke-others
// que invalide los tokens. Acá solo se limpia el registro local.

const SESSIONS_KEY = "chatap.sessions";

function normalizeList(list) {
  return Array.isArray(list) ? list : [];
}

export function loadSessions() {
  return normalizeList(readJSON(SESSIONS_KEY, []));
}

export function saveSessions(list) {
  writeJSON(SESSIONS_KEY, normalizeList(list).slice(0, 50));
}

export function currentSession() {
  const s = readJSON(SESSION_KEY, null);
  return s && s.token ? s : null;
}

export function loadSessionsFor(userId) {
  if (!userId) return [];
  return loadSessions()
    .filter((s) => s.userId === userId)
    .sort((a, b) => new Date(b.lastSeenAt || 0) - new Date(a.lastSeenAt || 0));
}

// Registra (o refresca) la sesión activa del usuario.
export function recordSession(userId, sessionId, deviceLabel) {
  if (!userId || !sessionId) return;
  const now = new Date().toISOString();
  const all = loadSessions().filter((s) => !(s.userId === userId && s.sessionId === sessionId));
  saveSessions([
    {
      id: uid(),
      userId,
      sessionId,
      device: deviceLabel || "Este dispositivo",
      issuedAt: now,
      lastSeenAt: now,
    },
    ...all,
  ]);
}

export function endOtherSessions(userId, keepSessionId) {
  if (!userId) return;
  saveSessions(
    loadSessions().filter(
      (s) => !(s.userId === userId && s.sessionId !== keepSessionId)
    )
  );
}

export function deleteUserSessions(userId) {
  if (!userId) return;
  saveSessions(loadSessions().filter((s) => s.userId !== userId));
}

export function buildDeviceLabel() {
  const nav = typeof navigator !== "undefined" ? navigator : null;
  if (!nav || !nav.userAgent) return "Este dispositivo";
  const ua = nav.userAgent;
  let browser = "Navegador";
  if (/edg\//i.test(ua)) browser = "Microsoft Edge";
  else if (/opr\//i.test(ua)) browser = "Opera";
  else if (/chrome\//i.test(ua)) browser = "Chrome";
  else if (/firefox\//i.test(ua)) browser = "Firefox";
  else if (/safari\//i.test(ua)) browser = "Safari";

  let os = "otro sistema";
  if (/windows nt/i.test(ua)) os = "Windows";
  else if (/android/i.test(ua)) os = "Android";
  else if (/iphone|ipad|ipod/i.test(ua)) os = "iOS";
  else if (/mac os x|macintosh/i.test(ua)) os = "macOS";
  else if (/linux/i.test(ua)) os = "Linux";

  return `${browser} · ${os}`;
}