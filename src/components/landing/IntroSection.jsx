import Reveal from "../common/Reveal";
import { ArrowLink } from "../common/editorial";
import SectionLabel from "./SectionLabel";
import TechnologyTexture from "./TechnologyTexture";
import AnimatedText from "./AnimatedText";

const INDICATORS = [
  { num: "01", label: "24/7", note: "Disponible siempre, sin esperas." },
  { num: "02", label: "Asistencia", note: "Acompañamiento en cada gestión." },
  { num: "03", label: "Información", note: "Contenido oficial verificable." },
  { num: "04", label: "Trámites", note: "Procedimientos en lenguaje claro." },
];

export default function IntroSection() {
  return (
    <section id="que-es" className="relative overflow-hidden border-b border-line py-28 lg:py-40">
      <TechnologyTexture
        words={["CHATAP", "CIUDADANÍA", "TRÁMITES", "SERVICIOS", "INFORMACIÓN", "ASISTENCIA", "PÚBLICA"]}
        className="opacity-40"
      />
      <div className="ed-max section-bleed relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-12 items-start lg:items-center">
        <div className="lg:col-span-6">
          <Reveal>
            <SectionLabel num="02">Qué es ChatAP</SectionLabel>
            <h2 className="display-1 text-ink m-0 mt-8 font-neue">
              <AnimatedText text="UN ASISTENTE. PARA TODA LA CIUDADANÍA." as="span" />
            </h2>
          </Reveal>
        </div>

        <div className="lg:col-span-5 lg:col-start-8">
          <Reveal delay={120}>
            <p className="editorial-text text-[1.05rem] m-0">
              ChatAP es un punto único de contacto entre las personas y el Estado.
              Una interfaz cuidada, un lenguaje claro y una base de conocimiento
              oficial para que cada gestión sea más simple, accesible y transparente.
            </p>
          </Reveal>
          <Reveal delay={220}>
            <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 gap-px bg-line border border-line">
              {INDICATORS.map((item) => (
                <div key={item.num} className="bg-paper p-5">
                  <p className="fig-num m-0 text-brand">{item.num}</p>
                  <h3 className="mt-3 m-0 font-neue text-sm font-extrabold uppercase tracking-[0.14em] text-ink">
                    {item.label}
                  </h3>
                  <p className="mt-1.5 m-0 text-xs leading-relaxed text-muted">{item.note}</p>
                </div>
              ))}
            </div>
          </Reveal>
          <Reveal delay={300}>
            <ArrowLink className="mt-10" to="#servicios">
              Conocer los servicios
            </ArrowLink>
          </Reveal>
        </div>
      </div>
    </section>
  );
}