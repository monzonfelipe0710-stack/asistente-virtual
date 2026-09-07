import { formatDate } from "../utils/date";

// Datos de ejemplo para el módulo "Mesa de Entradas".
// Un ingreso representa un trámite/expediente registrado en la mesa de entrada.

export const mesaStatuses = ["Ingresado", "En proceso", "Observado", "Finalizado"];

export const mesaPriorities = ["Alta", "Normal", "Baja"];

export const mesaSectores = [
  "Mesa de Entradas",
  "Recursos Humanos",
  "Legajos",
  "Liquidaciones",
  "Sistemas",
];

export const mesaIdentificadores = [
  "Mesa 1",
  "Mesa 2",
  "Mesa 3",
  "Mesa 4",
  "Mesa 5",
  "Mesa 6",
];

let seq = 14;
const nextId = () => `EXP-2026-${String((seq += 1)).padStart(3, "0")}`;

export const peekNextMesaId = () =>
  `EXP-2026-${String(seq + 1).padStart(3, "0")}`;

export const initialMesaEntradas = [
  {
    id: "EXP-2026-001",
    nombre: "Solicitud de licencia anual",
    descripcion: "La solicitante presenta certificado médico para justificar la licencia.",
    costo: "Gratuito",
    encargado: "María González",
    sector: "Recursos Humanos",
    requisitos: "Certificado médico, formulario de licencia firmado.",
    mesa: "Mesa 1",
    estado: "Ingresado",
    prioridad: "Normal",
    fecha: "2026-08-24",
  },
  {
    id: "EXP-2026-007",
    nombre: "Actualización de datos personales",
    descripcion: "Actualización de datos en el legajo personal del empleado.",
    costo: "Gratuito",
    encargado: "Carlos Pérez",
    sector: "Legajos",
    requisitos: "DNI vigente, partida de nacimiento (si aplica).",
    mesa: "Mesa 3",
    estado: "En proceso",
    prioridad: "Alta",
    fecha: "2026-08-22",
  },
  {
    id: "EXP-2026-011",
    nombre: "Consulta sobre recibo de sueldo",
    descripcion: "Consulta sobre la liquidación y el recibo de sueldo del mes.",
    costo: "Gratuito",
    encargado: "Laura Ramírez",
    sector: "Liquidaciones",
    requisitos: "CUIL y última constancia de recibo.",
    mesa: "Mesa 5",
    estado: "Finalizado",
    prioridad: "Baja",
    fecha: "2026-08-19",
  },
];

export function createMesaEntrada(data) {
  return {
    id: nextId(),
    estado: "Ingresado",
    fecha: formatDate(new Date()),
    nombre: data.nombre?.trim() || "Sin especificar",
    descripcion: data.descripcion?.trim() || "",
    costo: data.costo?.trim() || "Gratuito",
    encargado: data.encargado?.trim() || "Sin asignar",
    sector: data.sector || "Mesa de Entradas",
    requisitos: data.requisitos?.trim() || "",
    mesa: data.mesa || "Mesa 1",
    prioridad: "Normal",
    adjuntos: data.adjuntos || [],
  };
}