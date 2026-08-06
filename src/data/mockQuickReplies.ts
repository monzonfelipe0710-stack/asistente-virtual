import type { Ionicons } from "@expo/vector-icons";

export interface QuickReply {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  query: string;
}

export const quickReplies: QuickReply[] = [
  {
    label: "Preguntas Frecuentes",
    icon: "chatbubble-ellipses-outline",
    query: "¿Cuáles son las preguntas frecuentes?",
  },
  {
    label: "Guía de Trámites",
    icon: "document-text-outline",
    query: "¿Cuál es la guía de trámites disponibles?",
  },
  {
    label: "Descargar Formularios",
    icon: "download-outline",
    query: "Necesito descargar formularios",
  },
];
