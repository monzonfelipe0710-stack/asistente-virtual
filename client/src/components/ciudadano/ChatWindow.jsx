import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import MessageBubble from "./MessageBubble";
import ChatBotAvatar from "../ChatBotAvatar";
import { BotReactionController } from "./BotReactionController";
import { wizards, wizardLabels } from "../../data/wizard";
import { preguntar } from "../../services/chat";
import { useChat } from "../../context/ChatContext";
import { useAuth } from "../../context/AuthContext";
import {
  rememberMessage,
  rememberAnswer,
  loadMemory,
  buildReminder,
  suggestedTopics,
  detectTopic,
} from "../../lib/chatMemory";

const MAX_PREGUNTA = 500;

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

export default function ChatWindow({ initialQuery = null }) {
  const { messages, addMessage, clearHistory } = useChat();
  const { user, isAuthenticated } = useAuth();
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [phase, setPhase] = useState("welcome");
  const [listening, setListening] = useState(false);
  const [speakingId, setSpeakingId] = useState(null);
  const [typedText, setTypedText] = useState("");
  const [reaction, setReaction] = useState("idle");
  const [announce, setAnnounce] = useState("");
  const messagesRef = useRef(null);
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

  const [speechSupported] = useState(
    () =>
      typeof window !== "undefined" &&
      !!(window.SpeechRecognition || window.webkitSpeechRecognition)
  );

  // Tamaño del avatar adaptable a la altura de pantalla para que la bienvenida
  // entre completa, sin scroll y sin quedar tapada por las barras.
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

  // Auto-scroll: solo en el chat y si el usuario ya estaba cerca del final.
  // No arrebata el scroll mientras lee mensajes anteriores.
  useEffect(() => {
    if (phase !== "chat") return;
    if (!nearBottomRef.current) return;
    const el = messagesRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
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

  // Memoria: cargamos el contexto del usuario para personalizar la bienvenida.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setWelcomeMem(userId ? loadMemory(userId) : null);
  }, [userId]);

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
  function presentBotMessage(finalText, finalActions, { error = false } = {}) {
    setIsTyping(false);
    clearInterval(typingTimerRef.current);

    const id = addMessage("bot", finalText, finalActions || undefined);

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

    const long = finalText.length > 240;
    const charStep = long ? 2 : 1;
    const charDelay = long ? 16 : 24;

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

  async function respondTo(userText) {
    setIsTyping(true);
    controllerRef.current?.onEvent("botThinking");

    let finalText;
    let finalActions = null;
    let error = false;

    try {
      const data = await preguntar(userText.slice(0, MAX_PREGUNTA));
      finalText =
        String(data?.respuesta || "").trim() ||
        "No pude generar una respuesta. Probá reformulando la consulta.";

      const tramites = Array.isArray(data?.tramitesEncontrados)
        ? data.tramitesEncontrados.filter((t) => t?.nombre)
        : [];
      if (tramites.length) {
        finalActions = [
          {
            type: "chips",
            title: "Trámites relacionados:",
            options: tramites.map((t) => ({ label: t.nombre, value: t.nombre })),
          },
        ];
      }
    } catch (err) {
      error = true;
      const status = err?.response?.status;
      if (status === 429) {
        finalText =
          "Estás consultando muy seguido. Esperá unos segundos y volvé a intentar.";
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
      const mem = userId ? loadMemory(userId) : null;
      const firstName = user.name.split(" ")[0];
      const reminder = mem && mem.count > 0 ? buildReminder(mem, user.name) : null;
      if (reminder) {
        finalText = reminder + " " + finalText.charAt(0).toLowerCase() + finalText.slice(1);
      } else if (!/^(hola|buenas|buen)/i.test(finalText)) {
        finalText = `Claro, ${firstName}. ` + finalText.charAt(0).toLowerCase() + finalText.slice(1);
      }
    }

    if (userId) {
      rememberAnswer(userId, {
        label: userText,
        topic: detectTopic(userText),
        kind: error ? "error" : "chat",
      });
    }

    presentBotMessage(finalText, finalActions, { error });
  }

  function sendText(text) {
    const t = (text ?? "").trim();
    if (!t) return;
    beginChat();
    addMessage("user", t);
    if (wizardRef.current) {
      runWizardStep(t);
      return;
    }
    if (userId) rememberMessage(userId, t);
    // Pasamos el texto del usuario para que el controller detecte contexto
    controllerRef.current?.onEvent("userMessageSent", { text: t });
    respondTo(t);
  }

  function handleSend(e) {
    e?.preventDefault();
    const t = input;
    setInput("");
    sendText(t);
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
    respondTo(pregunta);
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
    setPhase("welcome");
    if (messagesRef.current) messagesRef.current.scrollTop = 0;
    startedRef.current = false;
    greetedRef.current = false;
    wizardRef.current = null;
    nearBottomRef.current = true;
    setAnnounce("");
  }

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
    <div className="flex flex-col h-full bg-paper relative">
      <header className="flex items-center justify-end px-4 sm:px-6 h-14 shrink-0 gap-2">
        {/* Reiniciar el chat (ícono de mensaje nuevo) */}
        <button
          type="button"
          onClick={resetConversation}
          title="Reiniciar el chat"
          aria-label="Reiniciar el chat"
          className="w-11 h-11 rounded-xl border border-line flex items-center justify-center text-muted hover:text-ink hover:bg-mist transition-colors cursor-pointer"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v6m-3-3h6" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
          </svg>
        </button>

      </header>

      {/* Región viva: anuncia las respuestas del asistente sin releer todo */}
      <div aria-live="polite" role="status" className="sr-only">
        {announce}
      </div>

      <div
        ref={messagesRef}
        onScroll={handleMessagesScroll}
        className={`flex-1 min-h-0 relative flex flex-col overscroll-contain ${
          phase === "chat"
            ? "overflow-y-auto"
            : "chat-welcome-scroll overflow-hidden"
        }`}
      >
        {phase !== "chat" ? (
          <div
            className={`welcome-content flex-1 min-h-max flex flex-col items-center justify-center px-4 py-4 sm:py-6 text-center transition-all duration-300 ease-out ${
              phase === "leaving" ? "opacity-0 scale-95" : "opacity-100 scale-100"
            }`}
          >
            {/* Avatar interactivo de ChatAP grande, sin marco ni fondo, con mirada interactiva */}
            <div className="mb-4 relative flex items-center justify-center select-none">
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
            <p className="text-sm sm:text-base text-muted font-neue-text max-w-md mx-auto leading-relaxed mb-6 m-0">
              Estoy para ayudarte con tus gestiones y trámites provinciales. Elegí una de las opciones o escribí directamente lo que necesitás.
            </p>

            {/* Botones de consulta rápida tipo Píldoras (2 filas de 3) */}
            <div className="chatap-pills-container">
              {CHATAP_PILLS.map((pill) => (
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

            {/* Asistencias guiadas paso a paso */}
            <div className="mt-4 flex flex-wrap items-center justify-center gap-2 animate-fade-in">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted">
                Asistencias guiadas:
              </span>
              {Object.entries(wizardLabels()).map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => startWizard(id)}
                  className="bubble-chip"
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Continuar consulta previa si existe */}
            {welcomeMem && welcomeMem.count > 0 && (
              <div className="mt-4 text-xs text-muted font-neue-text flex items-center justify-center gap-1.5 animate-fade-in">
                <span>Continuá tu última consulta:</span>
                <button
                  type="button"
                  onClick={() => handleQuickReply(suggestedTopics(welcomeMem)[0]?.query || "")}
                  className="text-brand font-semibold hover:underline cursor-pointer bg-transparent border-0 p-0"
                >
                  {suggestedTopics(welcomeMem)[0]?.label}
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="max-w-3xl w-full mx-auto px-4 py-6 space-y-6 animate-fade-up">
            {messages.map((msg) => (
              <MessageBubble
                key={msg.id}
                message={msg}
                speaking={msg.id === speakingId}
                typedText={msg.id === speakingId ? typedText : ""}
                reaction={reaction}
                onFollowUp={handleFollowUp}
              />
            ))}
          </div>
        )}
      </div>

      {/* Barra flotante inferior de consulta */}
      <div className="p-4 sm:pb-6 pt-2 bg-transparent shrink-0">
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

        <form onSubmit={handleSend} className="chatap-floating-bar max-w-2xl mx-auto">
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
            disabled={!input.trim()}
            className={`ml-1 min-w-11 min-h-11 p-2 rounded-xl flex items-center justify-center transition-all ${
              input.trim()
                ? "bg-brand text-white hover:bg-brand-deep cursor-pointer shadow-xs"
                : "text-muted/40 cursor-not-allowed opacity-0 pointer-events-none w-0 p-0 overflow-hidden"
            }`}
            aria-label="Enviar consulta"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="m5 12l7-7l7 7m-7 7V5" />
            </svg>
          </button>
        </form>
      </div>
    </div>
  );
}