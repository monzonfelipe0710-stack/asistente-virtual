import { createContext, useContext } from "react";
import { useAuth } from "./AuthContext";

const AdminContext = createContext(null);

// Únicos roles del sistema. El Ciudadano no tiene acceso al panel interno.
export const ROLES = ["Superadmin", "Administrador", "Ciudadano"];

const PERMISSIONS = {
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

export function AdminProvider({ children }) {
  // El rol sale siempre del usuario logueado (sin selector manual).
  let role = "Ciudadano";
  try {
    role = useAuth()?.userRole || "Ciudadano";
  } catch {
    role = "Ciudadano";
  }
  if (!ROLES.includes(role)) role = "Ciudadano";

  const can = (perm) => (PERMISSIONS[role] || []).includes(perm);
  return (
    <AdminContext.Provider value={{ role, can }}>
      {children}
    </AdminContext.Provider>
  );
}

export function useAdmin() {
  const ctx = useContext(AdminContext);
  if (!ctx) throw new Error("useAdmin debe usarse dentro de AdminProvider");
  return ctx;
}
