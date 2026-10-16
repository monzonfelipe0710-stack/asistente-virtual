import { readJSON, writeJSON, uid } from "./auth";

// Notificaciones personales por usuario (localStorage).
// Estructura de una notificación:
//   { id, title, body, type: "solicitud" | "tramite" | "sistema" | "seguridad",
//     createdAt (ISO), read: boolean }
//
// NOTA BACKEND: para notificaciones en tiempo real entre dispositivos se
// necesita un endpoint que emita eventos (p. ej. push/websocket). Hoy las
// notificaciones se escriben en localStorage cuando otros módulos las generan
// (p. ej. al resolver una solicitud de empleado).

const PREFIX = "chatap.notifications.";

function keyFor(userId) {
  return PREFIX + userId;
}

export function loadNotifications(userId) {
  if (!userId) return [];
  const list = readJSON(keyFor(userId), []);
  return Array.isArray(list) ? list : [];
}

export function saveNotifications(userId, list) {
  if (!userId) return;
  writeJSON(keyFor(userId), Array.isArray(list) ? list.slice(0, 100) : []);
}

// Agrega una notificación al inicio de la lista del usuario.
export function pushNotification(userId, { title, body, type = "sistema" }) {
  if (!userId) return null;
  const list = loadNotifications(userId);
  const notif = {
    id: uid(),
    title: title || "Notificación",
    body: body || "",
    type,
    createdAt: new Date().toISOString(),
    read: false,
  };
  saveNotifications(userId, [notif, ...list]);
  return notif;
}

export function markNotificationRead(userId, id) {
  if (!userId) return;
  saveNotifications(
    userId,
    loadNotifications(userId).map((n) => (n.id === id ? { ...n, read: true } : n))
  );
}

export function markAllNotificationsRead(userId) {
  if (!userId) return;
  saveNotifications(
    userId,
    loadNotifications(userId).map((n) => ({ ...n, read: true }))
  );
}

export function notificationsUnreadCount(userId) {
  return loadNotifications(userId).filter((n) => !n.read).length;
}

export function deleteNotifications(userId) {
  if (!userId) return;
  try {
    window.localStorage.removeItem(keyFor(userId));
  } catch {
    /* noop */
  }
}

// Tipos disponibles para colorear los íconos.
export const NOTIFICATION_TYPES = ["solicitud", "tramite", "sistema", "seguridad"];