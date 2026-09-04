import { useState, useRef, useCallback, useEffect } from "react";
import { FlatList } from "react-native";
import { ChatMessage, initialMessages, findResponse } from "../data/mockMessages";

export function useChat() {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [isTyping, setIsTyping] = useState(false);
  const listRef = useRef<FlatList>(null);
  const nextId = useRef(initialMessages.length + 1);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // "Nuevo chat" remonta el componente: sin esto queda un timeout huérfano corriendo
  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  const addMessage = useCallback((type: "user" | "bot", text: string) => {
    const msg: ChatMessage = {
      id: nextId.current++,
      type,
      text,
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, msg]);
  }, []);

  // sin dependencia del texto: la referencia nunca cambia y los hijos memo aguantan
  const send = useCallback(
    (text: string) => {
      addMessage("user", text);
      setIsTyping(true);
      timer.current = setTimeout(() => {
        addMessage("bot", findResponse(text));
        setIsTyping(false);
      }, 800 + Math.random() * 1200);
    },
    [addMessage]
  );

  return { messages, isTyping, listRef, send };
}
