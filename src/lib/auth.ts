import type { EstadoApi, UsuarioApi } from "@/lib/backend";

export type AuthRole = "Administración" | "Empleado" | "Ciudadano";

export const authRoles: AuthRole[] = ["Administración", "Empleado", "Ciudadano"];

export const rolesDePersonal: AuthRole[] = ["Administración", "Empleado"];

export type AuthStatus = "Activo" | "Pendiente" | "Rechazado" | "Suspendido";

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

export function usuarioDesdeApi(u: UsuarioApi): AuthUser {
  return {
    id: String(u.id),
    name: u.nombre,
    email: u.email,
    role: ROL_DESDE_API[u.rol],
    status: u.estado ? ESTADO_DESDE_API[u.estado] : "Activo",
    createdAt: u.createdAt ?? "",
    debeCambiarPassword: u.debeCambiarPassword ?? false,
  };
}

export function normalizeEmail(email: string): string {
  return (email || "").trim().toLowerCase();
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((email || "").trim());
}

export function assertValidPassword(password: string): void {
  if (!password || password.length < 8)
    throw new Error("La contraseña debe tener al menos 8 caracteres.");
}
