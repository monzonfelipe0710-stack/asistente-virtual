import { useNavigate } from "react-router-dom";
import Reveal from "../common/Reveal";
import ImageStage from "../common/ImageStage";
import AnimatedText from "./AnimatedText";
import StatusIndicator from "./StatusIndicator";

export default function FinalCta() {
  const navigate = useNavigate();

  return (
    <section id="charla" className="band-dark relative overflow-hidden" aria-label="Llamado final">
      <div className="absolute inset-0 opacity-[0.10]" aria-hidden="true">
        <ImageStage kind="portico" accent aspect="aspect-[16/9] md:aspect-[21/9]" tint="text-[#f3f1e9]" className="h-full w-full" />
      </div>
      <div className="absolute inset-0 bg-gradient-to-b from-band via-transparent to-band" aria-hidden="true" />

      <div className="ed-max section-bleed relative z-10 py-32 lg:py-44 text-center">
        <Reveal>
          <p className="m-0 flex items-center justify-center gap-4 text-[11px] font-bold uppercase tracking-[0.3em] text-[#f3f1e9]/60">
            <span className="inline-block h-px w-10 bg-[#f3f1e9]/30" aria-hidden="true" />
            Formosa · Administración Pública
            <span className="inline-block h-px w-10 bg-[#f3f1e9]/30" aria-hidden="true" />
          </p>
        </Reveal>
        <Reveal delay={120}>
          <h2 className="display-1 text-[#f3f1e9] m-0 mt-10 font-neue">
            <AnimatedText text="TU GESTIÓN. MÁS SIMPLE." as="span" />
          </h2>
        </Reveal>
        <Reveal delay={240}>
          <p className="mx-auto mt-9 max-w-xl m-0 text-[1.05rem] leading-relaxed text-[#f3f1e9]/65 font-neue-text">
            Un Estado que escucha, responde y acompaña. Empezá tu próxima gestión
            sin filas, sin horarios y desde cualquier lado.
          </p>
        </Reveal>
        <Reveal delay={360}>
          <button
            type="button"
            onClick={() => navigate("/chat")}
            className="btn-primary mt-12 px-10! py-5! text-sm!"
          >
            Comenzar con ChatAP
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </button>
        </Reveal>
        <Reveal delay={440}>
          <div className="mt-20 flex items-center justify-center gap-4">
            <StatusIndicator label="Subsecretaría de Recursos Humanos" tone="brand" light />
          </div>
        </Reveal>
      </div>
    </section>
  );
}