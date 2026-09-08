import Reveal from "../common/Reveal";
import SectionLabel from "./SectionLabel";
import ServiceItem from "./ServiceItem";
import AnimatedText from "./AnimatedText";

const SERVICES = [
  { num: "01", title: "Trámites", tag: "Iniciar", to: "/chat" },
  { num: "02", title: "Información", tag: "Consultar", to: "/chat" },
  { num: "03", title: "Organismos", tag: "Directorio", to: "/contacto" },
  { num: "04", title: "Consultas", tag: "Preguntar", to: "/chat" },
  { num: "05", title: "Asistencia", tag: "Soporte", to: "/contacto" },
  { num: "06", title: "Servicios", tag: "Canales", to: "/contacto" },
];

export default function ServicesSection() {
  return (
    <section id="servicios" className="band-dark relative overflow-hidden border-b border-line py-28 lg:py-40">
      <div className="ed-max section-bleed relative z-10">
        <Reveal>
          <SectionLabel num="03" light>Servicios</SectionLabel>
          <h2 className="display-1 text-[#f3f1e9] m-0 mt-8 font-neue max-w-4xl">
            <AnimatedText text="TODO LO QUE NECESITÁS." as="span" />
          </h2>
          <p className="mt-7 max-w-xl m-0 text-[1rem] leading-relaxed text-[#f3f1e9]/60 font-neue-text">
            Seis formas de acercarte al Estado. Elegí la tuya y empezá a resolver hoy.
          </p>
        </Reveal>

        <div className="mt-16 grid gap-px bg-[#f3f1e9]/15 border border-[#f3f1e9]/15">
          {SERVICES.map((s, i) => (
            <Reveal key={s.num} as="div" delay={i * 70} className="band-dark">
              <ServiceItem num={s.num} title={s.title} tag={s.tag} to={s.to} light />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}