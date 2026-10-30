import { useEffect, useRef, useState } from "react";
import ChatBotAvatar from "../ChatBotAvatar";
import MessageBubble from "../ciudadano/MessageBubble";

// Recorrido ilustrativo: consulta de un trámite, envío de una captura,
// orientación contextual y una consulta que requiere más información.
const CONVERSATION = [
  {
    id: "demo-user-1",
    type: "user",
    text: "Hola, necesito saber si mi trámite está bien presentado.",
    attachment: false,
  },
  {
    id: "demo-bot-1",
    type: "bot",
    text: "¡Hola! Claro que sí. Podés contarme de qué trámite se trata o compartir una captura para que pueda orientarte mejor.",
  },
  {
    id: "demo-user-2",
    type: "user",
    text: "Te comparto la captura que me aparece.",
    attachment: true,
  },
  {
    id: "demo-bot-2",
    type: "bot",
    text: "Gracias por compartirla. Puedo ayudarte a interpretar la información visible y orientarte sobre los próximos pasos. Para confirmar el estado oficial del expediente, vas a necesitar consultarlo en la mesa de entrada correspondiente.",
  },
  {
    id: "demo-user-3",
    type: "user",
    text: "¿Y qué documentación necesito para la licencia anual?",
  },
  {
    id: "demo-bot-3",
    type: "bot",
    text: "Puedo orientarte sobre la Licencia anual ordinaria. Los requisitos y la documentación dependen de la información publicada para ese trámite. Si querés, podemos revisar juntos los datos disponibles antes de que inicies la gestión.",
  },
  {
    id: "demo-user-4",
    type: "user",
    text: "También necesito un certificado. ¿Cuál debería pedir?",
  },
  {
    id: "demo-bot-4",
    type: "bot",
    text: "Hay distintas opciones según lo que necesites acreditar. ¿Buscás el Certificado de servicios o la Constancia de trabajo?",
  },
];

function AttachmentPreview() {
  return (
    <div className="home-chat-preview__attachment" role="img" aria-label="Captura ilustrativa de una pantalla de trámite adjunta">
      <div className="home-chat-preview__attachment-thumb">
        <div className="home-chat-preview__fake-top"><span /><span /><span /></div>
        <div className="home-chat-preview__fake-page">
          <span className="home-chat-preview__fake-kicker">PORTAL DE TRÁMITES</span>
          <span className="home-chat-preview__fake-title" />
          <span className="home-chat-preview__fake-line home-chat-preview__fake-line--wide" />
          <span className="home-chat-preview__fake-line" />
          <span className="home-chat-preview__fake-status"><i /> Solicitud recibida</span>
          <span className="home-chat-preview__fake-line home-chat-preview__fake-line--short" />
        </div>
      </div>
      <div className="home-chat-preview__attachment-info">
        <span className="home-chat-preview__attachment-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M14 2v6h6M8 13h8M8 17h5"/></svg>
        </span>
        <span><strong>Captura_tramite.png</strong><small>Imagen adjunta · Ejemplo</small></span>
        <svg className="home-chat-preview__attachment-check" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m5 12 4 4L19 6"/></svg>
      </div>
    </div>
  );
}

export default function InteractiveChatMockup() {
  const [step, setStep] = useState(0);
  const [phase, setPhase] = useState("idle");
  const [draft, setDraft] = useState("");
  const [typedText, setTypedText] = useState("");
  const [sentMessages, setSentMessages] = useState([]);
  const [reduced, setReduced] = useState(() =>
    typeof window !== "undefined" &&
    (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false)
  );
  const timerRef = useRef(null);
  const messagesRef = useRef(null);
  const sentRef = useRef(false);

  useEffect(() => {
    const media = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    if (!media) return undefined;
    const update = (event) => setReduced(event.matches);
    media.addEventListener?.("change", update);
    return () => media.removeEventListener?.("change", update);
  }, []);

  useEffect(() => {
    if (reduced) return undefined;
    const current = CONVERSATION[step];

    if (!current) {
      timerRef.current = window.setTimeout(() => {
        setSentMessages([]);
        setDraft("");
        setTypedText("");
        setPhase("idle");
        sentRef.current = false;
        setStep(0);
      }, 1800);
      return () => window.clearTimeout(timerRef.current);
    }

    if (current.type === "user") {
      if (phase === "idle") {
        setDraft("");
        sentRef.current = false;
        setPhase("composing");
      } else if (phase === "composing" && draft.length < current.text.length) {
        timerRef.current = window.setTimeout(() => {
          setDraft(current.text.slice(0, Math.min(current.text.length, draft.length + 2)));
        }, 34);
      } else if (phase === "composing" && draft.length === current.text.length) {
        timerRef.current = window.setTimeout(() => setPhase("ready"), 420);
      } else if (phase === "ready" && !sentRef.current) {
        timerRef.current = window.setTimeout(() => {
          sentRef.current = true;
          setPhase("sending");
        }, 560);
      } else if (phase === "sending") {
        timerRef.current = window.setTimeout(() => {
          setSentMessages((items) => [...items, current]);
          setDraft("");
          setPhase("idle");
          setStep((value) => value + 1);
        }, 300);
      }
    } else if (phase === "idle") {
      timerRef.current = window.setTimeout(() => setPhase("thinking"), 320);
    } else if (phase === "thinking") {
      timerRef.current = window.setTimeout(() => {
        setTypedText(current.text.slice(0, 2));
        setPhase("writing");
      }, 650);
    } else if (phase === "writing" && typedText.length < current.text.length) {
      timerRef.current = window.setTimeout(() => {
        setTypedText(current.text.slice(0, Math.min(current.text.length, typedText.length + 3)));
      }, 26);
    } else if (phase === "writing") {
      timerRef.current = window.setTimeout(() => {
        setSentMessages((items) => [...items, current]);
        setTypedText("");
        setPhase("idle");
        setStep((value) => value + 1);
      }, 1050);
    }

    return () => window.clearTimeout(timerRef.current);
  }, [step, phase, draft, typedText, reduced]);

  useEffect(() => () => window.clearTimeout(timerRef.current), []);

  useEffect(() => {
    const container = messagesRef.current;
    if (container) container.scrollTo({ top: container.scrollHeight, behavior: reduced ? "auto" : "smooth" });
  }, [sentMessages, phase, draft, typedText, reduced]);

  function replay() {
    window.clearTimeout(timerRef.current);
    sentRef.current = false;
    setSentMessages([]);
    setDraft("");
    setTypedText("");
    setPhase("idle");
    setStep(0);
  }

  function sendDraft() {
    const current = CONVERSATION[step];
    if (current?.type !== "user" || phase !== "ready" || sentRef.current) return;
    sentRef.current = true;
    setPhase("sending");
  }

  const current = CONVERSATION[step];
  const visibleMessages = reduced ? CONVERSATION : sentMessages;
  const showingThinking = !reduced && current?.type === "bot" && phase === "thinking";
  const isComposing = !reduced && current?.type === "user" && ["composing", "ready", "sending"].includes(phase);

  return (
    <section className="home-chat-preview" aria-label="Ejemplo ilustrativo de una conversación en ChatAP">
      <header className="home-chat-preview__header">
        <div className="flex min-w-0 items-center gap-2.5">
          <ChatBotAvatar size={32} static />
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="m-0 text-sm font-bold text-ink">ChatAP</h3>
              <span className="rounded-full border border-line bg-mist px-2 py-0.5 text-[10px] font-semibold text-muted">Ejemplo ilustrativo</span>
            </div>
            <p className="m-0 text-xs text-muted">Administración Pública de Formosa</p>
          </div>
        </div>
        <button type="button" onClick={replay} className="home-chat-preview__replay" aria-label="Repetir ejemplo">
          <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12a9 9 0 019-9 9.75 9.75 0 016.7 2.7L21 8m0 0V3m0 5h-5M21 12a9 9 0 01-9 9 9.75 9.75 0 00-6.7-2.7L3 16m0 0v5m0-5h5" /></svg>
          <span>Repetir</span>
        </button>
      </header>

      <div ref={messagesRef} className="home-chat-preview__messages" aria-live="polite">
        {visibleMessages.map((message) => (
          <div key={message.id} className={message.type === "user" ? "home-chat-preview__sent-group" : undefined}>
            <MessageBubble
              message={message}
              speaking={!reduced && message.type === "bot" && message.id === current?.id && phase === "writing"}
              typedText={!reduced && message.id === current?.id ? typedText : ""}
              reaction="idle"
              onFollowUp={() => {}}
              onChecklist={() => {}}
              onRate={() => {}}
            />
            {message.type === "user" && message.attachment && <AttachmentPreview />}
          </div>
        ))}
        {!reduced && current?.type === "bot" && phase === "writing" && (
          <MessageBubble
            message={current}
            speaking
            typedText={typedText}
            reaction="idle"
            onFollowUp={() => {}}
            onChecklist={() => {}}
            onRate={() => {}}
          />
        )}
        {showingThinking && (
          <div className="flex items-start gap-3 py-1" role="status">
            <ChatBotAvatar reaction="thinking" size={32} speaking static={false} />
            <div className="max-w-[85%] rounded-2xl rounded-tl-md border border-line bg-paper px-4 py-3 shadow-sm">
              <p className="m-0 text-sm text-muted">Estoy revisando tu consulta…</p>
              <div className="mt-2 flex items-center gap-1.5" aria-hidden="true">
                <span className="home-chat-preview__dot" />
                <span className="home-chat-preview__dot home-chat-preview__dot--two" />
                <span className="home-chat-preview__dot home-chat-preview__dot--three" />
              </div>
            </div>
          </div>
        )}
      </div>

      <footer className="home-chat-preview__footer">
        <div className={`home-chat-preview__composer ${isComposing ? "home-chat-preview__composer--active" : ""}`}>
          <span className="home-chat-preview__composer-text">{isComposing ? draft : "Escribí tu consulta aquí…"}{isComposing && phase === "composing" && <i className="home-chat-preview__caret" />}</span>
          <button type="button" className={`home-chat-preview__send ${phase === "sending" ? "home-chat-preview__send--sending" : ""}`} onClick={sendDraft} disabled={phase !== "ready"} aria-label="Enviar mensaje">
            {phase === "sending" ? (
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 12h14m-6-6 6 6-6 6"/></svg>
            ) : (
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="m5 12 7-7 7 7M12 5v14" /></svg>
            )}
          </button>
        </div>
        <span className="home-chat-preview__hint">Ejemplo ilustrativo · No se envían mensajes ni archivos reales</span>
      </footer>
    </section>
  );
}
