import { useEffect, useRef, useState } from "react";
import ChatBotAvatar from "../ChatBotAvatar";
import MessageBubble from "../ciudadano/MessageBubble";

const MESSAGES = [
  { id: "demo-user-1", type: "user", text: "Hola, ¿qué puedo consultar en ChatAP?" },
  {
    id: "demo-bot-1",
    type: "bot",
    text: "¡Hola! Soy ChatAP, el asistente de la Administración Pública de Formosa. Puedo orientarte sobre **trámites administrativos**, responder preguntas frecuentes y ayudarte a encontrar **formularios y documentos**.",
    canRate: false,
  },
  { id: "demo-user-2", type: "user", text: "¿Tengo que iniciar sesión para hacer una consulta?" },
  {
    id: "demo-bot-2",
    type: "bot",
    text: "No es obligatorio. Podés realizar consultas de forma libre y anónima. Si iniciás sesión, también podés conservar el historial de tus conversaciones.",
    canRate: false,
  },
];

export default function InteractiveChatMockup() {
  const [count, setCount] = useState(1);
  const [typing, setTyping] = useState(false);
  const [reduced, setReduced] = useState(() =>
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false
  );
  const timerRef = useRef(null);

  useEffect(() => {
    const media = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    if (!media) return undefined;
    const update = (event) => setReduced(event.matches);
    media.addEventListener?.("change", update);
    return () => media.removeEventListener?.("change", update);
  }, []);

  useEffect(() => {
    if (reduced || count >= MESSAGES.length) return undefined;
    timerRef.current = window.setTimeout(() => {
      if (MESSAGES[count].type === "bot") {
        setTyping(true);
        timerRef.current = window.setTimeout(() => {
          setTyping(false);
          setCount((value) => value + 1);
        }, 650);
      } else {
        setCount((value) => value + 1);
      }
    }, 1050);
    return () => window.clearTimeout(timerRef.current);
  }, [count, reduced]);

  useEffect(() => () => window.clearTimeout(timerRef.current), []);

  function replay() {
    window.clearTimeout(timerRef.current);
    setTyping(false);
    setCount(1);
  }

  const visibleMessages = reduced ? MESSAGES : MESSAGES.slice(0, count);

  return (
    <section className="home-chat-preview" aria-label="Vista ilustrativa de una conversación en ChatAP">
      <header className="home-chat-preview__header">
        <div className="flex min-w-0 items-center gap-2.5">
          <ChatBotAvatar size={32} static />
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="m-0 text-sm font-bold text-ink">ChatAP</h3>
              <span className="rounded-full border border-line bg-mist px-2 py-0.5 text-[10px] font-semibold text-muted">Asistente virtual</span>
            </div>
            <p className="m-0 text-xs text-muted">Administración Pública de Formosa</p>
          </div>
        </div>
        <button type="button" onClick={replay} className="home-chat-preview__replay" aria-label="Repetir ejemplo">
          <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12a9 9 0 019-9 9.75 9.75 0 016.7 2.7L21 8m0 0V3m0 5h-5M21 12a9 9 0 01-9 9 9.75 9.75 0 00-6.7-2.7L3 16m0 0v5m0-5h5" /></svg>
          <span>Repetir</span>
        </button>
      </header>

      <div className="home-chat-preview__messages" aria-live="polite">
        {visibleMessages.map((message) => (
          <MessageBubble
            key={message.id}
            message={message}
            speaking={false}
            reaction="idle"
            onFollowUp={() => {}}
            onChecklist={() => {}}
            onRate={() => {}}
          />
        ))}
        {typing && (
          <div className="flex items-start gap-3 py-1" role="status" aria-live="polite">
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
        <span className="home-chat-preview__hint">Una orientación clara, en lenguaje sencillo</span>
      </footer>
    </section>
  );
}
