import { createContext, useContext, useMemo, type ReactNode } from "react";

import { useAuth } from "./AuthContext";
import type { AuthRole } from "../lib/auth";

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

/** Únicos roles del sistema. El Ciudadano no entra al panel interno. */
export const ROLES: AuthRole[] = ["Superadmin", "Administrador", "Ciudadano"];

const PERMISSIONS: Record<AuthRole, Permission[]> = {
  Superadmin: [
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
  // Sin "solicitudes": aprobar altas de empleados es exclusivo del Superadmin.
  Administrador: [
    "dashboard",
    "mesa_entrada",
    "usuarios",
    "conocimiento",
    "siged",
    "documentos",
    "configuracion",
    "reportes",
  ],
  Ciudadano: [],
};

interface AdminValue {
  role: AuthRole;
  can: (perm: Permission) => boolean;
}

const AdminContext = createContext<AdminValue | null>(null);

export function AdminProvider({ children }: { children: ReactNode }) {
  // El rol sale siempre del usuario logueado (sin selector manual).
  const { userRole } = useAuth();
  const role: AuthRole =
    userRole && ROLES.includes(userRole) ? userRole : "Ciudadano";

  const value = useMemo<AdminValue>(
    () => ({
      role,
      can: (perm: Permission) => PERMISSIONS[role].includes(perm),
    }),
    [role]
  );

  return <AdminContext.Provider value={value}>{children}</AdminContext.Provider>;
}

export function useAdmin(): AdminValue {
  const ctx = useContext(AdminContext);
  if (!ctx) throw new Error("useAdmin debe usarse dentro de AdminProvider");
  return ctx;
}
