import { useCallback, useEffect, useRef, useState } from "react";
import type { ChatMessage } from "@/data/mockMessages";
import { consultarChat } from "@/lib/backend";

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
  const ultimaConsulta = useRef("");
  const pedidoActual = useRef<AbortController | null>(null);

  useEffect(() => {
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
        const { respuesta } = await consultarChat(text, pedido.signal);
        if (!pedido.signal.aborted) agregar("bot", respuesta);
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
