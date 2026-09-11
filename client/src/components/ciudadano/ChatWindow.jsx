import { useState, useRef, useEffect } from "react";
import MessageBubble from "./MessageBubble";
import ChatBotAvatar from "../ChatBotAvatar";
import { BotReactionController } from "./BotReactionController";
import { botResponses } from "../../data/mockMessages";
import { wizards, wizardLabels } from "../../data/wizard";
import { useChat } from "../../context/ChatContext";
import { useAuth } from "../../context/AuthContext";
import {
  scoreKnowledge,
  relateDocument,
  officeFor,
  officeAction,
  officeInfo,
  documentDownloadAction,
} from "../../lib/knowledgeEngine";
import {
  resolveFollowUp,
  wizardFor,
  buildRelated,
  buildRecoverChips,
} from "../../lib/chatFollowUp";
import {
  rememberMessage,
  rememberAnswer,
  loadMemory,
  buildReminder,
  suggestedTopics,
  detectOffice,
  detectTopic,
  topicLabel,
} from "../../lib/chatMemory";

const KB_STRONG = 3.5;
const KB_WEAK = 1.5;

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

function findIntent(input) {
  const text = input.toLowerCase();
  for (const entry of botResponses) {
    if (entry.keywords.includes("default")) continue;
    for (const kw of entry.keywords) {
      if (text.includes(kw)) {
        return entry;
      }
    }
  }
  return null;
}

function tidyLabel(text) {
  return String(text || "")
    .replace(/^¿/, "")
    .replace(/\?+$/, "")
    .trim();
}

function isErrorText(text) {
  return /no encontr|no disponible|error|no se pudo|no tengo/.test((text || "").toLowerCase());
}

/**
 * Resuelve una consulta del ciudadano con prioridad:
 * 1) intent exacto, 2) base de conocimiento, 3) null (se resuelve después).
 */
function resolveResponse(userText) {
  const kb = scoreKnowledge(userText);
  const intent = findIntent(userText);

  if (intent) {
    const r = intent.response;
    const interactive = Boolean(r.action || r.reaction);
    const bypassSecurity =
      r.reaction === "worried" &&
      /olvid|recuperar|resetear|restablecer/i.test(userText);

    if (!bypassSecurity) {
      if (interactive) {
        // Si el intent es una descarga genérica pero hay un artículo muy
        // específico, ganamos precisión con el conocimiento.
        if (kb && kb.score >= KB_STRONG && r.action?.type === "download") {
          return { kind: "knowledge", article: kb.article };
        }
        return { kind: "intent", entry: intent, query: userText };
      }
      if (kb && kb.score >= KB_WEAK) {
        return { kind: "knowledge", article: kb.article };
      }
      return { kind: "intent", entry: intent, query: userText };
    }
  }

  if (kb && kb.score >= KB_WEAK) {
    return { kind: "knowledge", article: kb.article };
  }
  return null;
}

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
  const messagesRef = useRef(null);
  const recognitionRef = useRef(null);
  const transcriptRef = useRef("");
  const startedRef = useRef(false);
  const speakingRef = useRef(false);
  const speakingIdRef = useRef(null);
  const typeTimerRef = useRef(0);
  const controllerRef = useRef(null);
  const typingTimerRef = useRef(null);
  const greetedRef = useRef(false);
  const ctxRef = useRef({ officeData: null });
  const wizardRef = useRef(null);
  const [welcomeMem, setWelcomeMem] = useState(null);

  const [speechSupported] = useState(
    () =>
      typeof window !== "undefined" &&
      !!(window.SpeechRecognition || window.webkitSpeechRecognition)
  );

  useEffect(() => {
    const el = messagesRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [messages, isTyping, phase, typedText]);

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
  useEffect(() => {
    if (initialQuery && !initialQueryHandled.current) {
      initialQueryHandled.current = true;
      const timer = setTimeout(() => {
        sendText(initialQuery);
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

  function buildChipsAction(options) {
    if (!options || options.length === 0) return null;
    return {
      type: "chips",
      title: "También te puede servir:",
      options: options.map((o) => ({ label: o.label, value: o.value ?? o.label })),
    };
  }

  function simulateBotResponse(userText) {
    setIsTyping(false);
    clearInterval(typingTimerRef.current);

    controllerRef.current?.onEvent("botThinking");
    const delay = 900 + Math.random() * 800;
    setTimeout(() => {
      clearInterval(typeTimerRef.current);

      const mem = userId ? loadMemory(userId) : null;
      const topic = detectTopic(userText);
      const resolved = resolveResponse(userText);

      let finalText;
      let finalActions;
      let ctx;
      let isClarification = false;

      if (resolved?.kind === "knowledge") {
        const article = resolved.article;
        finalText = article.answer;
        const actions = [];

        const doc = relateDocument(`${article.question} ${article.answer}`);
        if (doc) actions.push(documentDownloadAction(doc, article));

        const officeName = officeFor(`${article.question} ${article.answer}`);
        const oa = officeName ? officeAction(officeName) : null;
        if (oa) actions.push(oa);

        const wz = wizardFor(`${article.question} ${article.answer}`);
        if (wz) {
          actions.push({ type: "wizard", wizardId: wz.id, label: wizardLabels()[wz.id] });
        }
        const relatedAction = buildChipsAction(
          buildRelated({ kind: "knowledge", category: article.category, articleId: article.id })
        );
        if (relatedAction) actions.push(relatedAction);

        finalActions = actions;
        ctx = {
          kind: "knowledge",
          category: article.category,
          articleId: article.id,
          label: tidyLabel(article.question),
          officeData: officeName
            ? { name: officeName, ...officeInfo(officeName) }
            : null,
        };
      } else if (resolved?.kind === "intent") {
        const r = resolved.entry.response;
        const actions = r.action ? [r.action] : [];
        finalText = r.text;

        const wk = wizardFor(userText);
        if (wk) {
          actions.push({ type: "wizard", wizardId: wk.id, label: wizardLabels()[wk.id] });
        }
        const relatedIntentAction = buildChipsAction(
          buildRelated({ kind: "intent", topic })
        );
        if (relatedIntentAction) actions.push(relatedIntentAction);

        finalActions = actions.length ? actions : null;
        const officeName =
          r.action?.type === "location"
            ? detectOffice(`${r.action.place} ${r.action.address}`)
            : null;
        ctx = {
          kind: "intent",
          topic,
          label: topic ? topicLabel(topic) : resolved.entry.keywords[0],
          officeData: officeName
            ? {
                name: officeName,
                place: r.action.place,
                address: r.action.address,
                hours: r.action.hours,
              }
            : null,
        };
      } else {
        const followUp = resolveFollowUp(userText, ctxRef.current);
        if (followUp) {
          finalText = followUp.text;
          finalActions = [followUp.action];
          ctx = { ...ctxRef.current };
        } else if (mem?.lastAnswer?.label) {
          finalText = `No entendí del todo la consulta, pero vi que la última vez preguntabas sobre "${mem.lastAnswer.label}". ¿Retomamos eso?`;
          finalActions = buildChipsAction(suggestedTopics(mem).map((s) => ({ label: s.label, value: s.query })));
          ctx = { kind: "memory", suggested: suggestedTopics(mem), officeData: null };
          isClarification = true;
        } else if (mem?.lastTopic) {
          finalText = `No entendí del todo la consulta, pero veo que la última vez estabas viendo ${topicLabel(
            mem.lastTopic
          )}. ¿Retomamos eso?`;
          finalActions = buildChipsAction(
            suggestedTopics(mem).map((s) => ({ label: s.label, value: s.query }))
          );
          ctx = { kind: "memory", suggested: suggestedTopics(mem), officeData: null };
          isClarification = true;
        } else {
          finalText = "No entendí la consulta. ¿Podés reescribirla con otras palabras? O elegí una opción para empezar:";
          finalActions = { type: "chips", options: buildRecoverChips() };
          ctx = { kind: "default", officeData: null };
          isClarification = true;
        }
      }

      // Si el usuario está autenticado, en su primer mensaje de la sesión el
      // bot lo reconoce por su nombre y/o le recuerda lo que venía haciendo.
      if (
        isAuthenticated &&
        user?.name &&
        !greetedRef.current &&
        !isErrorText(finalText) &&
        !isClarification &&
        resolved?.kind !== "knowledge"
      ) {
        greetedRef.current = true;
        const firstName = user.name.split(" ")[0];
        const reminder = mem && mem.count > 0 ? buildReminder(mem, user.name) : null;
        if (reminder) {
          finalText = reminder + " " + finalText.charAt(0).toLowerCase() + finalText.slice(1);
        } else if (!/^(hola|buenas|buen)/i.test(finalText)) {
          finalText = `Claro, ${firstName}. ` + finalText.charAt(0).toLowerCase() + finalText.slice(1);
        }
      }

      const id = addMessage("bot", finalText, finalActions);
      const long = finalText.length > 240;
      const charStep = long ? 2 : 1;
      const charDelay = long ? 16 : 24;

      speakingRef.current = true;
      speakingIdRef.current = id;
      setSpeakingId(id);
      setTypedText("");

      // Pasamos la respuesta completa al controller para que detecte el tono
      const intentReaction =
        resolved?.kind === "intent" ? resolved.entry.response.reaction : undefined;
      controllerRef.current?.onEvent("botResponding", {
        text: finalText,
        reaction: intentReaction,
      });

      if (intentReaction) {
        controllerRef.current?.onEvent("botConcern", intentReaction);
      }

      ctxRef.current = ctx || { officeData: null };
      if (userId) {
        rememberAnswer(userId, {
          label: (ctx && ctx.label) || (resolved?.kind === "knowledge" ? tidyLabel(resolved.article.question) : null),
          topic,
          category: ctx?.category ?? null,
          kind: resolved?.kind ?? ctx?.kind ?? "default",
        });
      }

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

            // Si no hubo error, celebración sutil
            if (!isErrorText(finalText) && !intentReaction) {
              controllerRef.current?.onEvent("botSuccess");
            } else {
              controllerRef.current?.onEvent("botFinished");
            }
          }, 550);
        }
      }, charDelay);
    }, delay);
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
    simulateBotResponse(t);
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
    const final = flow.steps[flow.steps.length - 1];
    const summary = final.summary(w.data);

    const actions = [];
    const doc = relateDocument(flow.downloadText);
    if (doc) {
      actions.push(
        documentDownloadAction(doc, {
          question: flow.title,
          answer: summary,
          category: "Trámites",
        })
      );
    }
    const oa = officeAction(flow.office);
    if (oa) actions.push(oa);

    addMessage("bot", summary, actions.length ? actions : null);
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
    startedRef.current = false;
    greetedRef.current = false;
    wizardRef.current = null;
    ctxRef.current = { officeData: null };
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
        {/* Menú de opciones (9 puntos) */}
        <button
          type="button"
          onClick={resetConversation}
          title="Reiniciar y ver opciones"
          aria-label="Reiniciar y ver opciones"
          className="w-9 h-9 rounded-xl border border-line flex items-center justify-center text-muted hover:text-ink hover:bg-mist transition-colors cursor-pointer"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="5" cy="5" r="2" />
            <circle cx="12" cy="5" r="2" />
            <circle cx="19" cy="5" r="2" />
            <circle cx="5" cy="12" r="2" />
            <circle cx="12" cy="12" r="2" />
            <circle cx="19" cy="12" r="2" />
            <circle cx="5" cy="19" r="2" />
            <circle cx="12" cy="19" r="2" />
            <circle cx="19" cy="19" r="2" />
          </svg>
        </button>

        {/* Botón Cerrar / Nueva Conversación */}
        <button
          type="button"
          onClick={resetConversation}
          title="Nueva conversación"
          aria-label="Nueva conversación"
          className="w-9 h-9 rounded-xl border border-line flex items-center justify-center text-muted hover:text-ink hover:bg-mist transition-colors cursor-pointer"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </header>

      <div ref={messagesRef} className="flex-1 overflow-y-auto relative flex flex-col">
        {phase !== "chat" ? (
          <div
            className={`welcome-content flex-1 flex flex-col items-center justify-center px-4 py-8 text-center transition-all duration-300 ease-out ${
              phase === "leaving" ? "opacity-0 scale-95" : "opacity-100 scale-100"
            }`}
          >
            {/* Avatar interactivo de ChatAP grande, sin marco ni fondo, con mirada interactiva */}
            <div className="mb-4 relative flex items-center justify-center select-none">
              <ChatBotAvatar size={92} reaction={reaction} followMouse={true} />
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
            <p className="text-xs sm:text-sm text-muted font-neue-text max-w-md mx-auto leading-relaxed mb-6 m-0">
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
        <form onSubmit={handleSend} className="chatap-floating-bar max-w-2xl mx-auto">
          {/* Lupa / búsqueda */}
          <span className="text-muted/70 pl-2 pr-1 flex items-center justify-center shrink-0 pointer-events-none" aria-hidden="true">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </span>

          {/* Input de consulta */}
          <input
            type="text"
            value={input}
            onChange={handleInputChange}
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
              title={listening ? "Detener dictado" : "Hablar con el asistente"}
              className={`p-2 rounded-xl transition-all cursor-pointer ${
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
            className={`ml-1 p-2 rounded-xl flex items-center justify-center transition-all ${
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