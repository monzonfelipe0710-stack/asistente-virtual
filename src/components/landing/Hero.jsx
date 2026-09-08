import { useNavigate } from "react-router-dom";
import Reveal from "../common/Reveal";
import ChatPreview from "./ChatPreview";
import SectionLabel from "./SectionLabel";
import TechnicalBadge from "./TechnicalBadge";
import TechnologyTexture from "./TechnologyTexture";
import AnimatedText from "./AnimatedText";
import StatusIndicator from "./StatusIndicator";

const BADGES = ["CHAT", "AI", "01", "24/7", "ONLINE", "SERVICIOS", "CIUDADANÍA"];

export default function Hero() {
  const navigate = useNavigate();

  return (
    <section id="inicio" className="relative overflow-hidden border-b border-line" aria-label="Presentación de ChatAP">
      <TechnologyTexture words={["CHATAP", "ADMINISTRACIÓN", "PÚBLICA", "TRÁMITES", "CIUDADANÍA", "SERVICIOS", "CHAT", "AI", "FORMOSA", "ASISTENCIA", "INFORMACIÓN"]} />

      <div className="ed-max section-bleed relative z-10 grid min-h-[calc(100svh-3.5rem)] grid-cols-1 lg:grid-cols-12 items-stretch">
        {/* Columna tipográfica */}
        <div className="lg:col-span-8 flex flex-col justify-center py-24 lg:py-28">
          <Reveal variant="blur">
            <SectionLabel num="01">Administración Pública · Formosa</SectionLabel>
          </Reveal>
          <Reveal variant="up" delay={90}>
            <h1 className="display-1 text-ink m-0 mt-8 font-neue">
              CHATAP<span className="text-brand">.</span>
            </h1>
          </Reveal>
          <Reveal variant="up" delay={180}>
            <p className="display-3 text-ink m-0 mt-6 max-w-2xl font-neue">
              <AnimatedText text="Asistente Virtual de la Administración Pública." as="span" />
            </p>
          </Reveal>
          <Reveal variant="up" delay={300}>
            <p className="mt-7 max-w-xl m-0 text-[1.05rem] leading-relaxed text-muted font-neue-text">
              El punto de contacto directo entre la ciudadanía y el Estado: consultá
              trámites, documentación y servicios oficiales en lenguaje claro, sin
              filas y sin horarios.
            </p>
          </Reveal>

          <Reveal variant="up" delay={400}>
            <div className="mt-12 flex flex-wrap items-center gap-4">
              <button
                type="button"
                onClick={() => navigate("/chat")}
                id="chat-cta"
                data-tour="chat-cta"
                className="btn-primary px-8! py-4! text-sm!"
              >
                Comenzar
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </button>
              <a href="#que-es" className="btn-ghost px-8! py-4! text-sm! no-underline">
                Conocer ChatAP
              </a>
            </div>
          </Reveal>

          <Reveal variant="up" delay={500}>
            <div className="mt-12 flex items-center gap-4">
              <StatusIndicator label="Servicio activo 24/7" tone="ok" />
              <span className="hidden sm:inline-block h-3 w-px bg-line" aria-hidden="true" />
              <p className="m-0 text-[11px] font-mono uppercase tracking-[0.18em] text-faint">
                Banda {">>"} disponible
              </p>
            </div>
          </Reveal>

          <Reveal variant="up" delay={560}>
            <div className="mt-10 flex flex-wrap gap-2.5" aria-hidden="true">
              {BADGES.map((b) => (
                <TechnicalBadge key={b}>{b}</TechnicalBadge>
              ))}
            </div>
          </Reveal>
        </div>

        {/* Columna panel de chat */}
        <div className="hidden lg:flex lg:col-span-4 items-center justify-center py-16 lg:pl-12 xl:pl-16">
          <div className="relative w-full max-w-md">
            <Reveal variant="blur" delay={250}>
              <ChatPreview />
            </Reveal>
            <Reveal variant="up" delay={420}>
              <div className="mt-5 flex items-center justify-between">
                <p className="fig-num m-0">FIG. 01 — Interfaz de consulta</p>
                <p className="fig-num m-0 text-[#18bc42]">● listo</p>
              </div>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}