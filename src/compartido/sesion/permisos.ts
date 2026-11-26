import type { AuthRole } from "./auth";

export type Permission =
  | "dashboard"
  | "mesa_entrada"
  | "tramites"
  | "solicitudes"
  | "usuarios"
  | "documentos"
  | "calificaciones"
  | "reportes"
  | "modelo_chat";

export const PERMISSIONS: Record<AuthRole, Permission[]> = {
  "Administración": [
    "dashboard",
    "solicitudes",
    "mesa_entrada",
    "usuarios",
    "calificaciones",
    "reportes",
    "modelo_chat",
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
