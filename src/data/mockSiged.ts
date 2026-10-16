export type SigedStatus = "Ingresado" | "En proceso" | "Observado" | "Finalizado";
export type SigedPriority = "Alta" | "Normal" | "Baja";

export interface SigedRecord {
  id: string;
  type: string;
  applicant: string;
  department: string;
  date: string;
  status: SigedStatus;
  lastMovement: string;
  priority: SigedPriority;
}

export const sigedStatuses: SigedStatus[] = ["Ingresado", "En proceso", "Observado", "Finalizado"];
