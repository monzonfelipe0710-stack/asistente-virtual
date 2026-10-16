import type { AuthRole } from "@/lib/auth";

export type Permission =
  | "dashboard"
  | "mesa_entrada"
  | "usuarios"
  | "solicitudes"
  | "conocimiento"
  | "siged"
  | "documentos"
  | "configuracion"
  | "reportes";

export const PERMISSIONS: Record<AuthRole, Permission[]> = {
  "Administración": [
    "dashboard",
    "mesa_entrada",
    "usuarios",
    "solicitudes",
    "conocimiento",
    "siged",
    "documentos",
    "configuracion",
    "reportes",
  ],
  // Sin "usuarios" ni "solicitudes": el backend los reserva al superusuario.
  Empleado: [
    "dashboard",
    "mesa_entrada",
    "conocimiento",
    "siged",
    "documentos",
    "configuracion",
    "reportes",
  ],
  Ciudadano: [],
};
