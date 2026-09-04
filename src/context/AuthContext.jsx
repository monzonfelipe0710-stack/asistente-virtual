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

const AuthContext = createContext(null);

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

// Emails autorizados a acceder al panel interno (Acceso Interno).
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
    if (found) return { ...found, role: roleForEmail(found.email, found.role) };
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

    const hashed = await hashPassword(password);
    if (hashed !== found.password) throw new Error("Correo o contraseña incorrectos.");

    const withRole = { ...found, role: roleForEmail(found.email, found.role), lastAccessAt: new Date().toISOString() };
    saveUsers(users.map((u) => (u.id === found.id ? withRole : u)));
    makeSession(withRole);
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
    if (employeeData) {
      const list = loadEmployeeRequests();
      saveEmployeeRequests([buildRequestFromUser(newUser, employeeData, list), ...list]);
    }

    makeSession(newUser);
    setUser(newUser);
    return newUser;
  }, []);

  const logout = useCallback(() => {
    writeJSON(SESSION_KEY, null);
    setUser(null);
  }, []);

  const requestPasswordReset = useCallback(async (email) => {
    const normalized = (email || "").trim().toLowerCase();
    if (!emailRegex.test(normalized)) throw new Error("Ingresá un correo electrónico válido.");

    const users = loadUsers();
    const found = users.find((u) => u.email === normalized);
    // Respuesta genérica para no revelar si la cuenta existe.
    if (!found) return null;

    const token = uid().replace(/-/g, "") + Date.now().toString(36);
    const now = Date.now();
    const stored = readJSON(RESET_KEY, []);
    const list = Array.isArray(stored) ? stored.filter((r) => r.expiresAt > now && !r.used) : [];
    list.push({
      token,
      userId: found.id,
      createdAt: new Date().toISOString(),
      expiresAt: now + RESET_TTL_MS,
      used: false,
    });
    writeJSON(RESET_KEY, list);

    const base = typeof window !== "undefined" ? window.location.origin : "";
    const link = `${base}/restablecer?token=${token}`;

    // Intenta mandarlo por mail; si no está configurado, se muestra en pantalla.
    let emailed = false;
    let emailError = "";
    try {
      const result = await sendResetEmail({ to: normalized, name: found.name, link });
      emailed = result.sent;
      if (!emailed && result.reason && result.reason !== "not-configured") {
        emailError = result.detail || result.reason;
      }
    } catch {
      emailed = false;
    }
    return { link, token, emailed, emailError };
  }, []);

  const validateResetToken = useCallback((token) => {
    if (!token) return { ok: false };
    const stored = readJSON(RESET_KEY, []);
    const list = Array.isArray(stored) ? stored : [];
    const req = list.find((r) => r.token === token);
    if (!req || req.used || req.expiresAt < Date.now()) return { ok: false };
    return { ok: true };
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
    if (!users.some((u) => u.id === req.userId))
      throw new Error("La cuenta ya no existe.");

    const hashed = await hashPassword(newPassword);
    saveUsers(users.map((u) => (u.id === req.userId ? { ...u, password: hashed } : u)));
    writeJSON(
      RESET_KEY,
      list.map((r) => (r.token === token ? { ...r, used: true } : r))
    );
    return true;
  }, []);

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
        register,
        logout,
        requestPasswordReset,
        validateResetToken,
        resetPassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
