import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import { useAuth } from "@/context/AuthContext";
import type { ChatMessage } from "@/data/mockMessages";
import { readJSON, writeJSON } from "@/lib/storage";

export interface Conversacion {
  id: string;
  titulo: string;
  actualizada: string;
  mensajes: ChatMessage[];
  fijada?: boolean;
}

interface ChatValue {
  conversaciones: Conversacion[];
  activa: string;
  nuevoChat: () => void;
  abrir: (id: string) => void;
  eliminar: (id: string) => void;
  renombrar: (id: string, titulo: string) => void;
  alternarFijada: (id: string) => void;
  guardar: (id: string, mensajes: ChatMessage[]) => void;
  obtener: (id: string) => Conversacion | undefined;
}

const CLAVE = "chats";
const MAXIMO_DE_CHATS = 30;
const LARGO_DEL_TITULO = 40;

const ChatContext = createContext<ChatValue | null>(null);

export function useConversacion(): ChatValue {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error("useConversacion debe usarse dentro de ChatProvider");
  return ctx;
}

function nuevoId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function tituloDe(mensajes: ChatMessage[]) {
  const primero = mensajes.find((m) => m.type === "user")?.text.trim() ?? "Chat nuevo";
  return primero.length > LARGO_DEL_TITULO ? `${primero.slice(0, LARGO_DEL_TITULO).trimEnd()}…` : primero;
}

function ordenar(lista: Conversacion[]) {
  const fijadas = lista.filter((c) => c.fijada);
  const otras = lista.filter((c) => !c.fijada).slice(0, MAXIMO_DE_CHATS);
  return [...fijadas, ...otras];
}

export function ChatProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const [conversaciones, setConversaciones] = useState<Conversacion[]>([]);
  const [activa, setActiva] = useState(nuevoId);
  const [cargadoDe, setCargadoDe] = useState<string | null>(null);
  const [usuarioPrevio, setUsuarioPrevio] = useState(userId);
  const ultimas = useRef(conversaciones);
  const cargado = userId !== null && cargadoDe === userId;

  if (usuarioPrevio !== userId) {
    setUsuarioPrevio(userId);
    setCargadoDe(null);
    if (usuarioPrevio !== null) {
      setConversaciones([]);
      setActiva(nuevoId());
    }
  }

  useEffect(() => {
    ultimas.current = conversaciones;
  }, [conversaciones]);

  useEffect(() => {
    if (!userId) return;

    let vigente = true;
    readJSON<Conversacion[]>(`${CLAVE}:${userId}`, []).then((leidas) => {
      if (!vigente) return;
      const guardadas = Array.isArray(leidas) ? leidas : [];
      setConversaciones((actuales) =>
        ordenar([...actuales, ...guardadas.filter((g) => !actuales.some((a) => a.id === g.id))])
      );
      setCargadoDe(userId);
    });
    return () => {
      vigente = false;
    };
  }, [userId]);

  useEffect(() => {
    if (cargado && userId) writeJSON(`${CLAVE}:${userId}`, conversaciones);
  }, [conversaciones, cargado, userId]);

  const nuevoChat = useCallback(() => setActiva(nuevoId()), []);

  const abrir = useCallback((id: string) => setActiva(id), []);

  const eliminar = useCallback((id: string) => {
    setConversaciones((actuales) => actuales.filter((c) => c.id !== id));
    setActiva((actual) => (actual === id ? nuevoId() : actual));
  }, []);

  const renombrar = useCallback((id: string, titulo: string) => {
    const limpio = titulo.trim();
    if (!limpio) return;
    setConversaciones((actuales) => actuales.map((c) => (c.id === id ? { ...c, titulo: limpio } : c)));
  }, []);

  const alternarFijada = useCallback((id: string) => {
    setConversaciones((actuales) =>
      ordenar(actuales.map((c) => (c.id === id ? { ...c, fijada: !c.fijada } : c)))
    );
  }, []);

  const guardar = useCallback(
    (id: string, mensajes: ChatMessage[]) => {
      if (!userId || mensajes.length === 0) return;
      setConversaciones((actuales) => {
        const existente = actuales.find((c) => c.id === id);
        const conversacion: Conversacion = {
          ...existente,
          id,
          titulo: existente?.titulo ?? tituloDe(mensajes),
          actualizada: new Date().toISOString(),
          mensajes,
        };
        return ordenar([conversacion, ...actuales.filter((c) => c.id !== id)]);
      });
    },
    [userId]
  );

  const obtener = useCallback((id: string) => ultimas.current.find((c) => c.id === id), []);

  const value = useMemo(
    () => ({ conversaciones, activa, nuevoChat, abrir, eliminar, renombrar, alternarFijada, guardar, obtener }),
    [conversaciones, activa, nuevoChat, abrir, eliminar, renombrar, alternarFijada, guardar, obtener]
  );

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}
