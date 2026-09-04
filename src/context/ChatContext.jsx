import { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import { useAuth } from "./AuthContext";
import { readJSON, writeJSON } from "../lib/auth";

const ChatContext = createContext(null);

export function useChat() {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error("useChat debe usarse dentro de ChatProvider");
  return ctx;
}

const HISTORY_PREFIX = "chatap.history.";

function historyKey(userId) {
  return HISTORY_PREFIX + userId;
}

function loadHistory(userId) {
  if (!userId) return [];
  const raw = readJSON(historyKey(userId), []);
  return Array.isArray(raw) ? raw : [];
}

function saveHistory(userId, messages) {
  if (!userId) return;
  writeJSON(historyKey(userId), messages.slice(-400));
}

export function ChatProvider({ children }) {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const ownerRef = useRef(null);

  // Cuando el usuario autenticado cambia, hidratamos su historial desde
  // localStorage. Para invitados la conversación es efímera (sin persistir).
  useEffect(() => {
    const ownerId = user?.id || null;
    ownerRef.current = ownerId;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMessages(ownerId ? loadHistory(ownerId) : []);
  }, [user?.id]);

  const addMessage = useCallback(
    (type, text, action = null) => {
      const msg = {
        id: Date.now() + Math.random().toString(36).slice(2, 8),
        type,
        text,
        action,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => {
        const next = [...prev, msg];
        if (ownerRef.current) saveHistory(ownerRef.current, next);
        return next;
      });
      return msg.id;
    },
    []
  );

  const clearHistory = useCallback(() => {
    setMessages([]);
    if (ownerRef.current) writeJSON(historyKey(ownerRef.current), []);
  }, []);

  return (
    <ChatContext.Provider
      value={{
        messages,
        addMessage,
        clearHistory,
        hasHistory: messages.length > 0,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}
