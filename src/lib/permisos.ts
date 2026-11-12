import type { AuthRole } from "@/lib/auth";

export type Permission =
  | "dashboard"
  | "mesa_entrada"
  | "tramites"
  | "solicitudes"
  | "usuarios"
  | "documentos"
  | "calificaciones"
  | "reportes";

export const PERMISSIONS: Record<AuthRole, Permission[]> = {
  "Administración": [
    "dashboard",
    "solicitudes",
    "mesa_entrada",
    "usuarios",
    "documentos",
    "calificaciones",
    "reportes",
  ],
  // Sin "usuarios": el backend lo reserva al superusuario.
  Empleado: [
    "dashboard",
    "tramites",
    "documentos",
    "calificaciones",
    "reportes",
  ],
  Ciudadano: [],
};
