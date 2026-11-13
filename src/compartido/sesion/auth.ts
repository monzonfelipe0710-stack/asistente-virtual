import type { EstadoApi, UsuarioApi } from "@/compartido/lib/backend";

export type AuthRole = "Administración" | "Empleado" | "Ciudadano";

export const rolesDePersonal: AuthRole[] = ["Administración", "Empleado"];

type AuthStatus = "Activo" | "Pendiente" | "Rechazado" | "Suspendido";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: AuthRole;
  status?: AuthStatus;
  createdAt: string;
  debeCambiarPassword: boolean;
}

const ROL_DESDE_API: Record<UsuarioApi["rol"], AuthRole> = {
  SUPERUSUARIO: "Administración",
  ADMINISTRADOR: "Empleado",
  CIUDADANO: "Ciudadano",
};

const ESTADO_DESDE_API: Record<EstadoApi, AuthStatus> = {
  APROBADO: "Activo",
  PENDIENTE: "Pendiente",
  RECHAZADO: "Rechazado",
  SUSPENDIDO: "Suspendido",
};

const EXPRESION_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function estadoDesdeApi(estado: EstadoApi | undefined): AuthStatus {
  if (estado) {
    return ESTADO_DESDE_API[estado];
  }
  return "Activo";
}

export function usuarioDesdeApi(u: UsuarioApi): AuthUser {
  return {
    id: String(u.id),
    name: u.nombre,
    email: u.email,
    role: ROL_DESDE_API[u.rol],
    status: estadoDesdeApi(u.estado),
    createdAt: u.createdAt ?? "",
    debeCambiarPassword: u.debeCambiarPassword ?? false,
  };
}

export function normalizeEmail(email: string): string {
  const texto = email || "";
  return texto.trim().toLowerCase();
}

export function isValidEmail(email: string): boolean {
  const texto = email || "";
  return EXPRESION_EMAIL.test(texto.trim());
}

export function assertValidPassword(password: string): void {
  if (!password || password.length < 8) {
    throw new Error("La contraseña debe tener al menos 8 caracteres.");
  }
}
