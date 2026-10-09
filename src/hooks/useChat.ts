import { useCallback, useEffect, useRef, useState } from "react";
import type { FlatList } from "react-native";

import { findResponse, type ChatMessage } from "@/data/mockMessages";

/** Mensajes de la conversación y cómo enviar uno. El asistente responde tras una pausa. */
export function useChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const listRef = useRef<FlatList>(null);
  const siguienteId = useRef(1);
  const respuestaPendiente = useRef<ReturnType<typeof setTimeout> | null>(null);

  // "Nuevo chat" vuelve a montar el chat: sin esto queda una respuesta huérfana en camino.
  useEffect(() => {
    return () => {
      if (respuestaPendiente.current) clearTimeout(respuestaPendiente.current);
    };
  }, []);

  const agregar = useCallback((type: ChatMessage["type"], text: string) => {
    const mensaje: ChatMessage = {
      id: siguienteId.current++,
      type,
      text,
      timestamp: new Date().toISOString(),
    };
    setMessages((anteriores) => [...anteriores, mensaje]);
  }, []);

  // No depende del texto: la referencia nunca cambia y los hijos con memo la aguantan.
  const send = useCallback(
    (text: string) => {
      agregar("user", text);
      setIsTyping(true);

      respuestaPendiente.current = setTimeout(() => {
        agregar("bot", findResponse(text));
        setIsTyping(false);
      }, 800 + Math.random() * 1200);
    },
    [agregar]
  );

  return { messages, isTyping, listRef, send };
}
