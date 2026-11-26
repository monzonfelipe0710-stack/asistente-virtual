import type { AuthRole } from "./auth";

export type Permission =
  | "dashboard"
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
    "usuarios",
    "calificaciones",
    "reportes",
  ],
  Empleado: [
    "dashboard",
    "tramites",
    "documentos",
    "calificaciones",
    "reportes",
  ],
  Ciudadano: [],
};
