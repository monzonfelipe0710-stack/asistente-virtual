import { useState, useRef, useEffect } from "react";
import MessageBubble from "./MessageBubble";
import QuickReplies from "./QuickReplies";
import ChatBotAvatar from "../ChatBotAvatar";
import { BotReactionController } from "./BotReactionController";
import { botResponses } from "../../data/mockMessages";
import { useChat } from "../../context/ChatContext";
import { useAuth } from "../../context/AuthContext";

function findResponse(input) {
  const text = input.toLowerCase();
  for (const entry of botResponses) {
    for (const kw of entry.keywords) {
      if (text.includes(kw)) {
        return entry.response;
      }
    }
  }
  return botResponses.find((e) => e.keywords.includes("default")).response;
}

function isErrorResponse(response) {
  const text = (response?.text || "").toLowerCase();
  return /no encontr|no disponible|error|no se pudo|no tengo/.test(text);
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

  function beginChat() {
    if (startedRef.current) return;
    startedRef.current = true;
    setPhase("leaving");
    setTimeout(() => setPhase("chat"), 480);
  }

  function simulateBotResponse(userText) {
    setIsTyping(false);
    clearInterval(typingTimerRef.current);

    controllerRef.current?.onEvent("botThinking");
    const delay = 900 + Math.random() * 800;
    setTimeout(() => {
      clearInterval(typeTimerRef.current);

      const response = findResponse(userText);
      // Si el usuario está autenticado, en su primer mensaje de la sesión el
      // bot lo reconoce por su nombre de forma natural.
      let botText = response.text;
      if (isAuthenticated && user?.name && !greetedRef.current && !isErrorResponse(response)) {
        greetedRef.current = true;
        const firstName = user.name.split(" ")[0];
        if (!/^(hola|buenas|buen)/i.test(botText)) {
          botText = `Claro, ${firstName}. ` + botText.charAt(0).toLowerCase() + botText.slice(1);
        }
      }
      const id = addMessage("bot", botText, response.action);
      const long = botText.length > 240;
      const charStep = long ? 2 : 1;
      const charDelay = long ? 16 : 24;

      speakingRef.current = true;
      speakingIdRef.current = id;
      setSpeakingId(id);
      setTypedText("");

      // Pasamos la respuesta completa al controller para que detecte el tono
      controllerRef.current?.onEvent("botResponding", response);

      // Reacción de concern si la respuesta tiene reaction explícita
      if (response.reaction) {
        controllerRef.current?.onEvent("botConcern", response.reaction);
      }

      let i = 0;
      typeTimerRef.current = setInterval(() => {
        if (speakingIdRef.current !== id) {
          clearInterval(typeTimerRef.current);
          return;
        }
        i += charStep;
        setTypedText(botText.slice(0, i));
        if (i >= botText.length) {
          clearInterval(typeTimerRef.current);
          setTimeout(() => {
            if (speakingIdRef.current !== id) return;
            speakingRef.current = false;
            speakingIdRef.current = null;
            setSpeakingId(null);
            setTypedText("");

            // Si no hubo error, celebración sutil
            if (!isErrorResponse(response) && !response.reaction) {
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
          className="group flex h-9 w-9 cursor-pointer items-center justify-end overflow-hidden rounded-xl border border-line text-muted transition-all duration-300 hover:w-44 hover:bg-mist hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
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
            className={`welcome-content absolute inset-0 flex flex-col items-center justify-center px-4 text-center gap-5 transition-all duration-500 ease-out ${
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
                ? " Recordá tus consultas anteriores: continuá donde lo dejaste."
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
              />
            ))}
          </div>
        )}
      </div>

      <div className="bg-paper">
        {phase === "welcome" && (
          <div className="max-w-3xl mx-auto px-4 pt-4">
            <QuickReplies onSelect={handleQuickReply} />
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