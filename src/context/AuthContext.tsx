import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";

import {
  assertValidPassword,
  isValidEmail,
  normalizeEmail,
  usuarioDesdeApi,
  type AuthRole,
  type AuthUser,
} from "@/lib/auth";
import {
  alVencerSesion,
  cambiarPassword as cambiarPasswordApi,
  enviarSolicitudDeAcceso,
  fijarToken,
  iniciarSesion,
  restablecerPassword,
  solicitarRecuperacion,
  type UsuarioApi,
} from "@/lib/backend";
import { readJSON, writeJSON } from "@/lib/storage";

const CLAVE_SESION = "chatap.sesion";

interface SesionGuardada {
  token: string;
  usuario: UsuarioApi;
}

interface RegisterInput {
  name: string;
  email: string;
  password: string;
}

interface AuthValue {
  user: AuthUser | null;
  userRole: AuthRole | null;
  loading: boolean;
  isStaff: boolean;
  login: (email: string, password: string) => Promise<AuthUser>;
  register: (input: RegisterInput) => Promise<string>;
  logout: () => Promise<void>;
  requestPasswordReset: (email: string) => Promise<void>;
  validateResetToken: (token: string) => Promise<{ ok: boolean }>;
  resetPassword: (token: string, newPassword: string) => Promise<boolean>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<AuthUser>;
}

const AuthContext = createContext<AuthValue | null>(null);

export function useAuth(): AuthValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de AuthProvider");
  return ctx;
}

async function register(input: RegisterInput): Promise<string> {
  const name = (input.name || "").trim();
  const email = normalizeEmail(input.email);
  if (!name) throw new Error("Ingresá tu nombre.");
  if (!isValidEmail(email)) throw new Error("Ingresá un correo electrónico válido.");
  assertValidPassword(input.password);
  const { mensaje } = await enviarSolicitudDeAcceso(name, email, input.password);
  return mensaje;
}

async function requestPasswordReset(email: string): Promise<void> {
  if (!isValidEmail(normalizeEmail(email)))
    throw new Error("Ingresá un correo electrónico válido.");
  await solicitarRecuperacion(normalizeEmail(email));
}

async function validateResetToken(token: string): Promise<{ ok: boolean }> {
  return { ok: token.trim().length > 0 };
}

async function resetPassword(token: string, newPassword: string): Promise<boolean> {
  assertValidPassword(newPassword);
  await restablecerPassword(token.trim(), newPassword);
  return true;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const logout = useCallback(async () => {
    fijarToken(null);
    setUser(null);
    await writeJSON(CLAVE_SESION, null);
  }, []);

  useEffect(() => {
    alVencerSesion(logout);
    return () => alVencerSesion(null);
  }, [logout]);

  useEffect(() => {
    let activo = true;
    readJSON<SesionGuardada | null>(CLAVE_SESION, null).then((sesion) => {
      if (!activo) return;
      if (sesion?.token && sesion.usuario) {
        fijarToken(sesion.token);
        setUser(usuarioDesdeApi(sesion.usuario));
      }
      setLoading(false);
    });
    return () => {
      activo = false;
    };
  }, []);

  async function login(email: string, password: string): Promise<AuthUser> {
    const correo = normalizeEmail(email);
    if (!isValidEmail(correo)) throw new Error("Ingresá un correo electrónico válido.");
    if (!password) throw new Error("Ingresá tu contraseña.");
    const { token, usuario } = await iniciarSesion(correo, password);
    const autenticado = usuarioDesdeApi(usuario);
    fijarToken(token);
    setUser(autenticado);
    await writeJSON(CLAVE_SESION, { token, usuario } satisfies SesionGuardada);
    return autenticado;
  }

  async function changePassword(currentPassword: string, newPassword: string): Promise<AuthUser> {
    if (!currentPassword) throw new Error("Ingresá tu contraseña actual.");
    assertValidPassword(newPassword);
    const { token, usuario } = await cambiarPasswordApi(currentPassword, newPassword);
    const autenticado = usuarioDesdeApi(usuario);
    fijarToken(token);
    setUser(autenticado);
    await writeJSON(CLAVE_SESION, { token, usuario } satisfies SesionGuardada);
    return autenticado;
  }

  const userRole = user?.role ?? null;

  return (
    <AuthContext.Provider
      value={{
        user,
        userRole,
        loading,
        isStaff: userRole === "Administración" || userRole === "Empleado",
        login,
        register,
        logout,
        requestPasswordReset,
        validateResetToken,
        resetPassword,
        changePassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
