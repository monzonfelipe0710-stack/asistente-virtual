import { useNavigate } from "react-router-dom";
import Reveal from "../common/Reveal";
import AnimatedText from "./AnimatedText";
import ChatPreview from "./ChatPreview";
import { Link } from "react-router-dom";

const CAPABILITIES = [
  { num: "A", title: "Lenguaje claro",         note: "Respuestas humanas, sin burocracia." },
  { num: "B", title: "Trámites y expedientes", note: "Seguimiento y consulta al instante." },
  { num: "C", title: "Conexión con personas",  note: "Cuando la gestión lo requiere." },
];

export default function ChatSection() {
  const navigate = useNavigate();

  return (
    <section id="capacidades" className="relative overflow-hidden py-16 lg:py-28 bg-paper">
      <div className="ed-max section-bleed grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">

        {/* ── Left copy ─────────────────────────────────────────────── */}
        <div>
          <Reveal>
            <p className="light-eyebrow">
              <span className="text-brand">04</span>
              <span className="light-eyebrow-line" aria-hidden="true" />
              Cómo funciona
            </p>
            <h2 className="display-2 text-ink m-0 mt-5 font-neue">
              <AnimatedText text="Este es el canal real." as="span" />
            </h2>
            <p className="mt-6 m-0 text-[1rem] leading-relaxed text-muted font-neue-text max-w-md">
              Escribís como si hablaras con una persona. ChatAP busca en la base
              oficial y responde al momento, con voz, documentos y seguimiento.
            </p>
          </Reveal>

          {/* Capabilities list */}
          <Reveal delay={140}>
            <div className="mt-10 border-t border-line">
              {CAPABILITIES.map((c) => (
                <div key={c.num} className="cap-row">
                  <span className="cap-row__num">{c.num}</span>
                  <div className="cap-row__body">
                    <p className="cap-row__title">{c.title}</p>
                    <p className="cap-row__note">{c.note}</p>
                  </div>
                </div>
              ))}
            </div>
          </Reveal>

          {/* CTAs */}
          <Reveal delay={260}>
            <div className="mt-10 flex flex-wrap items-center gap-4">
              <button
                type="button"
                onClick={() => navigate("/chat")}
                className="hero-btn-primary"
              >
                Probar ChatAP
                <span aria-hidden="true">→</span>
              </button>
              <Link to="/contacto" className="text-sm font-mono uppercase tracking-[0.16em] text-faint hover:text-ink transition-colors no-underline">
                Otros canales →
              </Link>
            </div>
          </Reveal>
        </div>

        {/* ── Right: terminal chat preview ──────────────────────────── */}
        <Reveal variant="blur" delay={100}>
          <div className="chat-terminal-wrap">
            {/* Chrome bar */}
            <div className="chat-terminal__bar">
              <span className="chat-terminal__dot" style={{ background: "#ff5f57" }} />
              <span className="chat-terminal__dot" style={{ background: "#febc2e" }} />
              <span className="chat-terminal__dot" style={{ background: "#28c840" }} />
              <span className="chat-terminal__title">chatap — asistente virtual</span>
            </div>
            <ChatPreview dark />
          </div>
        </Reveal>
      </div>
    </section>
  );
}
