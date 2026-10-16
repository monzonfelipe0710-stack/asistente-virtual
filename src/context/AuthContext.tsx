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
  enviarSolicitudDeAcceso,
  faltaBackend,
  fijarToken,
  iniciarSesion,
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
  return faltaBackend();
}

async function resetPassword(token: string, newPassword: string): Promise<boolean> {
  assertValidPassword(newPassword);
  return faltaBackend();
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
        validateResetToken: faltaBackend,
        resetPassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
