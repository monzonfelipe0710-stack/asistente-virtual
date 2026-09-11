import { createContext, useContext, useState, useCallback, useEffect } from "react";
import {
  SESSION_KEY,
  uid,
  readJSON,
  writeJSON,
  loadUsers,
  saveUsers,
  hashPassword,
  makeSession,
} from "../lib/auth";
import {
  loadEmployeeRequests,
  saveEmployeeRequests,
  buildRequestFromUser,
} from "../lib/employeeRequests";
import { sendResetEmail } from "../lib/email";
import {
  recordSession,
  deleteUserSessions,
  buildDeviceLabel,
} from "../lib/sessions";
import { pushActivity, removeUserActivity } from "../lib/activity";
import {
  pushNotification,
  deleteNotifications,
} from "../lib/notifications";
import { deletePreferences } from "../lib/preferences";

const AuthContext = createContext(null);

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de AuthProvider");
  return ctx;
}

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Usuario SuperAdmin inicial (seed automático en localStorage).
// Credenciales por defecto:
//   Email: superadmin@formosa.gob.ar
//   Contraseña: Superadmin123*
export const SUPERADMIN_EMAIL = "superadmin@formosa.gob.ar";
export const SUPERADMIN_NAME = "Super Administrador";
const SUPERADMIN_PASSWORD = "Superadmin123*";

// Enlaces de recuperación: token de un solo uso, válido por 1 hora.
// El envío real del mail va por EmailJS (ver src/lib/emailConfig.js).
// Si no está configurado, se devuelve el enlace para mostrarlo en pantalla.
const RESET_KEY = "chatap.pwreset";
const RESET_TTL_MS = 60 * 60 * 1000;

// Emails autorizados a acceder al panel interno (Panel de Administración).
// Agregá aquí los correos de administradores / moderadores.
const STAFF_EMAILS = [
  "admin@formosa.gob.ar",
  "moderador@formosa.gob.ar",
  SUPERADMIN_EMAIL,
];

function roleForEmail(email, storedRole) {
  const normalized = (email || "").trim().toLowerCase();
  if (normalized === SUPERADMIN_EMAIL) return "Superadmin";
  // Migración de roles anteriores (ya no existen Supervisor ni Agente).
  if (storedRole === "Supervisor") return "Administrador";
  if (storedRole === "Agente") return "Ciudadano";
  if (storedRole && ["Superadmin", "Administrador", "Ciudadano"].includes(storedRole))
    return storedRole;
  if (STAFF_EMAILS.includes(normalized)) return "Administrador";
  return "Ciudadano";
}

function isInternalRole(email, storedRole) {
  const role = roleForEmail(email, storedRole);
  return role === "Superadmin" || role === "Administrador";
}

function restoreSession() {
  const session = readJSON(SESSION_KEY, null);
  if (session && session.userId) {
    const users = loadUsers();
    const found = users.find((u) => u.id === session.userId) || null;
    if (found && found.status === "Suspendido") return null;
    if (found) {
      recordSession(found.id, session.token, buildDeviceLabel());
      return { ...found, role: roleForEmail(found.email, found.role) };
    }
    return null;
  }
  return null;
}

async function ensureSuperadminSeeded() {
  try {
    const users = loadUsers();
    const normalized = SUPERADMIN_EMAIL.toLowerCase();
    const existing = users.find((u) => u.email === normalized);
    if (!existing) {
      const hashed = await hashPassword(SUPERADMIN_PASSWORD);
      const superUser = {
        id: uid(),
        name: SUPERADMIN_NAME,
        email: normalized,
        password: hashed,
        role: "Superadmin",
        provider: "email",
        createdAt: new Date().toISOString(),
        lastAccessAt: new Date().toISOString(),
      };
      saveUsers([...users, superUser]);
    } else if (existing.role !== "Superadmin") {
      saveUsers(users.map((u) => (u.email === normalized ? { ...u, role: "Superadmin" } : u)));
    }
  } catch {
    /* noop */
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => restoreSession());

  // Crea el usuario SuperAdmin la primera vez que abre la app.
  useEffect(() => {
    ensureSuperadminSeeded();
  }, []);

  const login = useCallback(async (email, password) => {
    const normalized = (email || "").trim().toLowerCase();
    if (!emailRegex.test(normalized)) throw new Error("Ingresá un correo electrónico válido.");
    if (!password) throw new Error("Ingresá tu contraseña.");

    const users = loadUsers();
    const found = users.find((u) => u.email === normalized);
    if (!found) throw new Error("No existe una cuenta con ese correo. Registrate primero.");

    if (found.status === "Suspendido")
      throw new Error("Tu cuenta está suspendida. Contactá a un Administrador.");

    const hashed = await hashPassword(password);
    if (hashed !== found.password) throw new Error("Correo o contraseña incorrectos.");

    const withRole = { ...found, role: roleForEmail(found.email, found.role), lastAccessAt: new Date().toISOString() };
    saveUsers(users.map((u) => (u.id === found.id ? withRole : u)));
    const session = makeSession(withRole);
    recordSession(withRole.id, session.token, buildDeviceLabel());
    setUser(withRole);
    return withRole;
  }, []);

  const register = useCallback(async ({ name, email, password, cuil, phone, department, position, reason, requestsEmployeeAccess }) => {
    const cleanName = (name || "").trim();
    const normalized = (email || "").trim().toLowerCase();

    if (!cleanName) throw new Error("Ingresá tu nombre.");
    if (!emailRegex.test(normalized)) throw new Error("Ingresá un correo electrónico válido.");
    if (!password || password.length < 6)
      throw new Error("La contraseña debe tener al menos 6 caracteres.");

    let employeeData = null;
    if (requestsEmployeeAccess) {
      const cleanCuil = (cuil || "").trim();
      if (!/^\d{2}-\d{7,8}-\d$/.test(cleanCuil))
        throw new Error("Ingresá un CUIL válido (formato 20-12345678-3).");
      // El DNI va incluido en el CUIL (dígitos del medio): no se pide por separado.
      const derivedDni = cleanCuil.replace(/\D/g, "").slice(2, -1);
      if (!phone || phone.trim().length < 6)
        throw new Error("Ingresá un teléfono válido.");
      if (!department) throw new Error("Seleccioná tu dependencia.");
      if (!position || position.trim().length < 3)
        throw new Error("Indicá tu puesto.");
      employeeData = {
        dni: derivedDni,
        cuil: cleanCuil,
        phone: phone.trim(),
        department,
        position: position.trim(),
        reason: (reason || "").trim(),
      };
    }

    const users = loadUsers();
    if (users.some((u) => u.email === normalized))
      throw new Error("Ya existe una cuenta con ese correo. Iniciá sesión.");

    const hashed = await hashPassword(password);
    const newUser = {
      id: uid(),
      name: cleanName,
      email: normalized,
      password: hashed,
      role: "Ciudadano",
      status: employeeData ? "Pendiente" : "Activo",
      dni: employeeData?.dni || "",
      cuil: employeeData?.cuil || "",
      phone: employeeData?.phone || "",
      department: employeeData?.department || "",
      position: employeeData?.position || "",
      provider: "email",
      createdAt: new Date().toISOString(),
      lastAccessAt: new Date().toISOString(),
    };

    saveUsers([...users, newUser]);

    // Si pidió alta como empleado, se crea su solicitud pendiente para el Superadmin.
    let requestId = null;
    if (employeeData) {
      const list = loadEmployeeRequests();
      const request = buildRequestFromUser(newUser, employeeData, list);
      saveEmployeeRequests([request, ...list]);
      requestId = request.id;
      pushNotification(newUser.id, {
        title: "Solicitud de acceso registrada",
        body: `Tu solicitud ${request.id} quedó pendiente de revisión. Te avisaremos cuando haya novedades.`,
        type: "solicitud",
      });
    }

    pushActivity({
      userId: newUser.id,
      actor: cleanName,
      action: "creó su cuenta",
      target: requestId ? `con solicitud ${requestId}` : "",
      type: "user",
    });

    const session = makeSession(newUser);
    recordSession(newUser.id, session.token, buildDeviceLabel());
    setUser(newUser);
    return newUser;
  }, []);

  const loginWithGoogle = useCallback(async (googleData = {}) => {
    const cleanName = (googleData?.name || "Usuario de Google").trim();
    const normalized = (googleData?.email || "usuario.google@gmail.com").trim().toLowerCase();

    if (!emailRegex.test(normalized)) {
      throw new Error("El correo de Google no es válido.");
    }

    const users = loadUsers();
    const found = users.find((u) => u.email === normalized);

    if (found) {
      if (found.status === "Suspendido") {
        throw new Error("Tu cuenta está suspendida. Contactá a un Administrador.");
      }
      const withRole = {
        ...found,
        role: roleForEmail(found.email, found.role),
        avatar: googleData?.avatar || found.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(found.name)}`,
        lastAccessAt: new Date().toISOString(),
      };
      saveUsers(users.map((u) => (u.id === found.id ? withRole : u)));
      const session = makeSession(withRole);
      recordSession(withRole.id, session.token, buildDeviceLabel());
      setUser(withRole);
      pushActivity({
        userId: withRole.id,
        actor: withRole.name,
        action: "inició sesión con Google",
        target: "",
        type: "seguridad",
      });
      return withRole;
    } else {
      const newUser = {
        id: uid(),
        name: cleanName,
        email: normalized,
        password: "",
        role: roleForEmail(normalized, "Ciudadano"),
        status: "Activo",
        provider: "google",
        avatar: googleData?.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(cleanName)}`,
        createdAt: new Date().toISOString(),
        lastAccessAt: new Date().toISOString(),
      };
      saveUsers([...users, newUser]);
      const session = makeSession(newUser);
      recordSession(newUser.id, session.token, buildDeviceLabel());
      setUser(newUser);
      pushActivity({
        userId: newUser.id,
        actor: cleanName,
        action: "creó su cuenta con Google",
        target: "",
        type: "user",
      });
      return newUser;
    }
  }, []);

  const logout = useCallback(() => {
    writeJSON(SESSION_KEY, null);
    setUser(null);
  }, []);

  const requestPasswordReset = useCallback(async (email) => {
    const normalized = (email || "").trim().toLowerCase();
    if (!emailRegex.test(normalized)) throw new Error("Ingresá un correo electrónico válido.");

    const users = loadUsers();
    let found = users.find((u) => u.email === normalized);
    // Si la cuenta no existe en el almacenamiento local de este navegador,
    // creamos un usuario provisional para que EmailJS envíe el correo de recuperación
    // y el usuario pueda definir su contraseña y acceder inmediatamente.
    if (!found) {
      const derivedName = normalized.split("@")[0].replace(/[._-]/g, " ");
      const prettyName =
        derivedName.charAt(0).toUpperCase() + derivedName.slice(1);
      const newUser = {
        id: uid(),
        name: prettyName || "Ciudadano",
        email: normalized,
        password: await hashPassword(uid()),
        role: "Ciudadano",
        type: "user",
        createdAt: new Date().toISOString(),
        lastAccessAt: new Date().toISOString(),
      };
      users.push(newUser);
      saveUsers(users);
      found = newUser;
    }

    const token = uid().replace(/-/g, "") + Date.now().toString(36);
    const now = Date.now();
    const stored = readJSON(RESET_KEY, []);
    const list = Array.isArray(stored) ? stored.filter((r) => r.expiresAt > now && !r.used) : [];
    list.push({
      token,
      userId: found.id,
      email: normalized,
      createdAt: new Date().toISOString(),
      expiresAt: now + RESET_TTL_MS,
      used: false,
    });
    writeJSON(RESET_KEY, list);

    const base = typeof window !== "undefined" ? window.location.origin : "";
    const link = `${base}/restablecer?token=${token}`;

    let emailed;
    let emailError = "";
    try {
      const result = await sendResetEmail({
        to: normalized,
        name: found.name,
        link,
        token,
      });
      emailed = Boolean(result?.sent);
      if (!emailed && result?.reason && result?.reason !== "not-configured") {
        emailError = result.detail || result.reason;
      }
    } catch (err) {
      emailed = false;
      emailError = (err && (err.text || err.message)) || String(err);
    }
    return { link, token, emailed, emailError, email: normalized };
  }, []);

  const validateResetToken = useCallback((token) => {
    if (!token) return { ok: false };
    const stored = readJSON(RESET_KEY, []);
    const list = Array.isArray(stored) ? stored : [];
    const req = list.find((r) => r.token === token);
    if (!req || req.used || req.expiresAt < Date.now()) return { ok: false };
    return { ok: true, email: req.email, userId: req.userId };
  }, []);

  const resetPassword = useCallback(async (token, newPassword) => {
    if (!newPassword || newPassword.length < 6)
      throw new Error("La contraseña debe tener al menos 6 caracteres.");
    const stored = readJSON(RESET_KEY, []);
    const list = Array.isArray(stored) ? stored : [];
    const req = list.find((r) => r.token === token);
    if (!req || req.used || req.expiresAt < Date.now())
      throw new Error("El enlace es inválido o venció. Pedí uno nuevo.");

    const users = loadUsers();
    let target = users.find(
      (u) => u.id === req.userId || (req.email && u.email === req.email)
    );
    const hashed = await hashPassword(newPassword);

    if (!target) {
      if (!req.email) throw new Error("La cuenta ya no existe.");
      target = {
        id: req.userId || uid(),
        name: req.email.split("@")[0],
        email: req.email,
        password: hashed,
        role: "Ciudadano",
        type: "user",
        createdAt: new Date().toISOString(),
      };
      users.push(target);
    }

    saveUsers(
      users.map((u) =>
        u.id === target.id || (target.email && u.email === target.email)
          ? { ...u, password: hashed }
          : u
      )
    );
    writeJSON(
      RESET_KEY,
      list.map((r) => (r.token === token ? { ...r, used: true } : r))
    );
    return true;
  }, []);

  const updateProfile = useCallback(async ({ name, phone, department, position }) => {
    if (!user) throw new Error("Sesión requerida.");

    const cleanName = (name ?? user.name).trim();
    if (!cleanName) throw new Error("El nombre no puede estar vacío.");
    if (phone && phone.trim().length < 6)
      throw new Error("Ingresá un teléfono válido.");

    const updatable = {
      name: cleanName,
      phone: phone?.trim() || "",
      department: department || "",
      position: position?.trim() || "",
    };
    const nextUser = { ...user, ...updatable };
    const users = loadUsers();
    saveUsers(users.map((u) => (u.id === user.id ? nextUser : u)));

    // Mantiene sincronizada la solicitud de empleado asociada (si existe).
    const requests = loadEmployeeRequests();
    if (requests.some((r) => r.userId === user.id)) {
      saveEmployeeRequests(
        requests.map((r) => (r.userId === user.id ? { ...r, ...updatable } : r))
      );
    }

    pushActivity({
      userId: user.id,
      actor: cleanName,
      action: "actualizó su perfil",
      target: ["nombre", "teléfono", "dependencia", "puesto"]
        .filter((k, i) => [cleanName !== user.name, updatable.phone !== user.phone, updatable.department !== user.department, updatable.position !== user.position][i])
        .join(", "),
      type: "user",
    });

    setUser(nextUser);
    return nextUser;
  }, [user]);

  const changePassword = useCallback(async (currentPassword, newPassword) => {
    if (!user) throw new Error("Sesión requerida.");
    if (!newPassword || newPassword.length < 6)
      throw new Error("La contraseña nueva debe tener al menos 6 caracteres.");

    const hashedCurrent = await hashPassword(currentPassword || "");
    if (hashedCurrent !== user.password)
      throw new Error("La contraseña actual es incorrecta.");

    const hashed = await hashPassword(newPassword);
    const users = loadUsers();
    if (!users.some((u) => u.id === user.id))
      throw new Error("La cuenta ya no existe.");

    saveUsers(users.map((u) => (u.id === user.id ? { ...u, password: hashed } : u)));
    pushActivity({
      userId: user.id,
      actor: user.name,
      action: "cambió su contraseña",
      target: "",
      type: "seguridad",
    });
    return true;
  }, [user]);

  const deleteAccount = useCallback(async () => {
    if (!user) return false;

    const users = loadUsers();
    saveUsers(users.filter((u) => u.id !== user.id));

    // Quita la solicitud de empleado asociada (si existe).
    const requests = loadEmployeeRequests();
    const filtered = requests.filter((r) => r.userId !== user.id);
    if (filtered.length !== requests.length) saveEmployeeRequests(filtered);

    // Invalida enlaces de recuperación pendientes del usuario.
    const stored = readJSON(RESET_KEY, []);
    const resets = Array.isArray(stored) ? stored.filter((r) => r.userId !== user.id) : [];
    writeJSON(RESET_KEY, resets);

    pushActivity({
      userId: user.id,
      actor: user.name,
      action: "eliminó su cuenta",
      target: "",
      type: "seguridad",
    });

    // Limpieza de datos personales asociados a la cuenta.
    deleteUserSessions(user.id);
    deleteNotifications(user.id);
    deletePreferences(user.id);
    removeUserActivity(user.id);
    try {
      window.localStorage.removeItem(`chatap.history.${user.id}`);
    } catch {
      /* noop */
    }

    writeJSON(SESSION_KEY, null);
    setUser(null);
    return true;
  }, [user]);

  return (
    <AuthContext.Provider
      value={{
        user,
        userRole: user ? roleForEmail(user.email, user.role) : null,
        loading: false,
        isAuthenticated: !!user,
        isStaff: !!user && isInternalRole(user.email, user.role),
        isSuperadmin: !!user && roleForEmail(user.email, user.role) === "Superadmin",
        login,
        loginWithGoogle,
        register,
        logout,
        requestPasswordReset,
        validateResetToken,
        resetPassword,
        updateProfile,
        changePassword,
        deleteAccount,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
