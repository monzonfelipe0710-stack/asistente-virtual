import { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import { useAuth } from "./AuthContext";
import { readJSON, writeJSON } from "../lib/auth";
import { useSessionStore } from "../store/session";
import { misConsultas } from "../services/consultas";
import { apiErrorMessage } from "../lib/api";

const ChatContext = createContext(null);

// eslint-disable-next-line react-refresh/only-export-components
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
  const token = useSessionStore((state) => state.token);
  const ownerId = user?.id || null;
  const [messages, setMessages] = useState([]);
  const [consultas, setConsultas] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState("");
  const ownerRef = useRef(null);
  const localHistoryRef = useRef([]);

  // Las cuentas del backend hidratan el historial desde Consulta. La memoria
  // local queda solo como compatibilidad para las cuentas demo ya existentes.
  useEffect(() => {
    const ownerId = user?.id || null;
    ownerRef.current = ownerId;
    let cancelled = false;
    Promise.resolve().then(() => {
      if (cancelled) return;
      setConsultas([]);
      setHistoryError("");
      setHistoryLoading(Boolean(ownerId && token));
      const localHistory = ownerId && !token ? loadHistory(ownerId) : [];
      localHistoryRef.current = localHistory;
      setMessages([]);
    });

    if (ownerId && token) {
      misConsultas()
        .then((rows) => {
          if (cancelled) return;
          const ordered = [...rows].sort(
            (a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime()
          );
          const loadedIds = new Set(ordered.map((consulta) => consulta.id));
          const newestFirst = [...rows].sort(
            (a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
          );
          setConsultas((previous) => [
            ...previous.filter((consulta) => !loadedIds.has(consulta.id)),
            ...newestFirst,
          ]);
          setMessages((previous) =>
            previous.filter(
              (message) => !message.consultaId || !loadedIds.has(message.consultaId)
            )
          );
        })
        .catch((error) => {
          if (!cancelled) setHistoryError(apiErrorMessage(error));
        })
        .finally(() => {
          if (!cancelled) setHistoryLoading(false);
        });
    }

    return () => {
      cancelled = true;
    };
  }, [user?.id, token]);

  const addMessage = useCallback(
    (type, text, action = null, metadata = null) => {
      if (token && ownerRef.current !== ownerId) return null;
      const msg = {
        id: Date.now() + Math.random().toString(36).slice(2, 8),
        type,
        text,
        action,
        timestamp: new Date().toISOString(),
        ...metadata,
      };
      if (ownerRef.current && !token) {
        localHistoryRef.current = [...localHistoryRef.current, msg].slice(-400);
        saveHistory(ownerRef.current, localHistoryRef.current);
      }
      setMessages((prev) => {
        return [...prev, msg];
      });
      return msg.id;
    },
    [ownerId, token]
  );

  const updateMessage = useCallback((messageId, updates) => {
    setMessages((prev) =>
      prev.map((message) =>
        message.id === messageId ? { ...message, ...updates } : message
      )
    );
  }, []);

  const recordConsulta = useCallback((consulta) => {
    if (!consulta?.id) return;
    setConsultas((prev) => [
      consulta,
      ...prev.filter((row) => row.id !== consulta.id),
    ]);
  }, []);

  const openConversation = useCallback((conversationMessages) => {
    setMessages(conversationMessages);
  }, []);

  const openLocalConversation = useCallback((query) => {
    const matchesQuery = (message) => {
      if (query.id) return message.id === query.id;
      return (
        message.type === "user" &&
        message.text === query.text &&
        (!query.at ||
          Math.abs(new Date(message.timestamp).getTime() - new Date(query.at).getTime()) < 5000)
      );
    };
    const start = localHistoryRef.current.findIndex(matchesQuery);
    if (start < 0) {
      const msgs = [{
        id: query.id || `historial-${query.at}`,
        type: "user",
        text: query.text,
        timestamp: query.at || new Date().toISOString(),
      }];
      if (query.answer) {
        msgs.push({
          id: `historial-${query.at}-res`,
          type: "bot",
          text: query.answer,
          timestamp: query.at || new Date().toISOString(),
        });
      }
      setMessages(msgs);
      return;
    }
    const nextUser = localHistoryRef.current.findIndex(
      (message, index) => index > start && message.type === "user"
    );
    setMessages(
      localHistoryRef.current.slice(start, nextUser < 0 ? undefined : nextUser)
    );
  }, []);

  const removeConsulta = useCallback((consultaId) => {
    setConsultas((previous) => previous.filter((consulta) => consulta.id !== consultaId));
    setMessages((previous) =>
      previous.filter((message) => message.consultaId !== consultaId)
    );
  }, []);

  const removeLocalConversation = useCallback((query) => {
    const matchesQuery = (message) => {
      if (query.id) return message.id === query.id;
      return (
        message.type === "user" &&
        message.text === query.text &&
        (!query.at ||
          Math.abs(new Date(message.timestamp).getTime() - new Date(query.at).getTime()) < 5000)
      );
    };
    const removeConversation = (history) => {
      const start = history.findIndex(matchesQuery);
      if (start < 0) return history;
      const nextUser = history.findIndex(
        (message, index) => index > start && message.type === "user"
      );
      return history.filter((_, index) => index < start || (nextUser >= 0 && index >= nextUser));
    };

    localHistoryRef.current = removeConversation(localHistoryRef.current);
    if (ownerRef.current) saveHistory(ownerRef.current, localHistoryRef.current);
    setMessages((previous) => removeConversation(previous));
  }, []);

  const clearHistory = useCallback(() => {
    setMessages([]);
  }, []);

  const clearLocalHistory = useCallback(() => {
    localHistoryRef.current = [];
    if (ownerRef.current) saveHistory(ownerRef.current, []);
    setMessages([]);
  }, []);

  const reloadConsultas = useCallback(async () => {
    if (!ownerId || !token) return;
    setHistoryLoading(true);
    setHistoryError("");
    try {
      const rows = await misConsultas();
      const newestFirst = [...rows].sort(
        (a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
      );
      setConsultas(newestFirst);
    } catch (error) {
      setHistoryError(apiErrorMessage(error));
    } finally {
      setHistoryLoading(false);
    }
  }, [ownerId, token]);

  return (
    <ChatContext.Provider
      value={{
        messages,
        consultas,
        historyLoading,
        historyError,
        addMessage,
        updateMessage,
        recordConsulta,
        openConversation,
        openLocalConversation,
        removeConsulta,
        removeLocalConversation,
        clearHistory,
        clearLocalHistory,
        reloadConsultas,
        hasHistory: messages.length > 0,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}
