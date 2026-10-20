import { readJSON, writeJSON, uid } from "./auth";
import { activityLog } from "../data/mockActivity";

// Registro de actividad / auditoría (único para todo el sistema, key global).
// Evento:
//   { id, userId (actor) | null, actor (nombre), action (verbo),
//     target (objeto afectado), type, result: "ok"|"error", createdAt (ISO),
//     displayDate (string opcional, para eventos migrados) }
//
// NOTA BACKEND: para una auditoría completa (usuarios, roles, permisos, IP,
// trazas por entidad) se necesita un backend con un repositorio de logs y un
// endpoint:
//   GET /audit?actor=...&type=...&from=&to=
// La clave local se siembra una vez con el registro previo de mockActivity.

const ACTIVITY_KEY = "chatap.activity";

export const ACTIVITY_TYPES = [
  "user",
  "solicitud",
  "tramite",
  "documento",
  "conocimiento",
  "config",
  "seguridad",
  "sistema",
];

const TYPE_MAP = {
  user: "user",
  siged: "tramite",
  knowledge: "conocimiento",
  document: "documento",
  settings: "config",
};

function seedActivity() {
  return activityLog.map((e) => ({
    id: "seed-" + e.id,
    userId: null,
    actor: e.user,
    action: e.action,
    target: e.target,
    type: TYPE_MAP[e.type] || "sistema",
    result: "ok",
    createdAt: null,
    displayDate: e.timestamp,
  }));
}

export function loadActivity() {
  const stored = readJSON(ACTIVITY_KEY, null);
  if (Array.isArray(stored)) return stored;
  const seeded = seedActivity();
  writeJSON(ACTIVITY_KEY, seeded);
  return seeded;
}

export function saveActivity(list) {
  writeJSON(ACTIVITY_KEY, Array.isArray(list) ? list.slice(0, 200) : []);
}

export function pushActivity({ userId, actor, action, target = "", type = "sistema", result = "ok" }) {
  const event = {
    id: uid(),
    userId: userId || null,
    actor: actor || "Sistema",
    action: action || "realizó una acción",
    target,
    type,
    result,
    createdAt: new Date().toISOString(),
    displayDate: null,
  };
  saveActivity([event, ...loadActivity()]);
  return event;
}

// Lista global ordenada más reciente primero.
export function activityFeed(limit = 100) {
  const list = loadActivity();
  return list.slice(0, limit);
}

// Actividad generada por un usuario específico.
export function personalActivity(userId, limit = 50) {
  if (!userId) return [];
  return loadActivity()
    .filter((e) => e.userId === userId)
    .slice(0, limit);
}

export function removeUserActivity(userId) {
  if (!userId) return;
  saveActivity(loadActivity().filter((e) => e.userId !== userId));
}