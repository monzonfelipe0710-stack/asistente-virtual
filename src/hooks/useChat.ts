import { useCallback, useEffect, useRef, useState } from "react";
import type { ChatMessage } from "@/data/mockMessages";
import { consultarChat, type MensajeChat } from "@/lib/backend";

const MAX_MENSAJES = 20;
const MAX_TEXTO = 2000;

function armarHistorial(mensajes: ChatMessage[], pregunta: string): MensajeChat[] {
  const historial: MensajeChat[] = mensajes
    .filter((m) => m.text.trim().length > 0)
    .map((m) => ({
      rol: m.type === "user" ? "usuario" : "asistente",
      texto: m.text.slice(0, MAX_TEXTO),
    }));
  const ultimo = historial[historial.length - 1];
  const texto = pregunta.slice(0, MAX_TEXTO);
  if (ultimo?.rol !== "usuario" || ultimo.texto !== texto) {
    historial.push({ rol: "usuario", texto });
  }
  return historial.slice(-MAX_MENSAJES);
}

/** Mensajes de la conversación, cómo enviar uno, reintentar el que falló y detener la espera. */
export function useChat(
  inicial: ChatMessage[] = [],
  onCambio?: (mensajes: ChatMessage[]) => void
) {
  const [messages, setMessages] = useState<ChatMessage[]>(inicial);
  const [isTyping, setIsTyping] = useState(false);
  const [fallo, setFallo] = useState<string | null>(null);
  const siguienteId = useRef(Math.max(0, ...inicial.map((m) => m.id)) + 1);
  const mensajesIniciales = useRef(messages);
  const mensajesActuales = useRef(messages);
  const ultimaConsulta = useRef("");
  const pedidoActual = useRef<AbortController | null>(null);

  useEffect(() => {
    mensajesActuales.current = messages;
    if (messages !== mensajesIniciales.current) onCambio?.(messages);
  }, [messages, onCambio]);

  useEffect(() => () => pedidoActual.current?.abort(), []);

  const agregar = useCallback((type: ChatMessage["type"], text: string) => {
    const mensaje: ChatMessage = {
      id: siguienteId.current++,
      type,
      text,
      timestamp: new Date().toISOString(),
    };
    setMessages((anteriores) => [...anteriores, mensaje]);
  }, []);

  const preguntar = useCallback(
    async (text: string) => {
      ultimaConsulta.current = text;
      const pedido = new AbortController();
      pedidoActual.current = pedido;
      setFallo(null);
      setIsTyping(true);
      try {
        const { respuesta, opciones } = await consultarChat(
          armarHistorial(mensajesActuales.current, text),
          pedido.signal
        );
        if (!pedido.signal.aborted) {
          const lista = opciones.map((o) => `- ${o.nombre}`).join("\n");
          agregar("bot", lista ? `${respuesta}\n\n${lista}` : respuesta);
        }
      } catch (error) {
        if (!pedido.signal.aborted) {
          setFallo(error instanceof Error ? error.message : "No se pudo obtener la respuesta.");
        }
      } finally {
        if (pedidoActual.current === pedido) {
          pedidoActual.current = null;
          setIsTyping(false);
        }
      }
    },
    [agregar]
  );

  // No depende del texto: la referencia nunca cambia y los hijos con memo la aguantan.
  const send = useCallback(
    (text: string) => {
      agregar("user", text);
      return preguntar(text);
    },
    [agregar, preguntar]
  );

  const reintentar = useCallback(() => preguntar(ultimaConsulta.current), [preguntar]);

  // Corta la espera: la respuesta que llegue después se descarta.
  const detener = useCallback(() => {
    pedidoActual.current?.abort();
    pedidoActual.current = null;
    setIsTyping(false);
  }, []);

  return { messages, isTyping, send, fallo, reintentar, detener };
}
