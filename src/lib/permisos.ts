import type { AuthRole } from "@/lib/auth";

export type Permission =
  | "dashboard"
  | "mesa_entrada"
  | "tramites"
  | "solicitudes"
  | "usuarios"
  | "documentos"
  | "configuracion"
  | "reportes";

export const PERMISSIONS: Record<AuthRole, Permission[]> = {
  "Administración": [
    "dashboard",
    "solicitudes",
    "mesa_entrada",
    "usuarios",
    "documentos",
    "configuracion",
    "reportes",
  ],
  // Sin "usuarios": el backend lo reserva al superusuario.
  Empleado: [
    "dashboard",
    "tramites",
    "documentos",
    "configuracion",
    "reportes",
  ],
  Ciudadano: [],
};
