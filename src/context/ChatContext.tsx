import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

interface ChatValue {
  conversacion: number;
  nuevoChat: () => void;
}

const ChatContext = createContext<ChatValue | null>(null);

export function useConversacion(): ChatValue {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error("useConversacion debe usarse dentro de ChatProvider");
  return ctx;
}

export function ChatProvider({ children }: { children: ReactNode }) {
  const [conversacion, setConversacion] = useState(0);
  const nuevoChat = useCallback(() => setConversacion((n) => n + 1), []);
  const value = useMemo(() => ({ conversacion, nuevoChat }), [conversacion, nuevoChat]);

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}
