import { useMemo } from "react";
import { useAuth } from "../../context/AuthContext";
import { loadUsers } from "../../lib/auth";
import { readJSON } from "../../lib/auth";
import { loadEmployeeRequests } from "../../lib/employeeRequests";
import { sigedRecords } from "../../data/mockSiged";
import { loadNotifications } from "../../lib/notifications";
import { loadSessionsFor, currentSession } from "../../lib/sessions";
import { loadPreferences } from "../../lib/preferences";
import { personalActivity, activityFeed } from "../../lib/activity";

const SIGED_LIVE = ["Ingresado", "En proceso"];

// Agrupa los mensajes del chat en "conversaciones" separándolas por bloques
// de inactividad (>= 40 min). El historial se guarda como lista plana.
export function groupChatSessions(messages = []) {
  const sessions = [];
  let current = null;
  for (const msg of messages) {
    const t = msg.timestamp ? new Date(msg.timestamp).getTime() : 0;
    if (!current || current.lastAt - t > 40 * 60 * 1000) {
      current = { messages: [], startedAt: t, lastAt: t };
      sessions.push(current);
    }
    current.messages.push(msg);
    current.lastAt = Math.max(current.lastAt, t);
  }
  return sessions;
}

export function useProfileData() {
  const { user, userRole, isSuperadmin } = useAuth();

  return useMemo(() => {
    if (!user) return null;

    const allRequests = loadEmployeeRequests();
    const myRequests = allRequests
      .filter((r) => r.userId === user.id)
      .sort((a, b) => new Date(b.requestedAt || 0) - new Date(a.requestedAt || 0));

    // "Mis trámites": los expedientes SIGED se vinculan hoy por coincidencia
    // de nombre del solicitante. NOTA BACKEND: se necesita un campo userId en
    // el expediente para una vinculación exacta (ver README).
    const myTramites = sigedRecords
      .filter((r) => (r.applicant || "").toLowerCase() === (user.name || "").toLowerCase())
      .sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));

    const allUsers = loadUsers();
    const notifications = loadNotifications(user.id);
    const sessions = loadSessionsFor(user.id);
    const session = currentSession();
    const prefs = loadPreferences(user.id);
    const chatMessages = readJSON(`chatap.history.${user.id}`, []);
    const chatSessions = groupChatSessions(chatMessages);

    const requestsByStatus = (s) => allRequests.filter((r) => r.status === s).length;
    const tramitesActivos = sigedRecords.filter((r) => SIGED_LIVE.includes(r.status)).length;

    return {
      user,
      userRole,
      isSuperadmin,
      prefs,

      // Solicitudes
      myRequests,
      requestsPendientes: requestsByStatus("Pendiente"),
      requestsActivas: requestsByStatus("Activo"),
      requestsSuspendidas: requestsByStatus("Suspendido"),
      requestsRechazadas: requestsByStatus("Rechazado"),
      requestsTotales: allRequests.length,

      // Trámites
      myTramites,
      tramitesActivos,
      tramitesTotales: sigedRecords.length,

      // Usuarios (cuentas reales de chatap.users)
      allUsers,
      usersTotales: allUsers.length,
      usersCiudadanos: allUsers.filter((u) => u.role === "Ciudadano").length,
      usersAdministradores: allUsers.filter((u) => u.role === "Administrador").length,
      usersSuperAdmins: allUsers.filter((u) => u.role === "Superadmin").length,
      usersActivos: allUsers.filter((u) => u.status !== "Suspendido").length,
      usersSuspendidos: allUsers.filter((u) => u.status === "Suspendido").length,
      usersNuevos: allUsers.filter((u) => {
        const c = new Date(u.createdAt || 0).getTime();
        // La ventana de 30 días depende del reloj del dispositivo (dato volátil, no de render)
        // eslint-disable-next-line react-hooks/purity
        return c > Date.now() - 30 * 24 * 60 * 60 * 1000;
      }).length,

      // Notificaciones
      notifications,
      notificationsUnread: notifications.filter((n) => !n.read).length,

      // Conversaciones
      chatMessages,
      chatSessions,

      // Sesiones
      sessions,
      session,

      // Actividad
      myActivity: personalActivity(user.id, 50),
      systemActivity: isSuperadmin ? activityFeed(60) : [],
    };
  }, [user, userRole, isSuperadmin]);
}

// Estado legible para la UI de cada solicitud de empleado.
export const requestStatusMeta = {
  Pendiente: { label: "Pendiente", tone: "bg-warn/10 text-warn", dots: "dot-ping bg-current" },
  Activo: { label: "Activo", tone: "bg-ok/10 text-ok" },
  Suspendido: { label: "Suspendido", tone: "bg-muted/15 text-muted" },
  Rechazado: { label: "Rechazado", tone: "bg-bad/10 text-bad" },
};