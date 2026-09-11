import { createContext, useContext } from "react";
import { useAuth } from "./AuthContext";

const AdminContext = createContext(null);

// Únicos roles del sistema. El Ciudadano no tiene acceso al panel interno.
// eslint-disable-next-line react-refresh/only-export-components
export const ROLES = ["Superadmin", "Administrador", "Ciudadano"];

// eslint-disable-next-line react-refresh/only-export-components
export const PERMISSION_LABELS = {
  dashboard: { label: "Ver panel general", desc: "Resumen de la actividad del sistema." },
  mesa_entrada: { label: "Mesa de Entradas", desc: "Ingreso y seguimiento de trámites y expedientes." },
  usuarios: { label: "Gestionar usuarios", desc: "Crear, editar y suspender cuentas." },
  solicitudes: { label: "Gestionar solicitudes", desc: "Aprobar, suspender o rechazar altas de empleados." },
  conocimiento: { label: "Gestionar conocimiento", desc: "Editar la base de respuestas del chatbot." },
  siged: { label: "Integración SIGED", desc: "Consultar y sincronizar expedientes." },
  documentos: { label: "Gestionar documentos", desc: "Cargar y administrar la documentación." },
  configuracion: { label: "Configuración del sistema", desc: "Ajustes del chatbot y del panel." },
  reportes: { label: "Reportes", desc: "Métricas y exportaciones de actividad." },
};

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

// eslint-disable-next-line react-refresh/only-export-components
export function permissionsForRole(role) {
  return (PERMISSIONS[role] || []).map((key) => ({
    key,
    ...(PERMISSION_LABELS[key] || { label: key, desc: "" }),
  }));
}

export function AdminProvider({ children }) {
  // El rol sale siempre del usuario logueado (sin selector manual).
  const { userRole = "Ciudadano" } = useAuth();
  let role = userRole || "Ciudadano";
  if (!ROLES.includes(role)) role = "Ciudadano";

  const can = (perm) => (PERMISSIONS[role] || []).includes(perm);
  return (
    <AdminContext.Provider value={{ role, can }}>
      {children}
    </AdminContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAdmin() {
  const ctx = useContext(AdminContext);
  if (!ctx) throw new Error("useAdmin debe usarse dentro de AdminProvider");
  return ctx;
}
