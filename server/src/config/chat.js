import { enteroDeEntorno } from './ia.js';

// Límites del chat público, del lado del servidor (el front puede tener los suyos). Se leen al
// arrancar; una variable vacía o inválida deja el valor por defecto.
export const LIMITES_CHAT = {
  // Largo de la pregunta y de cada mensaje de la persona en el historial.
  pregunta: enteroDeEntorno('CHAT_MAX_PREGUNTA', 500, 1),
  // Largo de cada mensaje del asistente en el historial (respuestas con listas y fuentes).
  textoAsistente: enteroDeEntorno('CHAT_MAX_TEXTO_ASISTENTE', 2000, 1),
  mensajes: enteroDeEntorno('CHAT_MAX_MENSAJES', 20, 1),
  cuerpoKb: enteroDeEntorno('CHAT_MAX_CUERPO_KB', 64, 1),
  // Pedidos por IP, compartidos entre /api/chat y /api/chat/stream.
  porMinuto: enteroDeEntorno('CHAT_LIMITE_POR_MINUTO', 10, 1),
  porHora: enteroDeEntorno('CHAT_LIMITE_POR_HORA', 100, 1),
};
