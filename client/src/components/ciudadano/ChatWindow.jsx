import { useState, useRef, useEffect } from "react";
import MessageBubble from "./MessageBubble";
import QuickReplies from "./QuickReplies";
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

export default function ChatWindow() {
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
    <div className="flex flex-col h-full bg-paper">
      <header className="flex items-center justify-end px-4 sm:px-6 h-14">
        <div
          role="button"
          tabIndex={0}
          onClick={resetConversation}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") resetConversation();
          }}
          className="group flex h-9 w-9 cursor-pointer items-center justify-end overflow-hidden rounded-xl border border-line text-muted transition-all duration-200 hover:w-44 hover:bg-mist hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
          aria-label="Nueva conversación"
        >
          <span className="order-2 grid h-9 w-9 shrink-0 place-items-center">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M5 5h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-4 4v-4H5a2 2 0 01-2-2V7a2 2 0 012-2z" />
            </svg>
          </span>
          <span className="order-1 whitespace-nowrap pl-3 text-xs font-semibold opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-focus-visible:opacity-100">
            Nueva conversación
          </span>
        </div>
      </header>

      <div ref={messagesRef} className="flex-1 overflow-y-auto relative">
        {phase !== "chat" && (
          <div
            className={`welcome-content absolute inset-0 flex flex-col items-center justify-center px-4 text-center gap-5 transition-all duration-300 ease-out ${
              phase === "leaving" ? "opacity-0 scale-95" : "opacity-100 scale-100"
            }`}
          >
            <ChatBotAvatar size={60} reaction={reaction} />
            <h1 className="text-2xl sm:text-3xl font-semibold text-ink m-0">
              {isAuthenticated && user?.name
                ? `¡Hola, ${user.name.split(" ")[0]}! ¿En qué puedo ayudarte?`
                : "¿En qué puedo ayudarte?"}
            </h1>
            <p className="text-muted max-w-md m-0">
              Soy ChatAP, el asistente virtual de la Administración Pública.
              {isAuthenticated
                ? welcomeMem && welcomeMem.count > 0
                  ? ` ${buildReminder(welcomeMem)}`
                  : " Recordá tus consultas anteriores: continuá donde lo dejaste."
                : " Consultá trámites, documentación y servicios."}
            </p>
          </div>
        )}

        {phase === "chat" && (
          <div className="max-w-3xl mx-auto px-4 py-6 space-y-6 animate-fade-up">
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

      <div className="bg-paper">
        {phase === "welcome" && (
          <div className="max-w-3xl mx-auto px-4 pt-4">
            <QuickReplies
              onSelect={handleQuickReply}
              suggested={welcomeMem && welcomeMem.count > 0 ? suggestedTopics(welcomeMem) : []}
            />
          </div>
        )}
        <form onSubmit={handleSend} className="container-ia-chat max-w-3xl mx-auto">
          <input
            type="text"
            value={input}
            onChange={handleInputChange}
            placeholder={listening ? "Escuchando…" : "Escribí tu consulta…"}
            className="input-text"
            aria-label="Mensaje"
            required
          />
          {speechSupported && (
            <button
              type="button"
              onClick={toggleMic}
              aria-label={listening ? "Detener dictado" : "Hablar con el asistente"}
              title={listening ? "Detener dictado" : "Hablar con el asistente"}
              className={`label-voice ${
                listening
                  ? "is-listening"
                  : ""
              }`}
            >
              {listening ? (
                <>
                  <span className="mic-ripple absolute inset-0 rounded-full bg-bad/30" aria-hidden="true" />
                  <svg className="icon-voice icon-voice-listening" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <rect x="9" y="3" width="6" height="11" rx="3" strokeWidth={2} />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 11a7 7 0 0014 0M12 18v3m-4 0h8" />
                  </svg>
                  <span className="text-voice" aria-hidden="true">
                    Conversación iniciada · presioná para cancelar
                  </span>
                </>
              ) : (
                <svg className="icon-voice icon-voice-idle" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <rect x="9" y="3" width="6" height="11" rx="3" strokeWidth={2} />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 11a7 7 0 0014 0M12 18v3m-4 0h8" />
                </svg>
              )}
            </button>
          )}
          <button
            type="submit"
            disabled={!input.trim()}
            className="label-text"
            aria-label="Enviar mensaje"
          >
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m5 12l7-7l7 7m-7 7V5" />
            </svg>
          </button>
        </form>
      </div>
    </div>
  );
}