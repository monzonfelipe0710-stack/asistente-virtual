import { createContext, useContext, useState } from "react";

const AdminContext = createContext(null);

export const ROLES = ["Administrador", "Supervisor", "Agente"];

const PERMISSIONS = {
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
  Supervisor: ["dashboard", "usuarios", "conocimiento", "siged", "documentos", "reportes"],
  Agente: ["dashboard", "siged", "conocimiento"],
};

export function AdminProvider({ children }) {
  const [role, setRole] = useState("Administrador");
  const can = (perm) => (PERMISSIONS[role] || []).includes(perm);
  return (
    <AdminContext.Provider value={{ role, setRole, can }}>
      {children}
    </AdminContext.Provider>
  );
}

export function useAdmin() {
  const ctx = useContext(AdminContext);
  if (!ctx) throw new Error("useAdmin debe usarse dentro de AdminProvider");
  return ctx;
}
