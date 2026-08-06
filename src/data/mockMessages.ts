export type MessageType = "bot" | "user";

export interface ChatMessage {
  id: number;
  type: MessageType;
  text: string;
  timestamp: string;
}

export interface BotResponse {
  keywords: string[];
  response: string;
}

export const initialMessages: ChatMessage[] = [
  {
    id: 1,
    type: "bot",
    text: "¡Hola! Soy ChatAP, el asistente virtual de la Subsecretaría de Recursos Humanos de la Provincia de Formosa. ¿En qué puedo ayudarte?",
    timestamp: "2026-06-04T09:00:00",
  },
  {
    id: 2,
    type: "bot",
    text: "Podés consultarme sobre trámites, documentación requerida, guías de procedimientos o acceder a descargas de formularios.",
    timestamp: "2026-06-04T09:00:01",
  },
];

export const botResponses: BotResponse[] = [
  {
    keywords: ["licencia", "vacaciones", "permiso"],
    response:
      "Las licencias anuales reglamentarias se gestionan a través del sistema SIGED. Debés presentar la solicitud con 15 días hábiles de anticipación. El formulario correspondiente está disponible en la sección de Descargas.",
  },
  {
    keywords: ["recibo", "sueldo", "haberes"],
    response:
      "Podés consultar tus recibos de haberes a través de MiPortal (https://miportal.formosa.gob.ar). Si tenés problemas con el acceso, comunicate con la mesa de ayuda al 0800-555-1234.",
  },
  {
    keywords: ["trámite", "documentación", "requisito"],
    response:
      "Los requisitos varían según el trámite. Te recomiendo consultar la 'Guía de Trámites' disponible en la sección de Descargas. También podés contactarnos por WhatsApp para asistencia personalizada.",
  },
  {
    keywords: ["expediente", "siged", "mesa entrada"],
    response:
      "El Sistema de Gestión Documental (SIGED) permite realizar el seguimiento de expedientes electrónicos. Ingresá a la sección 'MiPortal' con tu usuario y clave para consultar el estado de tus expedientes.",
  },
  {
    keywords: ["formulario", "descarga", "plantilla"],
    response:
      "En la sección 'Descargas' de esta página encontrás formularios, modelos y plantillas administrativas disponibles para su descarga directa.",
  },
  {
    keywords: ["default"],
    response:
      "Para brindarte información precisa, necesito más detalles. ¿Podrías especificar tu consulta? También podés consultar nuestras Preguntas Frecuentes o contactarnos por WhatsApp.",
  },
];

export function findResponse(input: string): string {
  const text = input.toLowerCase();
  for (const entry of botResponses) {
    for (const kw of entry.keywords) {
      if (text.includes(kw)) {
        return entry.response;
      }
    }
  }
  return botResponses.find((e) => e.keywords.includes("default"))!.response;
}