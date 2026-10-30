import { useEffect, useRef, useState } from "react";
import ChatBotAvatar from "../ChatBotAvatar";
import MessageBubble from "../ciudadano/MessageBubble";

// Escenas ilustrativas basadas en las capacidades reales del servicio:
// búsqueda de trámites publicados, aclaración entre opciones y respuesta
// de alcance cuando no hay información suficiente en el catálogo.
const CONVERSATION = [
  {
    id: "demo-user-1",
    type: "user",
    text: "Necesito pedir la licencia anual. ¿Cómo empiezo?",
  },
  {
    id: "demo-bot-1",
    type: "bot",
    text: "Puedo orientarte sobre la Licencia anual ordinaria. La información disponible reúne la descripción del trámite, sus requisitos y las mesas de entrada asociadas. Así podés revisar qué necesitás antes de iniciar la gestión.",
    canRate: false,
  },
  {
    id: "demo-user-2",
    type: "user",
    text: "También necesito un certificado. ¿Me ayudás?",
  },
  {
    id: "demo-bot-2",
    type: "bot",
    text: "¡Claro! Hay más de una opción que podría corresponder. ¿Buscás el Certificado de servicios o la Constancia de trabajo?",
    canRate: false,
  },
  {
    id: "demo-user-3",
    type: "user",
    text: "El Certificado de servicios.",
  },
  {
    id: "demo-bot-3",
    type: "bot",
    text: "Perfecto. Puedo orientarte sobre el Certificado de servicios: qué acredita, qué documentación requiere y dónde se presenta, de acuerdo con la información disponible para ese trámite.",
    canRate: false,
  },
  {
    id: "demo-user-4",
    type: "user",
    text: "¿Y puedo consultar el estado de mi expediente?",
  },
  {
    id: "demo-bot-4",
    type: "bot",
    text: "No encontramos información sobre esta consulta. Probá reformular tu pregunta o consultá directamente en una mesa de entrada.",
    canRate: false,
  },
];

export default function InteractiveChatMockup() {
  const [step, setStep] = useState(0);
  const [phase, setPhase] = useState("idle");
  const [typedText, setTypedText] = useState("");
  const [reduced, setReduced] = useState(() =>
    typeof window !== "undefined" &&
    (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false)
  );
  const timerRef = useRef(null);
  const messagesRef = useRef(null);

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
        setTypedText("");
        setPhase("idle");
        setStep(0);
      }, 1500);
      return () => window.clearTimeout(timerRef.current);
    }

    if (current.type === "user") {
      timerRef.current = window.setTimeout(() => {
        setStep((value) => value + 1);
      }, 900);
    } else if (phase === "idle") {
      timerRef.current = window.setTimeout(() => {
        setPhase("thinking");
      }, 420);
    } else if (phase === "thinking") {
      timerRef.current = window.setTimeout(() => {
        setTypedText(current.text.slice(0, 2));
        setPhase("writing");
      }, 620);
    } else if (typedText.length < current.text.length) {
      timerRef.current = window.setTimeout(() => {
        setTypedText(current.text.slice(0, Math.min(current.text.length, typedText.length + 3)));
      }, 24);
    } else {
      timerRef.current = window.setTimeout(() => {
        setTypedText("");
        setPhase("idle");
        setStep((value) => value + 1);
      }, 1250);
    }

    return () => window.clearTimeout(timerRef.current);
  }, [step, phase, typedText, reduced]);

  useEffect(() => () => window.clearTimeout(timerRef.current), []);

  useEffect(() => {
    const container = messagesRef.current;
    if (container) container.scrollTop = container.scrollHeight;
  }, [step, phase, typedText, reduced]);

  function replay() {
    window.clearTimeout(timerRef.current);
    setTypedText("");
    setPhase("idle");
    setStep(0);
  }

  const current = CONVERSATION[step];
  const visibleMessages = reduced
    ? CONVERSATION
    : CONVERSATION.slice(0, step);

  if (!reduced && current?.type === "user") {
    visibleMessages.push(current);
  }

  if (!reduced && current?.type === "bot" && phase === "writing") {
    visibleMessages.push({ ...current, text: typedText });
  }

  const showingThinking = !reduced && current?.type === "bot" && phase === "thinking";

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
          <MessageBubble
            key={message.id}
            message={message}
            speaking={!reduced && message.type === "bot" && message.id === current?.id && phase === "writing"}
            typedText={!reduced && message.id === current?.id ? typedText : ""}
            reaction="idle"
            onFollowUp={() => {}}
            onChecklist={() => {}}
            onRate={() => {}}
          />
        ))}
        {showingThinking && (
          <div className="flex items-start gap-3 py-1" role="status">
            <ChatBotAvatar reaction="thinking" size={32} speaking static={false} />
            <div className="max-w-[85%] rounded-2xl rounded-tl-md border border-line bg-paper px-4 py-3 shadow-sm">
              <p className="m-0 text-sm text-muted">Estoy preparando una respuesta…</p>
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
        <div className="home-chat-preview__composer" aria-hidden="true">
          <span>Escribí tu consulta aquí…</span>
          <span className="home-chat-preview__send">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="m5 12 7-7 7 7M12 5v14" /></svg>
          </span>
        </div>
        <span className="home-chat-preview__hint">Ejemplo ilustrativo · La información depende de los trámites publicados</span>
      </footer>
    </section>
  );
}
