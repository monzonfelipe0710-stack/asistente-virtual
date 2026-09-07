import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import * as Linking from "expo-linking";

import {
  SESSION_KEY,
  hashPassword,
  loadUsers,
  makeSession,
  saveUsers,
  uid,
  type AuthRole,
  type AuthUser,
  type Session,
} from "../lib/auth";
import { sendResetEmail } from "../lib/email";
import {
  buildRequestFromUser,
  loadEmployeeRequests,
  saveEmployeeRequests,
} from "../lib/employeeRequests";
import { readJSON, writeJSON } from "../lib/storage";

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Usuario SuperAdmin inicial (se siembra solo la primera vez).
// Credenciales por defecto:
//   Email: superadmin@formosa.gob.ar
//   Contraseña: Superadmin123*
export const SUPERADMIN_EMAIL = "superadmin@formosa.gob.ar";
export const SUPERADMIN_NAME = "Super Administrador";
const SUPERADMIN_PASSWORD = "Superadmin123*";

// Enlaces de recuperación: token de un solo uso, válido por 1 hora.
const RESET_KEY = "chatap.pwreset";
const RESET_TTL_MS = 60 * 60 * 1000;

// Correos autorizados a entrar al Acceso Interno.
const STAFF_EMAILS = [
  "admin@formosa.gob.ar",
  "moderador@formosa.gob.ar",
  SUPERADMIN_EMAIL,
];

interface ResetRequest {
  token: string;
  userId: string;
  createdAt: string;
  expiresAt: number;
  used: boolean;
}

export interface RegisterInput {
  name: string;
  email: string;
  password: string;
  cuil?: string;
  phone?: string;
  department?: string;
  position?: string;
  reason?: string;
  requestsEmployeeAccess?: boolean;
}

export interface ResetTicket {
  link: string;
  token: string;
  emailed: boolean;
  emailError: string;
}

interface AuthValue {
  user: AuthUser | null;
  userRole: AuthRole | null;
  loading: boolean;
  isAuthenticated: boolean;
  isStaff: boolean;
  isSuperadmin: boolean;
  login: (email: string, password: string) => Promise<AuthUser>;
  register: (input: RegisterInput) => Promise<AuthUser>;
  logout: () => Promise<void>;
  requestPasswordReset: (email: string) => Promise<ResetTicket | null>;
  validateResetToken: (token: string) => Promise<{ ok: boolean }>;
  resetPassword: (token: string, newPassword: string) => Promise<boolean>;
}

const AuthContext = createContext<AuthValue | null>(null);

export function useAuth(): AuthValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de AuthProvider");
  return ctx;
}

function roleForEmail(email: string, storedRole?: string): AuthRole {
  const normalized = (email || "").trim().toLowerCase();
  if (normalized === SUPERADMIN_EMAIL) return "Superadmin";
  // Migración de roles anteriores (ya no existen Supervisor ni Agente).
  if (storedRole === "Supervisor") return "Administrador";
  if (storedRole === "Agente") return "Ciudadano";
  if (
    storedRole === "Superadmin" ||
    storedRole === "Administrador" ||
    storedRole === "Ciudadano"
  ) {
    return storedRole;
  }
  if (STAFF_EMAILS.includes(normalized)) return "Administrador";
  return "Ciudadano";
}

function isInternalRole(email: string, storedRole?: string): boolean {
  const role = roleForEmail(email, storedRole);
  return role === "Superadmin" || role === "Administrador";
}

async function restoreSession(): Promise<AuthUser | null> {
  const session = await readJSON<Session | null>(SESSION_KEY, null);
  if (!session?.userId) return null;
  const users = await loadUsers();
  const found = users.find((u) => u.id === session.userId);
  if (!found) return null;
  return { ...found, role: roleForEmail(found.email, found.role) };
}

async function ensureSuperadminSeeded(): Promise<void> {
  try {
    const users = await loadUsers();
    const normalized = SUPERADMIN_EMAIL.toLowerCase();
    const existing = users.find((u) => u.email === normalized);

    if (!existing) {
      const hashed = await hashPassword(SUPERADMIN_PASSWORD);
      const superUser: AuthUser = {
        id: uid(),
        name: SUPERADMIN_NAME,
        email: normalized,
        password: hashed,
        role: "Superadmin",
        provider: "email",
        createdAt: new Date().toISOString(),
        lastAccessAt: new Date().toISOString(),
      };
      await saveUsers([...users, superUser]);
    } else if (existing.role !== "Superadmin") {
      await saveUsers(
        users.map((u) => (u.email === normalized ? { ...u, role: "Superadmin" } : u))
      );
    }
  } catch {
    /* noop */
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  // En web el estado inicial salía de localStorage de forma síncrona. Acá el
  // almacenamiento es asíncrono, así que hay un momento sin sesión conocida:
  // sin este flag el panel mostraría "acceso restringido" antes de saberlo.
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      await ensureSuperadminSeeded();
      const restored = await restoreSession();
      if (alive) {
        setUser(restored);
        setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const normalized = (email || "").trim().toLowerCase();
    if (!emailRegex.test(normalized))
      throw new Error("Ingresá un correo electrónico válido.");
    if (!password) throw new Error("Ingresá tu contraseña.");

    const users = await loadUsers();
    const found = users.find((u) => u.email === normalized);
    if (!found)
      throw new Error("No existe una cuenta con ese correo. Registrate primero.");

    const hashed = await hashPassword(password);
    if (hashed !== found.password)
      throw new Error("Correo o contraseña incorrectos.");

    const withRole: AuthUser = {
      ...found,
      role: roleForEmail(found.email, found.role),
      lastAccessAt: new Date().toISOString(),
    };
    await saveUsers(users.map((u) => (u.id === found.id ? withRole : u)));
    await makeSession(withRole);
    setUser(withRole);
    return withRole;
  }, []);

  const register = useCallback(async (input: RegisterInput) => {
    const {
      name,
      email,
      password,
      cuil,
      phone,
      department,
      position,
      reason,
      requestsEmployeeAccess,
    } = input;

    const cleanName = (name || "").trim();
    const normalized = (email || "").trim().toLowerCase();

    if (!cleanName) throw new Error("Ingresá tu nombre.");
    if (!emailRegex.test(normalized))
      throw new Error("Ingresá un correo electrónico válido.");
    if (!password || password.length < 6)
      throw new Error("La contraseña debe tener al menos 6 caracteres.");

    let employeeData: {
      dni: string;
      cuil: string;
      phone: string;
      department: string;
      position: string;
      reason: string;
    } | null = null;

    if (requestsEmployeeAccess) {
      const cleanCuil = (cuil || "").trim();
      if (!/^\d{2}-\d{7,8}-\d$/.test(cleanCuil))
        throw new Error("Ingresá un CUIL válido (formato 20-12345678-3).");
      // El DNI va incluido en el CUIL (dígitos del medio): no se pide aparte.
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

    const users = await loadUsers();
    if (users.some((u) => u.email === normalized))
      throw new Error("Ya existe una cuenta con ese correo. Iniciá sesión.");

    const hashed = await hashPassword(password);
    const newUser: AuthUser = {
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

    await saveUsers([...users, newUser]);

    // Si pidió alta como empleado, queda una solicitud pendiente para el Superadmin.
    if (employeeData) {
      const list = await loadEmployeeRequests();
      await saveEmployeeRequests([
        buildRequestFromUser(newUser, employeeData, list),
        ...list,
      ]);
    }

    await makeSession(newUser);
    setUser(newUser);
    return newUser;
  }, []);

  const logout = useCallback(async () => {
    await writeJSON(SESSION_KEY, null);
    setUser(null);
  }, []);

  const requestPasswordReset = useCallback(async (email: string) => {
    const normalized = (email || "").trim().toLowerCase();
    if (!emailRegex.test(normalized))
      throw new Error("Ingresá un correo electrónico válido.");

    const users = await loadUsers();
    const found = users.find((u) => u.email === normalized);
    // Respuesta genérica: no se revela si la cuenta existe.
    if (!found) return null;

    const token = uid().replace(/-/g, "") + Date.now().toString(36);
    const now = Date.now();
    const stored = await readJSON<ResetRequest[]>(RESET_KEY, []);
    const list = Array.isArray(stored)
      ? stored.filter((r) => r.expiresAt > now && !r.used)
      : [];
    list.push({
      token,
      userId: found.id,
      createdAt: new Date().toISOString(),
      expiresAt: now + RESET_TTL_MS,
      used: false,
    });
    await writeJSON(RESET_KEY, list);

    const link = Linking.createURL("/restablecer", { queryParams: { token } });

    let emailed = false;
    let emailError = "";
    try {
      const result = await sendResetEmail({
        to: normalized,
        name: found.name,
        link,
      });
      emailed = result.sent;
      if (!emailed && result.reason && result.reason !== "not-configured") {
        emailError = result.detail || result.reason;
      }
    } catch {
      emailed = false;
    }

    return { link, token, emailed, emailError };
  }, []);

  const validateResetToken = useCallback(async (token: string) => {
    if (!token) return { ok: false };
    const stored = await readJSON<ResetRequest[]>(RESET_KEY, []);
    const list = Array.isArray(stored) ? stored : [];
    const req = list.find((r) => r.token === token);
    if (!req || req.used || req.expiresAt < Date.now()) return { ok: false };
    return { ok: true };
  }, []);

  const resetPassword = useCallback(async (token: string, newPassword: string) => {
    if (!newPassword || newPassword.length < 6)
      throw new Error("La contraseña debe tener al menos 6 caracteres.");

    const stored = await readJSON<ResetRequest[]>(RESET_KEY, []);
    const list = Array.isArray(stored) ? stored : [];
    const req = list.find((r) => r.token === token);
    if (!req || req.used || req.expiresAt < Date.now())
      throw new Error("El enlace es inválido o venció. Pedí uno nuevo.");

    const users = await loadUsers();
    if (!users.some((u) => u.id === req.userId))
      throw new Error("La cuenta ya no existe.");

    const hashed = await hashPassword(newPassword);
    await saveUsers(
      users.map((u) => (u.id === req.userId ? { ...u, password: hashed } : u))
    );
    await writeJSON(
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
        loading,
        isAuthenticated: !!user,
        isStaff: !!user && isInternalRole(user.email, user.role),
        isSuperadmin:
          !!user && roleForEmail(user.email, user.role) === "Superadmin",
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
