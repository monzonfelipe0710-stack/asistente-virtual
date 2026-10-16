import { sigedStatuses, type SigedPriority, type SigedStatus } from "@/data/mockSiged";

export type MesaStatus = SigedStatus;
export type MesaPriority = SigedPriority;

/** Archivo adjunto elegido con el selector del sistema. */
export interface MesaAdjunto {
  name: string;
  uri: string;
  size?: number;
  mimeType?: string;
}

export interface MesaEntrada {
  id: string;
  solicitante: string;
  tipo: string;
  dependencia: string;
  prioridad: MesaPriority;
  asunto: string;
  estado: MesaStatus;
  fecha: string;
  observaciones: string;
  adjuntos?: MesaAdjunto[];
}

/** Lo que llega del formulario de alta: todo opcional, se completa con defaults. */
export type MesaEntradaDraft = Partial<Omit<MesaEntrada, "id" | "estado" | "fecha">>;

export const mesaStatuses: MesaStatus[] = sigedStatuses;

export const mesaPriorities: MesaPriority[] = ["Alta", "Normal", "Baja"];

export const mesaTipoDocumento: string[] = [
  "Nota",
  "Solicitud",
  "Expediente",
  "Escrito",
  "Declaración jurada",
  "Formulario",
];
