import { useNavigate, Link } from "react-router-dom";
import Reveal from "../common/Reveal";
import AnimatedText from "./AnimatedText";
import ChatPreview from "./ChatPreview";

const CAPABILITIES = [
  {
    num: "A",
    title: "Lenguaje claro y directo",
    note: "Respuestas humanas en lenguaje llano, sin jerga legal ni laberintos burocráticos.",
  },
  {
    num: "B",
    title: "Conexión en vivo con SIGED",
    note: "Consulta de expedientes, decretos y resoluciones provinciales en milisegundos.",
  },
  {
    num: "C",
    title: "Documentación oficial al instante",
    note: "Generación y descarga de recibos, constancias y formularios con validez jurídica.",
  },
];

export default function ChatSection() {
  const navigate = useNavigate();

  return (
    <section id="capacidades" className="relative overflow-hidden py-20 lg:py-32 bg-paper border-b border-line/40">
      <div className="ed-max section-bleed grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">

        {/* ── Left copy ─────────────────────────────────────────────── */}
        <div>
          <Reveal>
            <p className="light-eyebrow">
              <span className="text-brand">04</span>
              <span className="light-eyebrow-line" aria-hidden="true" />
              Experiencia Ciudadana
            </p>
            <h2 className="display-2 text-ink m-0 mt-5 font-neue">
              <AnimatedText text="Conversar, resolver y continuar." as="span" />
            </h2>
            <p className="mt-6 m-0 text-base leading-relaxed text-muted font-neue-text max-w-lg">
              Escribís o hablás con tu voz tal como lo harías en persona. ChatAP busca en la base oficial del Estado formoseño y te devuelve resoluciones inmediatas, formularios validados y seguimiento de expedientes.
            </p>
          </Reveal>

          {/* Capabilities list */}
          <Reveal delay={140}>
            <div className="mt-10 border-t border-line">
              {CAPABILITIES.map((c) => (
                <div key={c.num} className="cap-row py-4 border-b border-line/60">
                  <span className="cap-row__num font-mono text-brand font-bold text-sm">
                    {c.num}
                  </span>
                  <div className="cap-row__body">
                    <p className="cap-row__title font-bold text-ink">
                      {c.title}
                    </p>
                    <p className="cap-row__note text-muted text-sm mt-1">
                      {c.note}
                    </p>
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
                className="hero-btn-primary group"
              >
                Abrir ChatAP en pantalla completa
                <span className="hero-btn-arrow" aria-hidden="true">→</span>
              </button>
              <Link to="/contacto" className="text-xs font-mono uppercase tracking-widest text-faint hover:text-ink transition-colors no-underline">
                Mesa de Ayuda y Contacto →
              </Link>
            </div>
          </Reveal>
        </div>

        {/* ── Right: terminal chat preview ──────────────────────────── */}
        <Reveal variant="blur" delay={100}>
          <div className="chat-terminal-wrap shadow-2xl border border-white/15">
            {/* Chrome bar */}
            <div className="chat-terminal__bar flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#ff5f57]" />
                <span className="w-2.5 h-2.5 rounded-full bg-[#febc2e]" />
                <span className="w-2.5 h-2.5 rounded-full bg-[#28c840]" />
                <span className="ml-3 font-mono text-[10px] uppercase tracking-widest text-white/40">
                  simulador · chatap.formosa.gob.ar
                </span>
              </div>
              <span className="font-mono text-[9px] uppercase tracking-wider px-2 py-0.5 bg-brand/20 text-brand border border-brand/30">
                Interactivo en vivo
              </span>
            </div>
            <ChatPreview dark />
          </div>
        </Reveal>
      </div>
    </section>
  );
}