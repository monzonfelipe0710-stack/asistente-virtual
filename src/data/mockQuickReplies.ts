/** Tarjetas de sugerencia del estado de bienvenida del chat. */
export interface QuickReply {
  label: string;
  description: string;
  query: string;
}

export const quickReplies: QuickReply[] = [
  {
    label: "Recibo de haberes",
    description: "Descargar el último mes",
    query: "Recibo de haberes",
  },
  {
    label: "Licencia médica",
    description: "Qué necesito para pedirla",
    query: "Licencia médica",
  },
  {
    label: "Expediente SIGED",
    description: "Consultar en qué estado está",
    query: "Expediente SIGED",
  },
  {
    label: "Mesa de Entradas",
    description: "Horarios y qué llevar",
    query: "Mesa de Entradas",
  },
];
