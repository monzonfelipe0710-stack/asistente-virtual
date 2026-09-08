import { useNavigate } from "react-router-dom";
import Reveal from "../common/Reveal";
import { ArrowLink } from "../common/editorial";
import SectionLabel from "./SectionLabel";
import ChatPreview from "./ChatPreview";
import AnimatedText from "./AnimatedText";

const CAPABILITIES = [
  { num: "A", title: "Lenguaje claro", note: "Respuestas humanas, sin burocracia." },
  { num: "B", title: "Trámites y expedientes", note: "Seguimiento y consulta al instante." },
  { num: "C", title: "Conexión con personas", note: "Cuando la gestión lo requiere." },
];

export default function ChatSection() {
  const navigate = useNavigate();

  return (
    <section id="capacidades" className="relative overflow-hidden border-b border-line py-28 lg:py-40">
      <div className="ed-max section-bleed grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        <div className="lg:col-span-5">
          <Reveal>
            <SectionLabel num="04">Cómo funciona</SectionLabel>
            <h2 className="display-2 text-ink m-0 mt-8 font-neue">
              <AnimatedText text="ASÍ FUNCIONA CHATAP." as="span" />
            </h2>
            <p className="mt-7 m-0 text-[1.05rem] leading-relaxed text-muted font-neue-text max-w-md">
              Escribís tu consulta como si hablaras con una persona. ChatAP entiende,
              busca en la base oficial y te responde al momento.
            </p>
          </Reveal>

          <Reveal delay={160}>
            <div className="mt-10 flex flex-col">
              {CAPABILITIES.map((c) => (
                <div key={c.num} className="flex items-baseline gap-4 border-b border-line py-4">
                  <span className="fig-num text-brand shrink-0">{c.num}</span>
                  <div>
                    <h3 className="m-0 font-neue text-base font-bold tracking-tight text-ink">{c.title}</h3>
                    <p className="m-0 mt-0.5 text-sm text-muted">{c.note}</p>
                  </div>
                </div>
              ))}
            </div>
          </Reveal>

          <Reveal delay={260}>
            <div className="mt-10 flex flex-wrap items-center gap-4">
              <button
                type="button"
                onClick={() => navigate("/chat")}
                className="btn-primary px-8! py-4! text-sm!"
              >
                Probar ChatAP
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </button>
              <ArrowLink className="mt-0" to="/contacto" mute>
                Otros canales de atención
              </ArrowLink>
            </div>
          </Reveal>
        </div>

        <div className="lg:col-span-6 lg:col-start-7">
          <Reveal variant="blur" delay={150}>
            <ChatPreview />
          </Reveal>
          <Reveal variant="up" delay={300}>
            <div className="mt-5 flex items-center justify-between">
              <p className="fig-num m-0">FIG. 02 — Conversación tipo</p>
              <p className="fig-num m-0 text-faint">UUID :: chatap-02</p>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}