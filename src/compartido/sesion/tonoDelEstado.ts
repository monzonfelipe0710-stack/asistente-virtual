import type { Tone } from "@/compartido/ui/Badge";

export const TONO_DEL_ESTADO: Record<string, Tone> = {
  Activo: "ok",
  Pendiente: "warn",
  Rechazado: "bad",
  Suspendido: "bad",
};
