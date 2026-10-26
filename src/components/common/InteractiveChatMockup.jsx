import { useEffect, useRef, useState } from "react";
import ChatBotAvatar from "../ChatBotAvatar";

const MESSAGES = [
  { id: "u1", type: "user", text: "Hola, ¿qué puedo consultar en ChatAP?" },
  { id: "b1", type: "bot", text: "¡Hola! Soy ChatAP, el asistente de la Administración Pública de Formosa. Puedo orientarte sobre **trámites administrativos**, responder preguntas frecuentes, ayudarte a encontrar **formularios y documentos**, y orientarte para consultar el estado de un expediente en el SIGED." },
  { id: "u2", type: "user", text: "¿Tengo que iniciar sesión para hacer una consulta?" },
  { id: "b2", type: "bot", text: "No es obligatorio. Podés realizar consultas de forma libre y anónima. Si iniciás sesión, también podés conservar el historial de tus conversaciones." },
];

function AnswerText({ text }) {
  return String(text).split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
    part.startsWith("**") && part.endsWith("**")
      ? <strong key={i} className="font-semibold">{part.slice(2, -2)}</strong>
      : <span key={i}>{part}</span>
  );
}

export default function InteractiveChatMockup() {
  const [count, setCount] = useState(1);
  const [typing, setTyping] = useState(false);
  const [rating, setRating] = useState(null);
  const [reduced, setReduced] = useState(() => window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false);
  const scrollRef = useRef(null);
  const timerRef = useRef(null);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = (event) => setReduced(event.matches);
    media.addEventListener?.("change", update);
    return () => media.removeEventListener?.("change", update);
  }, []);

  useEffect(() => {
    if (reduced || count >= MESSAGES.length) return undefined;
    timerRef.current = window.setTimeout(() => {
      if (count === 1 || count === 3) {
        setTyping(true);
        timerRef.current = window.setTimeout(() => {
          setTyping(false);
          setCount((n) => n + 1);
        }, 850);
      } else setCount((n) => n + 1);
    }, 1200);
    return () => window.clearTimeout(timerRef.current);
  }, [count, reduced]);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: reduced ? "auto" : "smooth" });
  }, [count, typing, reduced]);

  function replay() {
    window.clearTimeout(timerRef.current);
    setRating(null);
    setTyping(false);
    setCount(1);
  }

  const visibleCount = reduced ? MESSAGES.length : count;

  return (
    <section className="mx-auto w-full max-w-3xl overflow-hidden rounded-3xl border border-line bg-paper shadow-xl" aria-label="Ejemplo de conversación de ChatAP">
      <header className="flex items-center justify-between gap-3 border-b border-line bg-card/80 px-4 py-3.5 sm:px-5">
        <div className="flex min-w-0 items-center gap-3">
          <div className="relative shrink-0">
            <ChatBotAvatar size={38} reaction={typing ? "thinking" : "idle"} static={!typing} speaking={typing} />
            <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-paper" />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2"><h3 className="m-0 text-sm font-bold text-ink">ChatAP</h3><span className="rounded-full border border-brand/20 bg-brand/10 px-2 py-0.5 text-[10px] font-semibold text-brand-deep">Asistente oficial</span></div>
            <p className="m-0 mt-0.5 text-xs text-muted">Administración Pública de Formosa</p>
          </div>
        </div>
        <button type="button" onClick={replay} className="inline-flex min-h-9 shrink-0 items-center gap-1.5 rounded-full border border-line px-3 text-xs font-semibold text-muted hover:bg-mist hover:text-ink" aria-label="Repetir ejemplo">
          <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12a9 9 0 019-9 9.75 9.75 0 016.7 2.7L21 8m0 0V3m0 5h-5M21 12a9 9 0 01-9 9 9.75 9.75 0 01-6.7-2.7L3 16m0 0v5m0-5h5" /></svg>
          <span className="hidden sm:inline">Repetir</span>
        </button>
      </header>

      <div ref={scrollRef} className="flex min-h-[310px] max-h-[460px] flex-col gap-4 overflow-y-auto px-3 py-5 sm:min-h-[350px] sm:px-5" aria-live="polite">
        {MESSAGES.slice(0, visibleCount).map((m) => (
          <article key={m.id} className={`flex gap-2.5 ${m.type === "user" ? "justify-end" : "justify-start"} animate-fade-up`}>
            {m.type === "bot" && <div className="mt-1 shrink-0"><ChatBotAvatar size={30} static /></div>}
            <div className={`flex max-w-[88%] flex-col sm:max-w-[80%] ${m.type === "user" ? "items-end" : "items-start"}`}>
              <div className={`chat-msg__body shadow-xs ${m.type === "user" ? "bg-brand-deep text-white" : "border border-line bg-card text-ink"}`}>
                <p className={`m-0 whitespace-pre-wrap text-sm leading-6 ${m.type === "user" ? "text-white" : "text-ink"}`}>{m.type === "bot" ? <AnswerText text={m.text} /> : m.text}</p>
              </div>
              <span className="mt-1.5 px-1 text-[10px] text-muted">{m.type === "user" ? "Vos" : "ChatAP"} · Ejemplo</span>
              {m.id === "b2" && visibleCount === MESSAGES.length && (
                <div className="mt-3 w-full border-t border-line/70 pt-2.5">
                  <div className="flex flex-wrap items-center gap-2"><span className="text-xs text-muted">¿Te sirvió esta respuesta?</span>
                    {[{ value: 1, label: "Sí", icon: "👍" }, { value: 0, label: "No", icon: "👎" }].map((o) => <button key={o.value} type="button" onClick={() => setRating(o.value)} aria-pressed={rating === o.value} className={`inline-flex min-h-9 items-center gap-1 rounded-full border px-2.5 text-xs font-semibold ${rating === o.value ? "border-brand-deep bg-brand-deep text-white" : "border-line text-muted hover:bg-mist hover:text-ink"}`}><span aria-hidden="true">{o.icon}</span>{o.label}</button>)}
                    {rating !== null && <span className="text-xs text-muted" role="status">¡Gracias por tu opinión!</span>}
                  </div>
                </div>
              )}
            </div>
          </article>
        ))}
        {typing && <div className="flex items-end gap-2.5 animate-fade-up"><ChatBotAvatar size={30} reaction="thinking" /><div className="chat-msg__body flex items-center gap-1.5 border border-line bg-card px-4 py-3"><span className="mr-1 text-xs text-muted">ChatAP está respondiendo</span>{[0,150,300].map((delay) => <span key={delay} className="h-1.5 w-1.5 rounded-full bg-brand animate-bounce" style={{ animationDelay: `${delay}ms` }} />)}</div></div>}
      </div>

      <footer className="border-t border-line bg-card/60 px-3 py-3 sm:px-5">
        <div className="flex items-center gap-2 rounded-2xl border border-line bg-paper px-3 py-2 shadow-inner">
          <span className="min-w-0 flex-1 py-1 text-sm text-muted/70">Escribí tu consulta sobre trámites o servicios…</span>
          <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-deep text-white opacity-90" aria-hidden="true"><svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="m5 12 7-7 7 7M12 5v14" /></svg></span>
        </div>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-2 px-1 text-[10px] text-muted"><span>Respuestas en lenguaje sencillo</span><span>Gobierno de la Provincia de Formosa</span></div>
      </footer>
    </section>
  );
}
