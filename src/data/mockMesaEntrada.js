// Datos de ejemplo para el módulo "Mesa de Entradas".
// Un ingreso representa un trámite/expediente registrado en la mesa de entrada.

export const mesaStatuses = ["Ingresado", "En proceso", "Observado", "Finalizado"];

export const mesaPriorities = ["Alta", "Normal", "Baja"];

export const mesaTipoDocumento = [
  "Nota",
  "Solicitud",
  "Expediente",
  "Escrito",
  "Declaración jurada",
  "Formulario",
];

export const mesaDependencias = [
  "Mesa de Entradas",
  "Recursos Humanos",
  "Legajos",
  "Liquidaciones",
  "Sistemas",
];

let seq = 14;
const nextId = () => `EXP-2026-${String((seq += 1)).padStart(3, "0")}`;

export const peekNextMesaId = () =>
  `EXP-2026-${String(seq + 1).padStart(3, "0")}`;

export const initialMesaEntradas = [
  {
    id: "EXP-2026-001",
    solicitante: "María González",
    tipo: "Solicitud",
    dependencia: "Recursos Humanos",
    prioridad: "Normal",
    asunto: "Solicitud de licencia anual",
    estado: "Ingresado",
    fecha: "2026-08-24",
    observaciones: "Presenta certificado médico adjunto.",
  },
  {
    id: "EXP-2026-007",
    solicitante: "Carlos Pérez",
    tipo: "Expediente",
    dependencia: "Legajos",
    prioridad: "Alta",
    asunto: "Actualización de datos personales",
    estado: "En proceso",
    fecha: "2026-08-22",
    observaciones: "",
  },
  {
    id: "EXP-2026-011",
    solicitante: "Laura Ramírez",
    tipo: "Nota",
    dependencia: "Liquidaciones",
    prioridad: "Baja",
    asunto: "Consulta sobre recibo de sueldo",
    estado: "Finalizado",
    fecha: "2026-08-19",
    observaciones: "Derivado a liquidaciones.",
  },
];

export function createMesaEntrada(data) {
  return {
    id: nextId(),
    estado: "Ingresado",
    fecha: new Date().toISOString().slice(0, 10),
    solicitante: data.solicitante?.trim() || "Sin especificar",
    tipo: data.tipo || "Solicitud",
    dependencia: data.dependencia || "Mesa de Entradas",
    prioridad: data.prioridad || "Normal",
    asunto: data.asunto?.trim() || "Sin asunto",
    observaciones: data.observaciones?.trim() || "",
    adjuntos: data.adjuntos || [],
  };
}
