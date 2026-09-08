import Reveal from "../common/Reveal";
import SectionLabel from "./SectionLabel";
import AnimatedText from "./AnimatedText";

const PILLARS = [
  {
    num: "01",
    title: "Seguridad",
    note: "Datos personales resguardados y acceso controlado.",
  },
  {
    num: "02",
    title: "Accesibilidad",
    note: "Pensada para cada persona, desde cualquier dispositivo.",
  },
  {
    num: "03",
    title: "Transparencia",
    note: "Fuentes oficiales y trazabilidad de cada respuesta.",
  },
  {
    num: "04",
    title: "Disponibilidad",
    note: "Servicio continuo, todos los días, a toda hora.",
  },
];

export default function TrustSection() {
  return (
    <section id="confianza" className="relative border-b border-line bg-mist/40 py-28 lg:py-40">
      <div className="ed-max section-bleed grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
        <div className="lg:col-span-5">
          <Reveal>
            <SectionLabel num="05">Confianza</SectionLabel>
            <h2 className="display-2 text-ink m-0 mt-8 font-neue">
              <AnimatedText text="INFORMACIÓN EN LA QUE PODÉS CONFIAR." as="span" />
            </h2>
          </Reveal>
        </div>

        <div className="lg:col-span-7">
          <Reveal delay={140}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-px bg-line border border-line">
              {PILLARS.map((p) => (
                <div key={p.num} className="bg-paper p-6 md:p-8">
                  <p className="fig-num m-0 text-brand">{p.num}</p>
                  <h3 className="mt-4 m-0 font-neue text-lg md:text-xl font-extrabold tracking-tight text-ink uppercase">
                    {p.title}
                  </h3>
                  <p className="mt-2 m-0 text-sm leading-relaxed text-muted">{p.note}</p>
                </div>
              ))}
            </div>
          </Reveal>
          <Reveal delay={240}>
            <p className="mt-8 text-[11px] font-mono uppercase tracking-[0.18em] text-faint m-0">
              Constancia :: Gobierno de la Provincia de Formosa
            </p>
          </Reveal>
        </div>
      </div>
    </section>
  );
}