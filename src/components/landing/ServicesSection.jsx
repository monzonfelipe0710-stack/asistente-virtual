import { Link } from "react-router-dom";
import Reveal from "../common/Reveal";
import AnimatedText from "./AnimatedText";
import DotGrid from "./DotGrid";
import SpotlightCard from "../common/SpotlightCard";

const SERVICES = [
  {
    num: "01",
    tag: "SIGED Integrado",
    title: "Mesa de Entradas",
    desc: "Presentación, recepción y trazabilidad digital de expedientes oficiales provinciales en tiempo real.",
    meta: "Trazabilidad de Expedientes",
    to: "/chat",
    query: "¿Cómo inicio o consulto un trámite en Mesa de Entradas?",
    accent: "#ff9100",
  },
  {
    num: "02",
    tag: "Descarga Inmediata",
    title: "Recibos de Sueldo",
    desc: "Acceso al recibo mensual de haberes con firma digital y verificación oficial de autenticidad.",
    meta: "PDF Oficial con Hash Seguro",
    to: "/chat",
    query: "Quiero consultar y descargar mi recibo de sueldo",
    accent: "#ff9100",
  },
  {
    num: "03",
    tag: "Salud & Permisos",
    title: "Licencias Médicas",
    desc: "Carga de certificados de salud, licencias especiales, cómputos y justificación de inasistencias.",
    meta: "Reconocimientos Médicos",
    to: "/chat",
    query: "Requisitos y procedimiento para solicitar licencia médica",
    accent: "#18bc42",
  },
  {
    num: "04",
    tag: "Red Provincial",
    title: "Guía de Organismos",
    desc: "Directorio completo de dependencias de la Administración Pública, autoridades y canales oficiales.",
    meta: "Estructura Gubernamental",
    to: "/contacto",
    query: "Directorio y dependencias del Gobierno de Formosa",
    accent: "#4365ff",
  },
  {
    num: "05",
    tag: "Inclusión Universal",
    title: "Asistente de Voz",
    desc: "Interacción multimodal mediante dictado por micrófono y lectura asistida en lenguaje llano.",
    meta: "Audio Bidireccional Accesible",
    to: "/chat",
    query: "Quiero usar el dictado por voz",
    accent: "#ff9100",
  },
  {
    num: "06",
    tag: "Mesa de Ayuda",
    title: "Atención Humana",
    desc: "Derivación con agentes especializados de Recursos Humanos para trámites complejos o atípicos.",
    meta: "Subsecretaría de RRHH",
    to: "/contacto",
    query: "Necesito contactar a un agente de Recursos Humanos",
    accent: "#febc2e",
  },
];

export default function ServicesSection() {
  return (
    <section id="servicios" className="relative overflow-hidden band-dark py-20 lg:py-32">
      <DotGrid color="rgba(241,240,232,0.05)" />

      <div className="ed-max section-bleed relative z-10">
        <Reveal>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <p className="services-eyebrow">
                <span className="text-brand">03</span>
                <span className="services-eyebrow-line" aria-hidden="true" />
                Módulos de Gestión
              </p>
              <h2 className="display-2 text-[#f3f1e9] m-0 mt-5 font-neue max-w-3xl">
                <AnimatedText
                  text="Cada trámite conectado en un solo punto de contacto."
                  as="span"
                />
              </h2>
            </div>
            <div className="flex flex-col items-start md:items-end">
              <span className="font-neue text-3xl sm:text-4xl font-extrabold text-[#f3f1e9]/20">
                06 MÓDULOS
              </span>
              <span className="font-mono text-[9px] uppercase tracking-widest text-[#f3f1e9]/40 mt-1">
                Autonomía Digital 24/7
              </span>
            </div>
          </div>
        </Reveal>

        <div className="mt-12 mb-14 border-t border-[#f3f1e9]/10" />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {SERVICES.map((s, i) => (
            <Reveal key={s.num} delay={i * 70}>
              <SpotlightCard
                as={Link}
                to={s.to}
                state={{ initialQuery: s.query }}
                className="group flex flex-col justify-between p-7 lg:p-8 min-h-[17rem] no-underline rounded-2xl border border-[#f3f1e9]/10 hover:border-brand/40 transition-all duration-300"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-6">
                    <span className="font-mono text-[11px] font-bold tracking-widest text-brand">
                      {s.num}
                    </span>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 text-[9px] font-mono uppercase tracking-wider font-semibold rounded-full border border-[#f3f1e9]/15 text-[#f3f1e9]/60 group-hover:text-[#f3f1e9] group-hover:border-brand/40 transition-colors">
                      <span className="w-1.5 h-1.5 rounded-full bg-brand" />
                      {s.tag}
                    </span>
                  </div>

                  <h3 className="m-0 font-neue text-2xl lg:text-3xl font-extrabold tracking-tight text-[#f3f1e9] group-hover:text-brand transition-colors">
                    {s.title}
                  </h3>

                  <p className="mt-3.5 m-0 font-neue-text text-sm leading-relaxed text-[#f3f1e9]/60 group-hover:text-[#f3f1e9]/85 transition-colors">
                    {s.desc}
                  </p>
                </div>

                <div className="mt-8 pt-4 border-t border-[#f3f1e9]/10 flex items-center justify-between">
                  <span className="font-mono text-[9px] uppercase tracking-wider text-[#f3f1e9]/40">
                    {s.meta}
                  </span>
                  <span className="text-brand font-bold text-sm transform transition-transform duration-200 group-hover:translate-x-1.5">
                    →
                  </span>
                </div>
              </SpotlightCard>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
