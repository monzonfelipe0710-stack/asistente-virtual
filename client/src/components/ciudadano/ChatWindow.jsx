import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { Link } from "react-router-dom";
import MessageBubble from "./MessageBubble";
import ChatBotAvatar from "../ChatBotAvatar";
import ChatHistoryPanel from "./ChatHistoryPanel";
import Navbar from "../common/Navbar";
import { BotReactionController } from "./BotReactionController";
import { wizards } from "../../data/wizard";
import { obtenerChecklist, preguntar } from "../../services/chat";
import { eliminarConsulta } from "../../services/consultas";
import { useChat } from "../../context/ChatContext";
import { useAuth } from "../../context/AuthContext";
import { useSessionStore } from "../../store/session";
import { apiErrorMessage } from "../../lib/api";
import { useToast } from "../common/Toast";
import {
  rememberMessage,
  rememberAnswer,
  HISTORY_LIMIT,
  loadMemory,
  buildReminder,
  detectTopic,
  removeMemoryMessage,
  clearMemoryMessages,
} from "../../lib/chatMemory";


const crearIdConsultaLocal = () => `c_${Date.now()}`;
const crearIdMensajeBot = () => `bot-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
const crearIdConversacion = () => `chat_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
const THREADS_PREFIX = "chatap.threads.";

function cargarConversaciones(userId) {
  if (typeof window === "undefined" || !userId) return [];
  try {
    const parsed = JSON.parse(window.localStorage.getItem(THREADS_PREFIX + userId) || "[]");
    return Array.isArray(parsed) ? parsed.filter((thread) => thread?.id && Array.isArray(thread.messages)) : [];
  } catch {
    return [];
  }
}

function guardarConversaciones(userId, conversations) {
  if (typeof window === "undefined" || !userId) return;
  try {
    window.localStorage.setItem(
      THREADS_PREFIX + userId,
      JSON.stringify(conversations.slice(0, HISTORY_LIMIT))
    );
  } catch {
    // Si el navegador no permite almacenamiento, el chat sigue funcionando en memoria.
  }
}

function crearResumenConversacion(id, messages) {
  const firstQuestion = messages.find((message) => message.type === "user");
  if (!firstQuestion) return null;
  return {
    id,
    title: firstQuestion.text,
    text: firstQuestion.text,
    at: messages[messages.length - 1]?.timestamp || new Date().toISOString(),
    updatedAt: messages[messages.length - 1]?.timestamp || new Date().toISOString(),
    messages,
  };
}

function claveHistorial(query) {
  if (query?.threadId) return `thread:${query.threadId}`;
  if (query?.id !== undefined && query?.id !== null) return `consulta:${query.id}`;
  return `legacy:${query?.at || ""}:${query?.text || ""}`;
}

const CHATAP_PILLS = [
  {
    id: "haberes",
    label: "Recibo de haberes",
    query: "¿Dónde puedo ver mi recibo de sueldo?",
    icon: (
      <svg className="w-4 h-4 text-sky-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    id: "siged",
    label: "Expedientes SIGED",
    query: "¿Cómo puedo seguir mi expediente?",
    icon: (
      <svg className="w-4 h-4 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
  },
  {
    id: "licencias",
    label: "Licencias médicas",
    query: "¿Cómo solicito una licencia médica?",
    icon: (
      <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
  },
  {
    id: "mesa-entradas",
    label: "Mesa de Entradas",
    query: "¿Cómo inicio un trámite en Mesa de Entradas?",
    icon: (
      <svg className="w-4 h-4 text-pink-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    id: "formularios",
    label: "Formularios y notas",
    query: "¿Dónde descargo los formularios oficiales?",
    icon: (
      <svg className="w-4 h-4 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
      </svg>
    ),
  },
  {
    id: "mas",
    label: "Más consultas",
    query: "¿Cuáles son los trámites más consultados?",
    icon: (
      <svg className="w-4 h-4 text-purple-400" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 2l2.4 7.2h7.6l-6.2 4.5 2.4 7.3-6.2-4.5-6.2 4.5 2.4-7.3-6.2-4.5h7.6z" />
      </svg>
    ),
  },
];

// Atajos de trámites concretos: se mantienen separados de las categorías rápidas.
const TRAMITES_SOLICITADOS = [
  { id: "certificado-servicios", title: "¿Cómo solicito el certificado de servicios?", query: "¿Cómo solicito el certificado de servicios?", description: "Cómo pedir la constancia y dónde presentarla." },
  { id: "licencia-medica", title: "¿Cómo tramito una licencia médica?", query: "¿Cómo tramito una licencia médica?", description: "Documentación y procedimiento de presentación." },
  { id: "recibo-haberes", title: "¿Cómo consulto mi recibo de haberes?", query: "¿Cómo consulto o descargo mi recibo de haberes?", description: "Orientación para encontrar tu recibo de sueldo." },
  { id: "seguimiento-expediente", title: "¿Cómo sigo mi expediente?", query: "¿Cómo consulto el estado de mi expediente?", description: "Dónde consultar los movimientos del expediente." },
];

const MAX_PREGUNTA = 500;
const MAX_IMAGEN_BYTES = 8 * 1024 * 1024;
const TIPOS_IMAGEN = ["image/jpeg", "image/png", "image/webp"];

export default function ChatWindow({ initialQuery = null }) {
  const {
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
  } = useChat();
  const { user, isAuthenticated } = useAuth();
  const token = useSessionStore((state) => state.token);
  const toast = useToast();
  const [input, setInput] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [imageError, setImageError] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [phase, setPhase] = useState("welcome");
  const [listening, setListening] = useState(false);
  const [speakingId, setSpeakingId] = useState(null);
  const [typedText, setTypedText] = useState("");
  const [reaction, setReaction] = useState("idle");
  const [announce, setAnnounce] = useState("");
  const messagesRef = useRef(null);
  const scrollFrameRef = useRef(0);
  const imageInputRef = useRef(null);
  const imageReadRef = useRef(0);
  const nearBottomRef = useRef(true);
  const recognitionRef = useRef(null);
  const transcriptRef = useRef("");
  const startedRef = useRef(false);
  const speakingRef = useRef(false);
  const speakingIdRef = useRef(null);
  const typeTimerRef = useRef(0);
  const controllerRef = useRef(null);
  const typingTimerRef = useRef(null);
  const greetedRef = useRef(false);
  const wizardRef = useRef(null);
  const [welcomeMem, setWelcomeMem] = useState(null);
  const [promoReady, setPromoReady] = useState(false);
  const [promoDismissed, setPromoDismissed] = useState(false);
  const [promoLeaving, setPromoLeaving] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const historyDrawerRef = useRef(null);
  const historyCloseButtonRef = useRef(null);
  const historyTriggerRef = useRef(null);
  const [historyCollapsed, setHistoryCollapsed] = useState(false);
  const [historyVersion, setHistoryVersion] = useState(0);
  const [pendingDeleteKeys, setPendingDeleteKeys] = useState(() => new Set());
  const [activeThreadId, setActiveThreadId] = useState(() => crearIdConversacion());
  const activeThreadIdRef = useRef(activeThreadId);
  const [savedThreads, setSavedThreads] = useState(() =>
    cargarConversaciones(user?.id || "ciudadano_anonimo")
  );
  const threadOwnerRef = useRef(user?.id || "ciudadano_anonimo");

  // El tutorial puede abrir el historial móvil para mostrar el ejemplo en contexto.
  useEffect(() => {
    const openHistoryForTutorial = () => {
      if (window.innerWidth < 1024) setHistoryOpen(true);
    };
    window.addEventListener("chatap-open-history-for-tutorial", openHistoryForTutorial);
    return () => window.removeEventListener("chatap-open-history-for-tutorial", openHistoryForTutorial);
  }, []);

  // Mientras el drawer está abierto, ocultamos el navbar flotante en móvil
  // para que no se superponga con el panel ni intercepte sus controles.
  useEffect(() => {
    const root = document.documentElement;
    if (historyOpen) root.setAttribute("data-chat-history-open", "true");
    else root.removeAttribute("data-chat-history-open");
    return () => root.removeAttribute("data-chat-history-open");
  }, [historyOpen]);

  // El historial móvil funciona como un drawer lateral accesible, al estilo de
  // las apps de chat: Escape cierra, Tab queda dentro y el foco vuelve al botón.
  useEffect(() => {
    if (!historyOpen) return undefined;
    const previousFocus = document.activeElement;

    function handleDrawerKeyDown(event) {
      if (event.key === "Escape") {
        event.preventDefault();
        setHistoryOpen(false);
        return;
      }
      if (event.key !== "Tab" || !historyDrawerRef.current) return;
      const focusable = Array.from(
        historyDrawerRef.current.querySelectorAll(
          'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])'
        )
      );
      if (!focusable.length) {
        event.preventDefault();
        return;
      }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", handleDrawerKeyDown);
    historyCloseButtonRef.current?.focus();
    return () => {
      document.removeEventListener("keydown", handleDrawerKeyDown);
      if (previousFocus && typeof previousFocus.focus === "function") previousFocus.focus();
    };
  }, [historyOpen]);

  // Callbacks estables: junto con React.memo en MessageBubble evitan
  // re-renderizar todo el historial en cada tick del efecto de tipeo.
  const actionsRef = useRef({});
  useEffect(() => {
    actionsRef.current = {
      followUp: handleFollowUp,
      checklist: handleChecklist,
      rate: handleRate,
    };
  });
  const onFollowUp = useCallback((payload) => actionsRef.current.followUp?.(payload), []);
  const onChecklist = useCallback((action) => actionsRef.current.checklist?.(action), []);
  const onRate = useCallback((id, value) => actionsRef.current.rate?.(id, value), []);

  const [speechSupported] = useState(
    () =>
      typeof window !== "undefined" &&
      !!(window.SpeechRecognition || window.webkitSpeechRecognition)
  );

  // Tamaño del avatar adaptable a la altura de pantalla; si el contenido no
  // entra, la bienvenida se desplaza (ver .chat-welcome-scroll).
  const [avatarSize, setAvatarSize] = useState(() => {
    if (typeof window === "undefined") return 92;
    const h = window.innerHeight;
    return h >= 840 ? 92 : h >= 720 ? 78 : h >= 620 ? 62 : 50;
  });

  useEffect(() => {
    function onResize() {
      const h = window.innerHeight;
      setAvatarSize(h >= 840 ? 92 : h >= 720 ? 78 : h >= 620 ? 62 : 50);
    }
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    let frame = 0;
    const observer = new MutationObserver(() => {
      if (phase === "chat" || root.hasAttribute("data-a11y-text")) return;
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        if (messagesRef.current) messagesRef.current.scrollTop = 0;
        nearBottomRef.current = true;
      });
    });
    observer.observe(root, { attributes: true, attributeFilter: ["data-a11y-text"] });
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [phase]);

  // Auto-scroll alineado al siguiente frame. Durante el tipeo usamos scrollTop
  // directo para no reiniciar una animación smooth ni competir con el render de cada bloque.
  // Si la persona está leyendo mensajes anteriores, nunca le movemos el scroll.
  useEffect(() => {
    if (phase !== "chat" || !nearBottomRef.current || !messagesRef.current) return undefined;
    if (scrollFrameRef.current) cancelAnimationFrame(scrollFrameRef.current);
    scrollFrameRef.current = requestAnimationFrame(() => {
      scrollFrameRef.current = 0;
      const el = messagesRef.current;
      if (!el || !nearBottomRef.current) return;
      const top = el.scrollHeight;
      if (speakingRef.current || typedText) el.scrollTop = top;
      else el.scrollTo({ top, behavior: "smooth" });
    });
    return () => {
      if (scrollFrameRef.current) cancelAnimationFrame(scrollFrameRef.current);
      scrollFrameRef.current = 0;
    };
  }, [messages, isTyping, phase, typedText]);

  function handleMessagesScroll() {
    const el = messagesRef.current;
    if (!el) return;
    nearBottomRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 140;
  }

  useEffect(() => {
    const controller = new BotReactionController({
      emit: setReaction,
      isReducedMotion: () =>
        typeof window !== "undefined" &&
        !!window.matchMedia &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    });
    controllerRef.current = controller;
    controller.start();

    // Track mouse movement as activity (throttled)
    let mouseThrottle = null;
    const onMouseMove = () => {
      if (mouseThrottle) return;
      mouseThrottle = setTimeout(() => { mouseThrottle = null; }, 2000);
      if (controllerRef.current) {
        controllerRef.current.lastActivityTime = Date.now();
        if (controllerRef.current.isSleeping) {
          controllerRef.current.wakeUp();
        }
      }
    };
    // Track keyboard as activity
    const onKeyDown = () => {
      if (controllerRef.current) {
        controllerRef.current.lastActivityTime = Date.now();
        if (controllerRef.current.isSleeping) {
          controllerRef.current.wakeUp();
        }
      }
    };
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("keydown", onKeyDown);

    return () => {
      controller.stop();
      controllerRef.current = null;
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("keydown", onKeyDown);
      clearTimeout(mouseThrottle);
    };
  }, []);

  // Si el usuario autenticado vuelve con historial guardado,
  // entramos directamente al chat en lugar del saludo inicial.
  useEffect(() => {
    if (messages.length > 0 && !startedRef.current) {
      startedRef.current = true;
      setPhase("chat");
    }
  }, [messages.length]);

  // Al cambiar de usuario (login/logout) reiniciamos el saludo personalizado.
  const userId = user?.id ?? null;
  useEffect(() => {
    greetedRef.current = false;
  }, [userId]);

  // Cada conversación se guarda por separado en el navegador para poder retomarla
  // aunque se inicie otro chat o se recargue la página.
  useEffect(() => {
    const effectiveId = userId || "ciudadano_anonimo";
    if (threadOwnerRef.current !== effectiveId) {
      threadOwnerRef.current = effectiveId;
      setSavedThreads(cargarConversaciones(effectiveId));
      setPendingDeleteKeys(new Set());
      const nextThreadId = crearIdConversacion();
      activeThreadIdRef.current = nextThreadId;
      setActiveThreadId(nextThreadId);
    }
  }, [userId]);

  useEffect(() => {
    const effectiveId = userId || "ciudadano_anonimo";
    if (threadOwnerRef.current !== effectiveId || messages.length === 0) return;
    const snapshot = crearResumenConversacion(activeThreadId, messages);
    if (!snapshot) return;
    // Sincronizamos el índice local del historial con el hilo activo.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSavedThreads((previous) => {
      const next = [
        snapshot,
        ...previous.filter((thread) => thread.id !== activeThreadId),
      ].sort((a, b) => new Date(b.updatedAt || b.at) - new Date(a.updatedAt || a.at))
        .slice(0, HISTORY_LIMIT);
      guardarConversaciones(effectiveId, next);
      return next;
    });
  }, [activeThreadId, messages, userId]);

  // Memoria: cargamos el contexto del usuario para personalizar la bienvenida.
  useEffect(() => {
    const effectiveId = userId || "ciudadano_anonimo";
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setWelcomeMem(
      token && consultas.length > 0
        ? {
            count: consultas.length,
            lastTopic: consultas[0]?.topico === "haberes"
              ? "recibos"
              : consultas[0]?.topico === "requisitos"
                ? "tramites"
                : consultas[0]?.topico,
            topics: consultas.reduce((counts, consulta) => {
              const topic = consulta.topico === "haberes"
                ? "recibos"
                : consulta.topico === "requisitos"
                  ? "tramites"
                  : consulta.topico;
              if (topic) counts[topic] = (counts[topic] || 0) + 1;
              return counts;
            }, {}),
            preferredOffice: null,
          }
        : loadMemory(effectiveId)
    );
  }, [userId, token, consultas, historyVersion]);

  // El historial prioriza hilos completos; las consultas anteriores se mantienen
  // como entradas individuales para que los registros previos sigan accesibles.
  const historyQueries = useMemo(() => {
    const effectiveId = userId || "ciudadano_anonimo";
    const threads = savedThreads.map((thread) => ({
      ...thread,
      threadId: thread.id,
      text: thread.title || thread.text || "Nueva consulta",
      at: thread.updatedAt || thread.at,
    }));
    const includedConsultaIds = new Set(
      savedThreads.flatMap((thread) =>
        (thread.messages || []).map((message) => message.consultaId).filter(Boolean)
      )
    );
    const legacyConsultas = consultas
      .filter((consulta) => !includedConsultaIds.has(consulta.id))
      .map((consulta) => ({
        id: consulta.id,
        text: consulta.textoConsulta,
        at: consulta.fecha,
        answer: consulta.respuesta,
        calificacion: consulta.calificacion,
        tramite: consulta.tramite ?? null,
        estado: consulta.encontrado ? "Resultado disponible" : "Sin coincidencia",
      }));
    const legacyMemory = loadMemory(effectiveId).messages || [];
    const legacy = token
      ? legacyConsultas
      : legacyConsultas.length
        ? legacyConsultas
        : legacyMemory.slice().reverse();
    return [...threads, ...legacy.filter((item) =>
      !threads.some((thread) => thread.text === item.text && Math.abs(
        new Date(thread.at).getTime() - new Date(item.at).getTime()
      ) < 5000)
    )].slice(0, HISTORY_LIMIT);
  }, [userId, token, consultas, savedThreads]);

  const displayedHistoryQueries = useMemo(
    () => historyQueries.filter((item) => !pendingDeleteKeys.has(claveHistorial(item))),
    [historyQueries, pendingDeleteKeys]
  );

  // Consulta automática iniciada desde el buscador del Hero
  const initialQueryHandled = useRef(false);
  const sendTextRef = useRef(null);
  useEffect(() => {
    sendTextRef.current = sendText;
  });
  useEffect(() => {
    if (initialQuery && !initialQueryHandled.current) {
      initialQueryHandled.current = true;
      const timer = setTimeout(() => {
        sendTextRef.current?.(initialQuery);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [initialQuery]);

  function beginChat() {
    if (startedRef.current) return;
    startedRef.current = true;
    setPhase("leaving");
    setTimeout(() => setPhase("chat"), 480);
  }

  /** Cierra la invitación de forma fluida; mantiene el aviso hasta el próximo ingreso. */
  function dismissPromo() {
    if (promoDismissed || promoLeaving) return;
    setPromoLeaving(true);
    window.setTimeout(() => setPromoDismissed(true), 320);
  }

  /** Añade el mensaje del bot con efecto de tipeo y reacciones del avatar. */
  function presentBotMessage(
    finalText,
    finalActions,
    { error = false, consultaId = null, canRate = false, calificacion = null } = {}
  ) {
    setIsTyping(false);
    clearInterval(typingTimerRef.current);

    const id = addMessage("bot", finalText, finalActions || undefined, {
      consultaId,
      canRate,
      calificacion,
    });

    // La invitación a iniciar sesión aparece de forma fluida tras la primera respuesta.
    setPromoReady(true);

    // Anuncio para tecnologías de asistencia: texto completo, una sola vez.
    setAnnounce(finalText);

    // Con movimiento reducido se muestra el texto completo de inmediato.
    const reduceMotion =
      typeof window !== "undefined" &&
      !!window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) {
      controllerRef.current?.onEvent(error ? "botError" : "botSuccess");
      return;
    }

    // Agrupamos varios caracteres por actualización: conserva el efecto de tipeo,
    // pero reduce los renders y el trabajo de scroll durante respuestas largas.
    const charStep = finalText.length > 240 ? 5 : finalText.length > 100 ? 3 : 2;
    const charDelay = 30;

    speakingRef.current = true;
    speakingIdRef.current = id;
    setSpeakingId(id);
    setTypedText("");

    // Pasamos la respuesta al controller para que detecte el tono
    controllerRef.current?.onEvent("botResponding", {
      text: finalText,
      reaction: error ? "worried" : undefined,
    });

    let i = 0;
    typeTimerRef.current = setInterval(() => {
      if (speakingIdRef.current !== id) {
        clearInterval(typeTimerRef.current);
        return;
      }
      i += charStep;
      setTypedText(finalText.slice(0, i));
      if (i >= finalText.length) {
        clearInterval(typeTimerRef.current);
        setTimeout(() => {
          if (speakingIdRef.current !== id) return;
          speakingRef.current = false;
          speakingIdRef.current = null;
          setSpeakingId(null);
          setTypedText("");
          controllerRef.current?.onEvent(error ? "botError" : "botSuccess");
        }, 550);
      }
    }, charDelay);
  }

  async function respondTo(userText, image = null, userMessageId = null, immediateConsultaId = null) {
    const responseThreadId = activeThreadIdRef.current;
    setIsTyping(true);
    controllerRef.current?.onEvent("botThinking");

    let finalText;
    let finalActions = null;
    let consultationData = null;
    let error = false;

    try {
      const data = await preguntar(userText.slice(0, MAX_PREGUNTA), image);
      consultationData = data;
      finalText =
        String(data?.respuesta || "").trim() ||
        "No pude generar una respuesta. Probá reformulando la consulta.";

      const tramites = Array.isArray(data?.tramitesEncontrados)
        ? data.tramitesEncontrados.filter((t) => t?.nombre && Number.isInteger(t?.id))
        : [];
      if (tramites.length) {
        finalActions = [
          {
            type: "chips",
            title: "Trámites relacionados:",
            options: tramites.map((t) => ({ label: t.nombre, value: t.nombre })),
          },
          ...tramites.map((tramite) => ({
            type: "checklist",
            tramiteId: tramite.id,
            tramiteNombre: tramite.nombre,
            label: `Descargar checklist · ${tramite.nombre}`,
          })),
        ];
      }
    } catch (err) {
      error = true;
      const status = err?.response?.status;
      if (status === 429) {
        finalText =
          "Estás consultando muy seguido. Esperá unos segundos y volvé a intentar.";
      } else if (status === 413) {
        finalText = "La imagen es demasiado grande. Elegí una imagen de hasta 8 MB.";
      } else if (status === 415) {
        finalText = "El formato de imagen no es compatible. Usá JPEG, PNG o WebP.";
      } else if (status === 400) {
        finalText =
          "No pude procesar la consulta. Revisá el texto e intentá de nuevo.";
      } else {
        finalText =
          "El asistente no está disponible en este momento. Reintentá en unos instantes.";
      }
    }

    // Primer mensaje de la sesión: el bot reconoce al usuario por su nombre
    // y/o le recuerda lo que venía consultando.
    if (!error && isAuthenticated && user?.name && !greetedRef.current) {
      greetedRef.current = true;
      const mem = userId ? (token ? welcomeMem : loadMemory(userId)) : null;
      const firstName = user.name.split(" ")[0];
      const reminder = mem && mem.count > 0 ? buildReminder(mem, user.name) : null;
      if (reminder) {
        finalText = reminder + " " + finalText.charAt(0).toLowerCase() + finalText.slice(1);
      } else if (!/^(hola|buenas|buen)/i.test(finalText)) {
        finalText = `Claro, ${firstName}. ` + finalText.charAt(0).toLowerCase() + finalText.slice(1);
      }
    }

    const effectiveId = userId || "ciudadano_anonimo";
    rememberAnswer(effectiveId, {
      label: userText,
      topic: detectTopic(userText),
      kind: error ? "error" : "chat",
    });

    if (consultationData?.consultaId && token) {
      if (userMessageId) {
        updateMessage(userMessageId, { consultaId: consultationData.consultaId });
      }
      recordConsulta({
        id: consultationData.consultaId,
        textoConsulta: userText,
        respuesta: consultationData.respuesta || finalText,
        encontrado: consultationData.encontrado,
        calificacion: null,
        topico: detectTopic(userText),
        fecha: consultationData.consultaFecha || new Date().toISOString(),
        tramite: null,
      });
      if (immediateConsultaId && immediateConsultaId !== consultationData.consultaId) {
        removeConsulta(immediateConsultaId);
      }
      // La consulta ya quedó actualizada en el estado local; evitar una recarga
      // inmediata que pueda sobrescribirla con una respuesta todavía desactualizada.
    } else if (immediateConsultaId) {
      recordConsulta({
        id: immediateConsultaId,
        textoConsulta: userText,
        respuesta: finalText,
        encontrado: null,
        calificacion: null,
        topico: detectTopic(userText),
        fecha: new Date().toISOString(),
        tramite: null,
      });
    }
    setHistoryVersion((v) => v + 1);

    const responseMetadata = {
      error,
      consultaId: consultationData?.consultaId,
      canRate: Boolean(consultationData?.consultaId && token),
      calificacion: null,
    };
    if (activeThreadIdRef.current !== responseThreadId) {
      // Si el usuario cambió de hilo mientras el asistente respondía, la respuesta
      // termina en el hilo original y nunca se mezcla con la conversación nueva.
      const answerMessage = {
        id: crearIdMensajeBot(),
        type: "bot",
        text: finalText,
        action: finalActions || undefined,
        timestamp: new Date().toISOString(),
        consultaId: consultationData?.consultaId,
        canRate: Boolean(consultationData?.consultaId && token),
        calificacion: null,
      };
      setSavedThreads((previous) => {
        const target = previous.find((thread) => thread.id === responseThreadId);
        if (!target) return previous;
        const next = [
          {
            ...target,
            messages: [...target.messages, answerMessage],
            updatedAt: answerMessage.timestamp,
            at: answerMessage.timestamp,
          },
          ...previous.filter((thread) => thread.id !== responseThreadId),
        ].sort((a, b) => new Date(b.updatedAt || b.at) - new Date(a.updatedAt || a.at))
          .slice(0, HISTORY_LIMIT);
        guardarConversaciones(userId || "ciudadano_anonimo", next);
        return next;
      });
      return;
    }

    presentBotMessage(finalText, finalActions, responseMetadata);
  }

  function sendText(text, image = null, preview = "") {
    const t = (text ?? "").trim();
    if (!t) return;

    // También protegemos el envío directo (por ejemplo, desde una búsqueda inicial):
    // un hilo nuevo no puede empezar si ya existen cuatro conversaciones.
    const activeThreadSaved = savedThreads.some((thread) => thread.id === activeThreadId) ||
      historyQueries.some((item) => item.threadId === activeThreadId);
    const currentThread = crearResumenConversacion(activeThreadId, messages);
    const conversationCount = getConversationCount();
    // Si el hilo ya está dentro del cupo, puede seguir recibiendo mensajes.
    // Si sería un quinto hilo, bloqueamos también aunque el estado esté en transición.
    const activeThreadWithinLimit = activeThreadSaved ||
      (currentThread && conversationCount <= HISTORY_LIMIT);
    if (!activeThreadWithinLimit && conversationCount >= HISTORY_LIMIT) {
      const message = "Llegaste al límite de 4 conversaciones. Eliminá una del historial para crear una nueva.";
      setAnnounce(message);
      toast?.(message, "error");
      return;
    }

    beginChat();
    const userMessageId = addMessage("user", t, image ? {
      type: "image",
      dataUrl: preview,
      fileName: image.name,
    } : undefined);

    // Registro INMEDIATO en el historial apenas el usuario envía la consulta
    const effectiveId = userId || "ciudadano_anonimo";
    rememberMessage(effectiveId, t, userMessageId);
    const immediateConsultaId = crearIdConsultaLocal();
    recordConsulta({
      id: immediateConsultaId,
      textoConsulta: t,
      respuesta: "",
      encontrado: null,
      calificacion: null,
      topico: detectTopic(t),
      fecha: new Date().toISOString(),
      tramite: null,
    });
    setHistoryVersion((v) => v + 1);

    if (wizardRef.current && !image) {
      wizardRef.current.lastMessageId = userMessageId;
      runWizardStep(t);
      return;
    }
    if (image) wizardRef.current = null;
    // Pasamos el texto del usuario para que el controller detecte contexto
    controllerRef.current?.onEvent("userMessageSent", { text: t });
    respondTo(t, image, userMessageId, immediateConsultaId);
  }

  async function handleChecklist(action) {
    try {
      const tramite = await obtenerChecklist(action.tramiteId);
      const requisitos = tramite.requisitos?.length
        ? tramite.requisitos.map((requisito) => {
            const detalles = [
              requisito.dondeSeConsigue && `Dónde conseguirlo: ${requisito.dondeSeConsigue}`,
              requisito.costo != null && Number(requisito.costo) > 0
                ? `Costo: $${requisito.costo}`
                : null,
            ].filter(Boolean);
            return `[ ] ${requisito.descripcion}${detalles.length ? ` (${detalles.join(" · ")})` : ""}`;
          })
        : ["[ ] Consultar los requisitos directamente con la oficina correspondiente."];
      const oficinas = tramite.mesas?.length
        ? tramite.mesas.map((mesa) =>
            `- ${[mesa.nombre, mesa.direccion, mesa.localidad].filter(Boolean).join(", ")}`
          )
        : ["- Consultar dónde presentar el trámite con la oficina correspondiente."];
      const documentos = tramite.documentos?.length
        ? tramite.documentos.map((documento) => `[ ] ${documento.nombre}`)
        : ["- No hay formularios descargables registrados."];
      const costo = tramite.costo == null || Number(tramite.costo) === 0
        ? "Sin costo informado"
        : `$${tramite.costo}`;
      const contenido = [
        `CHECKLIST: ${tramite.nombre}`,
        "",
        `Costo del trámite: ${costo}`,
        "",
        "DOCUMENTACIÓN",
        ...requisitos,
        "",
        "FORMULARIOS",
        ...documentos,
        "",
        "DÓNDE PRESENTARLO",
        ...oficinas,
        "",
        "Preparado con información de ChatAP. Confirmá los requisitos vigentes antes de iniciar el trámite.",
      ].join("\n");
      const blob = new Blob([contenido], { type: "text/plain;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      const nombreSeguro = tramite.nombre
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-zA-Z0-9]+/g, "-")
        .replace(/^-|-$/g, "")
        .toLowerCase();
      link.href = url;
      link.download = `checklist-${nombreSeguro || tramite.id}.txt`;
      link.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (error) {
      toast?.(apiErrorMessage(error, "No se pudo generar el checklist."), "error");
    }
  }

  function handleRate(messageId, calificacion) {
    updateMessage(messageId, { calificacion });
    const message = messages.find((item) => item.id === messageId);
    const consulta = consultas.find((item) => item.id === message?.consultaId);
    if (consulta) recordConsulta({ ...consulta, calificacion }, userId);
  }

  function handleSend(e) {
    e?.preventDefault();
    const t = input.trim();
    if (!t || (imageFile && !imagePreview)) return;
    setInput("");
    imageReadRef.current += 1;
    const file = imageFile;
    const preview = imagePreview;
    setImageFile(null);
    setImagePreview("");
    setImageError("");
    imageReadRef.current += 1;
    if (imageInputRef.current) imageInputRef.current.value = "";
    sendText(t, file, preview);
  }

  function handleImageSelect(e) {
    const file = e.target.files?.[0];
    const readId = ++imageReadRef.current;
    setImageFile(null);
    setImagePreview("");
    setImageError("");
    if (!file) return;
    if (!TIPOS_IMAGEN.includes(file.type)) {
      setImageError("Elegí una imagen JPEG, PNG o WebP.");
      e.target.value = "";
      return;
    }
    if (file.size > MAX_IMAGEN_BYTES) {
      setImageError("La imagen no puede superar los 8 MB.");
      e.target.value = "";
      return;
    }

    setImageFile(file);
    const reader = new FileReader();
    reader.onload = () => {
      if (readId !== imageReadRef.current) return;
      if (typeof reader.result === "string") {
        const source = new Image();
        source.onload = () => {
          if (readId !== imageReadRef.current) return;
          const scale = Math.min(1, 960 / Math.max(source.width, source.height));
          const canvas = document.createElement("canvas");
          canvas.width = Math.max(1, Math.round(source.width * scale));
          canvas.height = Math.max(1, Math.round(source.height * scale));
          const context = canvas.getContext("2d");
          if (!context) {
            setImagePreview(reader.result);
            return;
          }
          context.fillStyle = "#fff";
          context.fillRect(0, 0, canvas.width, canvas.height);
          context.drawImage(source, 0, 0, canvas.width, canvas.height);
          setImagePreview(canvas.toDataURL("image/jpeg", 0.78));
        };
        source.onerror = () => {
          if (readId !== imageReadRef.current) return;
          setImageError("No se pudo procesar la imagen. Intentá elegirla otra vez.");
          setImageFile(null);
          if (imageInputRef.current) imageInputRef.current.value = "";
        };
        source.src = reader.result;
      }
    };
    reader.onerror = () => {
      if (readId !== imageReadRef.current) return;
      setImageError("No se pudo leer la imagen. Intentá elegirla otra vez.");
      setImageFile(null);
      if (imageInputRef.current) imageInputRef.current.value = "";
    };
    reader.readAsDataURL(file);
  }

  function removeSelectedImage() {
    imageReadRef.current += 1;
    setImageFile(null);
    setImagePreview("");
    setImageError("");
    if (imageInputRef.current) imageInputRef.current.value = "";
  }

  function handleInputChange(e) {
    setInput(e.target.value);

    // Notificar al controller que el usuario está escribiendo
    clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(() => {
      controllerRef.current?.onEvent("userTyping");
    }, 800);
  }

  function handleQuickReply(query) {
    sendText(query);
  }

  function handleFollowUp(payload) {
    if (!payload) return;
    if (typeof payload === "string") {
      sendText(payload);
      return;
    }
    if (payload.type === "wizard" && payload.wizardId) {
      startWizard(payload.wizardId);
    }
  }

  function askWizardStep() {
    const w = wizardRef.current;
    if (!w) return;
    const flow = wizards[w.id];
    const step = flow.steps[w.step];
    if (step?.final) {
      finishWizard();
      return;
    }
    addMessage("bot", step.question, {
      type: "chips",
      options: step.chips.map((c) => ({ label: c, value: c })),
    });
  }

  function startWizard(id) {
    const flow = wizards[id];
    if (!flow) return;
    beginChat();
    wizardRef.current = { id, step: 0, data: {} };
    askWizardStep();
  }

  function runWizardStep(input) {
    const w = wizardRef.current;
    if (!w) return;
    const flow = wizards[w.id];
    const step = flow.steps[w.step];
    w.data[`step${w.step}`] = input;
    if (step?.final) {
      finishWizard();
      return;
    }
    w.step += 1;
    const next = flow.steps[w.step];
    if (next?.final) {
      finishWizard();
      return;
    }
    addMessage("bot", next.question, {
      type: "chips",
      options: next.chips.map((c) => ({ label: c, value: c })),
    });
  }

  function finishWizard() {
    const w = wizardRef.current;
    wizardRef.current = null;
    if (!w) return;
    const flow = wizards[w.id];
    // La asistencia guiada arma la consulta y la envía al backend.
    const pregunta = [flow.title, ...Object.values(w.data).filter(Boolean)].join(". ");
    respondTo(pregunta, null, w.lastMessageId);
  }

  function resetConversation() {
    clearInterval(typeTimerRef.current);
    clearTimeout(typingTimerRef.current);
    clearHistory();
    setIsTyping(false);
    setSpeakingId(null);
    setTypedText("");
    speakingRef.current = false;
    speakingIdRef.current = null;
    controllerRef.current?.reset();
    setReaction("idle");
    setInput("");
    setImageFile(null);
    setImagePreview("");
    setImageError("");
    if (imageInputRef.current) imageInputRef.current.value = "";
    setPhase("welcome");
    if (messagesRef.current) messagesRef.current.scrollTop = 0;
    startedRef.current = false;
    greetedRef.current = false;
    wizardRef.current = null;
    nearBottomRef.current = true;
    const nextThreadId = crearIdConversacion();
    activeThreadIdRef.current = nextThreadId;
    setActiveThreadId(nextThreadId);
    const resetMsg = "Se inició un chat nuevo. Escribí tu consulta cuando quieras.";
    setAnnounce(resetMsg);
  }

  // Cuenta conversaciones por identidad, no por el texto de la pregunta:
  // dos chats distintos pueden empezar con exactamente la misma consulta.
  function getConversationCount() {
    const currentThread = crearResumenConversacion(activeThreadId, messages);
    const activeThreadSaved = savedThreads.some((thread) => thread.id === activeThreadId) ||
      historyQueries.some((item) => item.threadId === activeThreadId);
    return Math.max(historyQueries.length, savedThreads.length) +
      (currentThread && !activeThreadSaved ? 1 : 0);
  }

  // Nunca se permite crear un quinto hilo. Si ya hay cuatro conversaciones,
  // el usuario debe borrar una antes de iniciar otra.
  function handleResetRequest() {
    const currentThread = crearResumenConversacion(activeThreadId, messages);
    const conversationCount = getConversationCount();

    if (conversationCount >= HISTORY_LIMIT) {
      const message = "Llegaste al límite de 4 conversaciones. Eliminá una del historial para crear una nueva.";
      setAnnounce(message);
      toast?.(message, "error");
      return;
    }

    const effectiveId = userId || "ciudadano_anonimo";
    if (currentThread) {
      const next = [
        currentThread,
        ...savedThreads.filter((thread) => thread.id !== activeThreadId),
      ].sort((a, b) => new Date(b.updatedAt || b.at) - new Date(a.updatedAt || a.at))
        .slice(0, HISTORY_LIMIT);
      guardarConversaciones(effectiveId, next);
      setSavedThreads(next);
    }
    setHistoryOpen(false);
    resetConversation();
  }

  // Abrir un hilo completo o una consulta antigua sin volver a enviarla al asistente.
  function handleHistorySelect(query) {
    setHistoryOpen(false);
    if (query.threadId) {
      activeThreadIdRef.current = query.threadId;
      setActiveThreadId(query.threadId);
      openConversation(query.messages || []);
      startedRef.current = true;
      setPhase("chat");
      return;
    }
    const legacyThreadId = crearIdConversacion();
    activeThreadIdRef.current = legacyThreadId;
    setActiveThreadId(legacyThreadId);
    if (token) {
      const timestamp = query.at ? new Date(query.at).toISOString() : new Date().toISOString();
      const conversation = [{
        id: `consulta-${query.id}-pregunta`,
        type: "user",
        text: query.text,
        timestamp,
        consultaId: query.id,
      }];
      if (query.answer) {
        conversation.push({
          id: `consulta-${query.id}-respuesta`,
          type: "bot",
          text: query.answer,
          action: query.tramite
            ? {
                type: "checklist",
                tramiteId: query.tramite.id,
                tramiteNombre: query.tramite.nombre,
                label: `Descargar checklist · ${query.tramite.nombre}`,
              }
            : null,
          timestamp,
          consultaId: query.id,
          calificacion: query.calificacion,
          canRate: true,
        });
      }
      openConversation(conversation);
    } else {
      openLocalConversation(query);
    }
    startedRef.current = true;
    setPhase("chat");
  }

  // Borrar una consulta puntual del historial guardado.
  async function handleDeleteQuery(query) {
    const effectiveId = userId || "ciudadano_anonimo";
    if (query.threadId) {
      const next = savedThreads.filter((thread) => thread.id !== query.threadId);
      guardarConversaciones(effectiveId, next);
      setSavedThreads(next);
      if (query.threadId === activeThreadId) resetConversation();
      setAnnounce("Conversación borrada del historial.");
      return;
    }

    const key = claveHistorial(query);
    if (pendingDeleteKeys.has(key)) return;

    const isActiveConversation = messages.some((message) =>
      token
        ? message.consultaId === query.id
        : query.id
          ? message.id === query.id
          : message.type === "user" &&
            message.text === query.text &&
            (!query.at ||
              Math.abs(new Date(message.timestamp).getTime() - new Date(query.at).getTime()) < 5000)
    );

    // Ocultamos la fila al instante y dejamos la operación remota en segundo
    // plano para que el historial no parezca trabado.
    setPendingDeleteKeys((previous) => new Set(previous).add(key));
    if (!token || typeof query.id !== "number") {
      removeMemoryMessage(effectiveId, query.at);
      removeLocalConversation(query);
      if (query.id) removeConsulta(query.id);
      if (isActiveConversation) resetConversation();
      setHistoryVersion((v) => v + 1);
      setAnnounce("Conversación borrada del historial.");
      setPendingDeleteKeys((previous) => {
        const next = new Set(previous);
        next.delete(key);
        return next;
      });
      return;
    }

    try {
      await eliminarConsulta(query.id);
      removeConsulta(query.id);
      if (isActiveConversation) resetConversation();
      setHistoryVersion((v) => v + 1);
      setAnnounce("Conversación borrada del historial.");
      // La fila permanece oculta hasta que el estado de consultas se sincronice.
    } catch (error) {
      setPendingDeleteKeys((previous) => {
        const next = new Set(previous);
        next.delete(key);
        return next;
      });
      toast?.(apiErrorMessage(error, "No se pudo borrar esta conversación."), "error");
    }
  }

  // Vaciar todo el historial guardado.
  function handleClearHistory() {
    const effectiveId = userId || "ciudadano_anonimo";
    clearMemoryMessages(effectiveId);
    clearLocalHistory();
    setHistoryVersion((v) => v + 1);
    setAnnounce("Historial borrado.");
  }

  // Volver a leer en voz alta la última respuesta del asistente.
  useEffect(() => {
    if (!speechSupported) return;
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    const rec = new SR();
    rec.lang = "es-AR";
    rec.interimResults = true;
    rec.continuous = false;
    rec.onresult = (e) => {
      let txt = "";
      for (let i = 0; i < e.results.length; i++) {
        txt += e.results[i][0].transcript;
      }
      transcriptRef.current = txt;
      setInput(txt);
    };
    rec.onend = () => {
      setListening(false);
      transcriptRef.current = "";
    };
    rec.onerror = () => setListening(false);
    recognitionRef.current = rec;
    return () => {
      try {
        rec.abort();
      } catch {
        /* noop */
      }
    };
  }, [speechSupported]);

  function toggleMic() {
    const rec = recognitionRef.current;
    if (!rec) return;
    if (listening) {
      rec.stop();
      return;
    }
    transcriptRef.current = "";
    setInput("");
    try {
      rec.start();
      setListening(true);
    } catch {
      setListening(false);
    }
  }

  return (
    <div className="chat-window-shell relative flex h-full bg-paper">
      {/* Apartado lateral de historial (pantallas grandes).
          Solo visible para usuarios autenticados. */}
      {isAuthenticated && (
        <aside
          id="chat-history-panel"
          aria-label="Historial de consultas"
          aria-hidden={historyCollapsed}
          className={`hidden lg:block shrink-0 overflow-hidden transition-[width,opacity] duration-300 ease-out motion-reduce:transition-none ${
            historyCollapsed ? "w-0 opacity-0" : "w-72 xl:w-80 opacity-100"
          }`}
        >
          <div className="chat-sidebar-frame h-full w-72 border-r border-line xl:w-80" inert={historyCollapsed}>
            <ChatHistoryPanel
              queries={displayedHistoryQueries}
              onSelect={handleHistorySelect}
              onNewChat={handleResetRequest}
              onDelete={handleDeleteQuery}
              onClearAll={!token ? handleClearHistory : undefined}
              loading={Boolean(token && historyLoading)}
              error={token ? historyError : ""}
            />
          </div>
        </aside>
      )}

      <div className="chat-main flex h-full min-w-0 flex-1 flex-col">
        <Navbar />
        <header className="chat-main-header flex h-14 shrink-0 items-center justify-between gap-2 px-4 sm:px-6">
          <div className="flex items-center gap-2">
            {/* Pantallas chicas: el historial se abre como diálogo. Solo para autenticados. */}
            {isAuthenticated && (
              <button
                type="button"
                onClick={() => setHistoryOpen(true)}
                ref={historyTriggerRef}
                id="chat-history-open-button"
                aria-label="Ver historial de consultas"
                className="lg:hidden inline-flex h-10 items-center gap-2 rounded-xl border border-line bg-paper px-3 text-sm font-semibold text-ink shadow-xs transition-colors hover:bg-mist cursor-pointer"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v5l3 2M3 12a9 9 0 1 0 3-6.7M3 4v4h4" />
                </svg>
                <span>Historial</span>
                {displayedHistoryQueries.length > 0 && (
                  <span className="rounded-full bg-brand/10 text-brand-deep px-1.5 py-0.5 text-[10px] font-bold">
                    {displayedHistoryQueries.length}
                  </span>
                )}
              </button>
            )}

            {/* Pantallas grandes: oculta y muestra el panel lateral. Solo para autenticados. */}
            {isAuthenticated && (
              <button
                type="button"
                onClick={() => setHistoryCollapsed((v) => !v)}
                id="chat-history-toggle-button"
                aria-expanded={!historyCollapsed}
                aria-controls="chat-history-panel"
                aria-label={historyCollapsed ? "Mostrar historial de consultas" : "Ocultar historial de consultas"}
                className="hidden lg:inline-flex h-9 items-center gap-2 rounded-lg border border-line/70 bg-paper/80 px-3 text-xs font-semibold text-muted shadow-xs transition-colors hover:bg-mist hover:text-ink cursor-pointer"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v5l3 2M3 12a9 9 0 1 0 3-6.7M3 4v4h4" />
                </svg>
                <span>{historyCollapsed ? "Mostrar historial" : "Ocultar historial"}</span>
              </button>
            )}
          </div>

          {!isAuthenticated && (
            <button
              type="button"
              onClick={handleResetRequest}
              id="chat-new-conversation-button"
              title="Iniciar un nuevo chat"
              aria-label="Iniciar un nuevo chat"
              className="w-11 h-11 rounded-xl border border-line flex items-center justify-center text-muted hover:text-ink hover:bg-mist transition-colors cursor-pointer"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v6m-3-3h6" />
            </svg>
          </button>
          )}
        </header>

      {/* Región viva: anuncia las respuestas del asistente sin releer todo */}
      <div aria-live="polite" role="status" className="sr-only">
        {announce}
      </div>

      <div
        ref={messagesRef}
        onScroll={handleMessagesScroll}
        className={`chat-message-scroll relative flex min-h-0 flex-1 flex-col overflow-x-hidden overscroll-contain ${
          phase === "chat" ? "overflow-y-auto" : "chat-welcome-scroll overflow-y-auto"
        }`}
      >
        {phase !== "chat" ? (
          <div
            className={`welcome-content flex min-h-max flex-1 flex-col items-center justify-center px-4 py-4 text-center transition-all duration-500 ease-out sm:py-6 ${
              phase === "leaving" ? "opacity-0 scale-95" : "opacity-100 scale-100"
            }`}
          >
            {/* Avatar interactivo de ChatAP grande, sin marco ni fondo, con mirada interactiva */}
            <div className="chat-welcome-avatar relative mb-4 flex select-none items-center justify-center">
              <ChatBotAvatar size={avatarSize} reaction={reaction} followMouse={true} />
            </div>

            {/* Saludo personalizado */}
            <div className="space-y-1 mb-2">
              <p className="text-base sm:text-lg font-medium text-muted font-neue-text m-0">
                {isAuthenticated && user?.name
                  ? `Hola ${user.name.split(" ")[0]},`
                  : "Hola,"}
              </p>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-ink tracking-tight font-neue m-0">
                ¡Bienvenido! ¿En qué te podemos ayudar?
              </h1>
            </div>

            {/* Subtítulo descriptivo */}
            <p className="text-sm sm:text-base text-muted font-neue-text max-w-md mx-auto leading-relaxed mb-3 m-0">
              Estoy para ayudarte con tus gestiones y trámites provinciales. Elegí una de las opciones o escribí directamente lo que necesitás.
            </p>

            {/* Categorías rápidas originales: se conservan sin cambios. */}
            <div id="chatap-pills-container" className="chatap-pills-container">
              {CHATAP_PILLS.filter((pill) => !/transferencia\s+de\s+tierras|acta\s+siniestral/i.test(`${pill.label} ${pill.query}`)).map((pill) => (
                <button
                  key={pill.id}
                  type="button"
                  onClick={() => handleQuickReply(pill.query)}
                  className="chatap-pill-btn"
                >
                  <span className="shrink-0">{pill.icon}</span>
                  <span>{pill.label}</span>
                </button>
              ))}
            </div>

            {/* Trámites concretos, visibles en tarjetas claras y adaptables. */}
            <section className="chatap-popular-procedures" aria-labelledby="chatap-popular-title">
              <div className="chatap-popular-heading">
                <h2 id="chatap-popular-title">Trámites más solicitados</h2>
                <p>Elegí una consulta para ver cómo iniciar la gestión.</p>
              </div>
              <div className="chatap-popular-grid">
                {TRAMITES_SOLICITADOS.filter((tramite) => !/transferencia\s+de\s+tierras|acta\s+siniestral/i.test(`${tramite.title} ${tramite.query}`)).map((tramite, index) => (
                  <button
                    key={tramite.id}
                    type="button"
                    onClick={() => handleQuickReply(tramite.query)}
                    className="chatap-popular-card"
                    aria-label={tramite.query}
                  >
                    <span className="chatap-popular-number" aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
                    <span className="chatap-popular-copy">
                      <span className="chatap-popular-card-title">{tramite.title}</span>
                      <span className="chatap-popular-card-description">{tramite.description}</span>
                    </span>
                    <svg className="chatap-popular-arrow" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <path d="M5 12h14m-6-6 6 6-6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                ))}
              </div>
            </section>
          </div>
        ) : (
          <div className="chat-conversation mx-auto w-full max-w-3xl space-y-6 px-4 py-6 animate-fade-up">
            {messages.map((msg) => (
              <div key={msg.id}>
                {msg.type === "user" && msg.action?.type === "image" && msg.action.dataUrl && (
                  <div className="mb-2 flex justify-end">
                    <figure className="m-0 max-w-[16rem] overflow-hidden rounded-xl border border-line bg-paper">
                      <img
                        src={msg.action.dataUrl}
                        alt={`Imagen adjunta: ${msg.action.fileName}`}
                        className="max-h-52 w-auto max-w-full object-contain"
                      />
                      <figcaption className="truncate px-2 py-1 text-xs text-muted">
                        {msg.action.fileName}
                      </figcaption>
                    </figure>
                  </div>
                )}
                <MessageBubble
                  message={msg}
                  speaking={msg.id === speakingId}
                  typedText={msg.id === speakingId ? typedText : ""}
                  reaction={reaction}
                  onFollowUp={onFollowUp}
                  onChecklist={onChecklist}
                  onRate={onRate}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Barra flotante inferior de consulta */}
      <div className="chat-composer-area shrink-0 bg-transparent p-4 pt-2 sm:pb-6">
        {/* Invitación a iniciar sesión: aparece al pie de forma fluida tras la
            primera respuesta y solo se cierra con la “x”. */}
        {!isAuthenticated && promoReady && !promoDismissed && (
          <div
            className={`max-w-2xl mx-auto mb-3 ${promoLeaving ? "promo-leave" : "promo-enter"}`}
          >
            <div className="flex items-center gap-3 rounded-2xl border border-line bg-mist/70 dark:bg-white/[0.04] px-3.5 py-2.5 sm:px-4 sm:py-3">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-brand-deep text-white" aria-hidden="true">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2l1.8 5.4L19 9l-5.2 1.6L12 16l-1.8-5.4L5 9l5.2-1.6L12 2zm6.5 11l.9 2.6 2.6.9-2.6.9-.9 2.6-.9-2.6-2.6-.9 2.6-.9.9-2.6z" />
                </svg>
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-ink m-0">
                  Obtené respuestas adaptadas a ti
                </p>
                <p className="hidden sm:block text-sm text-muted m-0 mt-0.5">
                  Iniciá sesión para guardar tus conversaciones y hacer seguimiento de tus trámites.
                </p>
              </div>
              <Link
                to="/login"
                className="shrink-0 inline-flex items-center rounded-full bg-brand-deep text-white dark:bg-white dark:text-black text-sm font-semibold px-5 min-h-11 hover:opacity-90 active:scale-[0.98] transition-all no-underline"
              >
                Iniciar sesión
              </Link>
              <button
                type="button"
                onClick={dismissPromo}
                aria-label="Cerrar sugerencia"
                className="shrink-0 grid h-11 w-11 place-items-center rounded-full text-muted hover:text-ink hover:bg-mist transition-colors cursor-pointer"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {imageFile && imagePreview && (
          <div className="mx-auto mb-2 flex max-w-2xl items-center gap-3 rounded-xl border border-line bg-paper px-3 py-2">
            <img
              src={imagePreview}
              alt={`Vista previa de ${imageFile.name}`}
              className="h-12 w-12 shrink-0 rounded-lg object-cover"
            />
            <span className="min-w-0 flex-1 truncate text-sm text-ink">{imageFile.name}</span>
            <button
              type="button"
              onClick={removeSelectedImage}
              aria-label={`Quitar imagen ${imageFile.name}`}
              className="grid h-11 w-11 shrink-0 place-items-center rounded-full text-muted hover:bg-mist hover:text-ink"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>
          </div>
        )}
        {imageError && (
          <p id="chat-image-error" role="alert" className="mx-auto mb-2 max-w-2xl text-sm text-bad">
            {imageError}
          </p>
        )}

        <form id="chat-input-form" onSubmit={handleSend} className="chatap-floating-bar mx-auto max-w-2xl">
          {/* Lupa / búsqueda */}
          <span className="text-muted/70 pl-2 pr-1 flex items-center justify-center shrink-0 pointer-events-none" aria-hidden="true">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </span>

          {/* Input de consulta */}
          <input
            id="chat-here"
            type="text"
            value={input}
            onChange={handleInputChange}
            maxLength={MAX_PREGUNTA}
            placeholder={listening ? "Escuchando tu voz…" : "Escribí tu consulta aquí…"}
            aria-label="Consulta para ChatAP"
            required
          />

          <input
            ref={imageInputRef}
            id="chat-image-upload"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleImageSelect}
            aria-label="Seleccionar una imagen JPEG, PNG o WebP"
            aria-describedby={imageError ? "chat-image-error" : undefined}
            aria-invalid={!!imageError}
            className="sr-only"
          />
          <label
            id="chat-image-button"
            htmlFor="chat-image-upload"
            title="Adjuntar una imagen"
            aria-label="Adjuntar una imagen"
            className="grid min-h-11 min-w-11 cursor-pointer place-items-center rounded-xl p-2 text-muted transition-colors hover:bg-mist hover:text-ink"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12l4-4a3 3 0 114 4l-5 5a5 5 0 01-7-7l5-5" />
            </svg>
          </label>

          {/* Dictado por voz */}
          {speechSupported && (
            <button
              type="button"
              onClick={toggleMic}
              aria-label={listening ? "Detener dictado" : "Hablar con el asistente"}
              aria-pressed={listening}
              title={listening ? "Detener dictado" : "Hablar con el asistente"}
              className={`min-w-11 min-h-11 p-2 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
                listening
                  ? "text-bad bg-bad/10 animate-pulse"
                  : "text-muted hover:text-ink hover:bg-mist"
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <rect x="9" y="3" width="6" height="11" rx="3" strokeWidth={2} />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 11a7 7 0 0014 0M12 18v3m-4 0h8" />
              </svg>
            </button>
          )}

          {/* Botón Enviar */}
          <button
            type="submit"
            disabled={!input.trim() || (!!imageFile && !imagePreview)}
            className={`ml-1 min-w-11 min-h-11 p-2 rounded-xl flex items-center justify-center transition-all ${
              input.trim()
                ? "bg-brand text-white hover:bg-brand-deep cursor-pointer shadow-xs"
                : "bg-transparent text-muted/30 cursor-not-allowed hover:bg-transparent hover:text-muted/30"
            }`}
            aria-label="Enviar consulta"
            aria-disabled={!input.trim() || (!!imageFile && !imagePreview)}
          >
            <svg className="w-4 h-4 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="m5 12l7-7l7 7m-7 7V5" />
            </svg>
          </button>
        </form>
      </div>
      </div>

      {/* Historial móvil: panel lateral de altura completa, con fondo y cierre suave. */}
      {isAuthenticated && (
        <div
          className={`chat-mobile-history-overlay fixed inset-0 z-[100] lg:hidden ${historyOpen ? "pointer-events-auto" : "pointer-events-none"}`}
          aria-hidden={!historyOpen}
        >
          <button
            type="button"
            tabIndex={historyOpen ? 0 : -1}
            onClick={() => setHistoryOpen(false)}
            aria-label="Cerrar historial"
            className={`absolute inset-0 h-full w-full bg-slate-950/45 transition-opacity duration-300 motion-reduce:transition-none ${historyOpen ? "opacity-100" : "opacity-0"}`}
          />
          <aside
            ref={historyDrawerRef}
            id="chat-history-drawer"
            role="dialog"
            aria-modal="true"
            aria-label="Historial de consultas"
            tabIndex={-1}
            inert={!historyOpen}
            className="chat-mobile-history-drawer absolute inset-y-0 left-0 flex h-[100vh] h-[100dvh] w-[min(88vw,22rem)] max-w-full flex-col overflow-hidden border-r border-line bg-paper shadow-2xl" style={{ transform: historyOpen ? "translate3d(0, 0, 0)" : "translate3d(-105%, 0, 0)" }}
          >
            <ChatHistoryPanel
              queries={displayedHistoryQueries}
              onSelect={handleHistorySelect}
              onDelete={handleDeleteQuery}
              onClearAll={!token ? handleClearHistory : undefined}
              loading={Boolean(token && historyLoading)}
              error={token ? historyError : ""}
              onNewChat={handleResetRequest}
              onClose={() => setHistoryOpen(false)}
              closeButtonRef={historyCloseButtonRef}
              className="pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]"
            />
          </aside>
        </div>
      )}

    </div>
  );
}