import { useState, useRef, useEffect } from "react";
import MessageBubble from "./MessageBubble";
import QuickReplies from "./QuickReplies";
import ChatBotAvatar from "../ChatBotAvatar";
import { BotReactionController } from "./BotReactionController";
import { botResponses } from "../../data/mockMessages";

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

export default function ChatWindow() {
  const [messages, setMessages] = useState([]);
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

  const [speechSupported] = useState(
    () =>
      typeof window !== "undefined" &&
      !!(window.SpeechRecognition || window.webkitSpeechRecognition)
  );

  useEffect(() => {
    const el = messagesRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [messages, isTyping, phase, typedText]);

  // Controlador único de reacciones del avatar (historial, cooldown, contexto).
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
    return () => {
      controller.stop();
      controllerRef.current = null;
    };
  }, []);

  function beginChat() {
    if (startedRef.current) return;
    startedRef.current = true;
    setPhase("leaving");
    setTimeout(() => setPhase("chat"), 480);
  }

  function addMessage(type, text, action = null) {
    const msg = {
      id: Date.now(),
      type,
      text,
      action,
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, msg]);
    return msg.id;
  }

  function simulateBotResponse(userText) {
    setIsTyping(false);
    // El bot empieza a procesar la pregunta.
    controllerRef.current?.onEvent("botThinking");
    const delay = 900 + Math.random() * 800;
    setTimeout(() => {
      // Limpia hablas anteriores que pudieran quedar colgadas.
      clearInterval(typeTimerRef.current);

      const response = findResponse(userText);
      const id = addMessage("bot", response.text, response.action);
      const long = response.text.length > 240;
      const charStep = long ? 2 : 1;
      const charDelay = long ? 16 : 24;

      speakingRef.current = true;
      speakingIdRef.current = id;
      setSpeakingId(id);
      setTypedText("");
      // El bot "habla": reacción de respuesta (atención / movimiento positivo).
      controllerRef.current?.onEvent("botResponding");
      if (response.reaction) controllerRef.current?.onEvent("botConcern", response.reaction);

      // Typewriter: el texto se escribe solo, fluido, mientras el avatar "habla".
      let i = 0;
      typeTimerRef.current = setInterval(() => {
        if (speakingIdRef.current !== id) {
          clearInterval(typeTimerRef.current);
          return;
        }
        i += charStep;
        setTypedText(response.text.slice(0, i));
        if (i >= response.text.length) {
          clearInterval(typeTimerRef.current);
          // Pausa breve al terminar de escribir y luego vuelve a reposo.
          setTimeout(() => {
            if (speakingIdRef.current !== id) return;
            speakingRef.current = false;
            speakingIdRef.current = null;
            setSpeakingId(null);
            setTypedText("");
            controllerRef.current?.onEvent("botFinished");
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
    // El bot percibe la pregunta.
    controllerRef.current?.onEvent("userMessageSent");
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
  }

  function handleQuickReply(query) {
    sendText(query);
  }

  function resetConversation() {
    clearInterval(typeTimerRef.current);
    setMessages([]);
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
      // Dejamos el texto transcrito en el input para que el usuario lo revise
      // y lo envíe manualmente (no se manda solo).
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
      <header className="flex items-center px-4 sm:px-6 h-14 border-b border-line">
        <div
          role="button"
          tabIndex={0}
          onClick={resetConversation}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") resetConversation();
          }}
          className="group flex h-9 w-9 cursor-pointer items-center overflow-hidden rounded-xl border border-line text-muted transition-all duration-300 hover:w-44 hover:bg-mist hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
          aria-label="Nueva conversación"
        >
          <span className="grid h-9 w-9 flex-shrink-0 place-items-center">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M5 5h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-4 4v-4H5a2 2 0 01-2-2V7a2 2 0 012-2z" />
            </svg>
          </span>
          <span className="whitespace-nowrap pr-3 text-xs font-semibold opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-focus-visible:opacity-100">
            Nueva conversación
          </span>
        </div>
      </header>

      <div ref={messagesRef} className="flex-1 overflow-y-auto relative">
        {phase !== "chat" && (
          <div
            className={`absolute inset-0 flex flex-col items-center justify-center px-4 text-center gap-5 transition-all duration-500 ease-out ${
              phase === "leaving" ? "opacity-0 scale-95" : "opacity-100 scale-100"
            }`}
          >
            <ChatBotAvatar size={72} />
            <h1 className="text-2xl sm:text-3xl font-semibold text-ink m-0">
              ¿En qué puedo ayudarte?
            </h1>
            <p className="text-muted max-w-md m-0">
              Soy ChatAP, el asistente virtual de la Administración Pública.
              Consultá trámites, documentación y servicios.
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

      <div className="border-t border-line bg-paper">
        {phase === "welcome" && (
          <div className="max-w-3xl mx-auto px-4 pt-4">
            <QuickReplies onSelect={handleQuickReply} />
          </div>
        )}
        <form onSubmit={handleSend} className="max-w-3xl mx-auto flex items-end gap-2 p-4">
          {speechSupported && (
            <button
              type="button"
              onClick={toggleMic}
              aria-label={listening ? "Detener dictado" : "Hablar con el asistente"}
              className={`relative shrink-0 w-12 h-12 flex items-center justify-center rounded-2xl border transition-all active:scale-95 ${
                listening
                  ? "border-bad text-bad bg-bad/10"
                  : "border-line text-muted hover:text-ink hover:border-muted"
              }`}
            >
              {listening ? (
                <>
                  <span className="mic-ripple absolute inset-0 rounded-2xl bg-bad/40" aria-hidden="true" />
                  <span className="mic-eq relative text-bad" aria-hidden="true">
                    <span />
                    <span />
                    <span />
                    <span />
                  </span>
                </>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 10v2a7 7 0 01-14 0v-2M12 19v4M8 23h8" />
                </svg>
              )}
            </button>
          )}
          <input
            type="text"
            value={input}
            onChange={handleInputChange}
            placeholder={listening ? "Escuchando…" : "Escribí tu consulta…"}
            className="flex-1 rounded-2xl border border-line bg-soft px-4 py-3 text-sm text-ink placeholder:text-muted outline-none focus:border-brand transition-colors"
            aria-label="Mensaje"
          />
          <button
            type="submit"
            disabled={!input.trim()}
            className="rounded-2xl bg-brand-deep px-5 py-3 text-sm font-semibold text-paper hover:bg-brand transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Enviar
          </button>
        </form>
      </div>
    </div>
  );
}
