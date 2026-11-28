type MessageType = "bot" | "user";

export interface ChatMessage {
  id: number;
  type: MessageType;
  text: string;
  timestamp: string;
  tipo?: "respuesta" | "aclaracion";
  // Solo en las respuestas del asistente que el server registró y se pueden calificar.
  consultaId?: number | null;
  calificarToken?: string | null;
  calificacion?: 0 | 1 | null;
}
