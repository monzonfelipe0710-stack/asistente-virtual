import { createContext, useContext } from "react";
import { useAuth } from "./AuthContext";

const AdminContext = createContext(null);

// Roles del backend. El CIUDADANO no tiene acceso al panel interno.
// eslint-disable-next-line react-refresh/only-export-components
export const ROLES = ["SUPERUSUARIO", "ADMINISTRADOR", "CIUDADANO"];

// eslint-disable-next-line react-refresh/only-export-components
export const PERMISSION_LABELS = {
  dashboard: { label: "Ver panel general", desc: "Resumen de la actividad del sistema." },
  tramites: { label: "Gestionar trámites", desc: "Crear, editar, publicar y despublicar tus trámites, y cargar sus documentos." },
  solicitudes: { label: "Gestionar solicitudes", desc: "Aprobar, rechazar, suspender y reactivar cuentas." },
  usuarios: { label: "Gestionar usuarios", desc: "Listar, suspender y reactivar administradores." },
  sectores: { label: "Gestionar sectores", desc: "Crear y editar el organigrama (ministerios, subsecretarías, departamentos)." },
  reportes: { label: "Métricas y reportes", desc: "Consultas por trámite y consultas sin respuesta." },
  mesa_entrada: { label: "Mesa de Entradas", desc: "Ingreso y seguimiento de trámites y expedientes." },
  conocimiento: { label: "Gestionar conocimiento", desc: "Editar la base de respuestas del chatbot." },
  siged: { label: "Integración SIGED", desc: "Consultar y sincronizar expedientes." },
  configuracion: { label: "Configuración del sistema", desc: "Ajustes del chatbot y del panel." },
};

// Permisos según el contrato real del backend:
// - SUPERUSUARIO: usuarios, sectores y métricas. NO puede crear/editar trámites (403).
// - ADMINISTRADOR: sus propios trámites (con requisitos, mesas y documentos).
const PERMISSIONS = {
  SUPERUSUARIO: [
    "dashboard",
    "solicitudes",
    "usuarios",
    "sectores",
    "reportes",
    "mesa_entrada",
    "conocimiento",
    "siged",
    "configuracion",
  ],
  ADMINISTRADOR: ["dashboard", "tramites", "mesa_entrada"],
  CIUDADANO: [],
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
  const { userRole } = useAuth();
  const role = ROLES.includes(userRole) ? userRole : "CIUDADANO";

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
