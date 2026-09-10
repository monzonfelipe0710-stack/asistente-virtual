import { useNavigate } from "react-router-dom";
import Reveal from "../common/Reveal";
import AnimatedText from "./AnimatedText";
import DotGrid from "./DotGrid";

export default function FinalCta() {
  const navigate = useNavigate();

  return (
    <section id="charla" className="relative overflow-hidden band-dark py-24 lg:py-40" aria-label="Llamado final">
      <DotGrid color="rgba(241,240,232,0.06)" />

      {/* Ambient center glow */}
      <div
        className="ambient-glow-brand absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[480px] h-[480px] rounded-full"
        aria-hidden="true"
      />

      {/* Giant ghost watermark */}
      <p
        className="pointer-events-none absolute bottom-0 left-0 right-0 m-0 select-none overflow-hidden text-center font-neue font-black leading-none tracking-[-0.06em] text-[20vw] text-[#f3f1e9]/[0.035]"
        aria-hidden="true"
      >
        CHATAP
      </p>

      <div className="ed-max section-bleed relative z-10 text-center">
        <Reveal>
          <p className="m-0 font-mono text-[10px] uppercase tracking-[0.28em] text-brand font-bold">
            Formosa · Administración Pública · 2026
          </p>
        </Reveal>

        <Reveal delay={100}>
          <h2 className="display-1 text-[#f3f1e9] m-0 mt-8 font-neue leading-none">
            <AnimatedText text="Los próximos trámites son tuyos." as="span" wordDelay={45} />
          </h2>
        </Reveal>

        <Reveal delay={220}>
          <p className="mx-auto mt-8 max-w-lg m-0 text-[1.05rem] leading-relaxed text-[#f3f1e9]/55 font-neue-text">
            Un Estado que escucha, responde y acompaña. Empezá la próxima
            gestión sin filas, sin horarios y desde cualquier lado.
          </p>
        </Reveal>

        <Reveal delay={340}>
          <div className="mt-12 flex flex-wrap items-center justify-center gap-4">
            <button
              type="button"
              onClick={() => navigate("/chat")}
              className="finalcta-btn-primary"
            >
              Empezar ahora
              <span aria-hidden="true">→</span>
            </button>
            <button
              type="button"
              onClick={() => navigate("/login")}
              className="finalcta-btn-ghost"
            >
              Ingresar
            </button>
          </div>
        </Reveal>

        {/* Status bar */}
        <Reveal delay={420}>
          <div className="mt-16 inline-flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.22em] text-[#f3f1e9]/35">
            <span className="w-1.5 h-1.5 rounded-full bg-[#18bc42] animate-pulse-dot" aria-hidden="true" />
            Subsecretaría de Recursos Humanos · Estado activo
          </div>
        </Reveal>
      </div>
    </section>
  );
}
