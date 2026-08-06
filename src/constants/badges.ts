import type { SigedStatus, UserRole } from "../data/mockSiged";

export const statusConfig: Record<SigedStatus, { bg: string; text: string }> = {
  Ingresado: { bg: "#ede9fe", text: "#7c3aed" },
  "En proceso": { bg: "#dbeafe", text: "#2563eb" },
  Observado: { bg: "#fef3c7", text: "#d97706" },
  Finalizado: { bg: "#dcfce7", text: "#16a34a" },
};

export const roleColors: Record<UserRole, { bg: string; text: string }> = {
  Administrador: { bg: "#ede9fe", text: "#7c3aed" },
  Supervisor: { bg: "#fef3c7", text: "#d97706" },
  Agente: { bg: "#dbeafe", text: "#2563eb" },
};
