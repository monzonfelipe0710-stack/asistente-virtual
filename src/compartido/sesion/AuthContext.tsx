import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";

import {
  assertValidPassword,
  isValidEmail,
  normalizeEmail,
  usuarioDesdeApi,
  type AuthRole,
  type AuthUser,
} from "./auth";
import {
  alVencerSesion,
  cambiarPassword as cambiarPasswordApi,
  fijarToken,
  iniciarSesion,
  pedirMisConsultas,
  registrarCiudadano,
  restablecerPassword,
  solicitarRecuperacion,
  type GeneroApi,
  type RegistroCiudadanoDatos,
  type UsuarioApi,
} from "@/compartido/lib/backend";
import { readJSON, writeJSON } from "@/compartido/lib/storage";

const CLAVE_SESION = "chatap.sesion";

interface SesionGuardada {
  token: string;
  usuario: UsuarioApi;
}

interface RegisterInput {
  dni: string;
  genero: GeneroApi | "";
  nombre: string;
  apellido: string;
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

const EXPRESION_DNI = /^\d{7,8}$/;

async function register(input: RegisterInput): Promise<string> {
  const dni = (input.dni || "").trim();
  const email = normalizeEmail(input.email);
  if (!EXPRESION_DNI.test(dni)) throw new Error("El DNI debe tener 7 u 8 dígitos.");
  if (!input.genero) throw new Error("Elegí el género que figura en tu DNI.");

  const datos: RegistroCiudadanoDatos = {
    dni,
    genero: input.genero,
    email,
    password: input.password,
  };

  if (input.genero === "X") {
    const nombre = (input.nombre || "").trim();
    const apellido = (input.apellido || "").trim();
    if (!nombre) throw new Error("Ingresá tu nombre.");
    if (!apellido) throw new Error("Ingresá tu apellido.");
    datos.nombre = nombre;
    datos.apellido = apellido;
  }

  if (!isValidEmail(email)) throw new Error("Ingresá un correo electrónico válido.");
  assertValidPassword(input.password);
  const { mensaje } = await registrarCiudadano(datos);
  return mensaje;
}

async function requestPasswordReset(email: string): Promise<void> {
  const correo = normalizeEmail(email);
  if (!isValidEmail(correo)) {
    throw new Error("Ingresá un correo electrónico válido.");
  }
  await solicitarRecuperacion(correo);
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
        pedirMisConsultas().catch(() => {});
      }
      setLoading(false);
    });
    return () => {
      activo = false;
    };
  }, []);

  async function guardarSesion(token: string, usuario: UsuarioApi): Promise<AuthUser> {
    const autenticado = usuarioDesdeApi(usuario);
    fijarToken(token);
    setUser(autenticado);
    await writeJSON(CLAVE_SESION, { token, usuario } satisfies SesionGuardada);
    return autenticado;
  }

  async function login(email: string, password: string): Promise<AuthUser> {
    const correo = normalizeEmail(email);
    if (!isValidEmail(correo)) throw new Error("Ingresá un correo electrónico válido.");
    if (!password) throw new Error("Ingresá tu contraseña.");
    const { token, usuario } = await iniciarSesion(correo, password);
    return guardarSesion(token, usuario);
  }

  async function changePassword(currentPassword: string, newPassword: string): Promise<AuthUser> {
    if (!currentPassword) throw new Error("Ingresá tu contraseña actual.");
    assertValidPassword(newPassword);
    const { token, usuario } = await cambiarPasswordApi(currentPassword, newPassword);
    return guardarSesion(token, usuario);
  }

  const userRole = user?.role ?? null;
  const isStaff = userRole === "Administración" || userRole === "Empleado";

  return (
    <AuthContext.Provider
      value={{
        user,
        userRole,
        loading,
        isStaff,
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
