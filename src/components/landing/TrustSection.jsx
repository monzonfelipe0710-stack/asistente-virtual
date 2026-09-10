import { useEffect, useRef, useState } from "react";
import Reveal from "../common/Reveal";
import AnimatedText from "./AnimatedText";
import SpotlightCard from "../common/SpotlightCard";
import { useCountUp } from "../../hooks/useCountUp";

const PILLARS = [
  {
    num: "01",
    title: "Seguridad y Cifrado",
    quote: "Datos personales resguardados bajo estándares provinciales y acceso autenticado sin riesgos.",
    meta: "Protocolo Oficial Cifrado",
    badge: "100% Confidencial",
  },
  {
    num: "02",
    title: "Accesibilidad Universal",
    quote: "Diseñado para cada ciudadano formoseño, sin importar dispositivo, edad o conectividad.",
    meta: "Ley Nacional 26.378",
    badge: "Dispositivo Libre",
  },
  {
    num: "03",
    title: "Trazabilidad Total",
    quote: "Fuentes oficiales verificadas e interoperabilidad directa con SIGED. Cada respuesta tiene respaldo.",
    meta: "Documentación Certificada",
    badge: "Sin Intermediarios",
  },
];

function StatCell({ raw, label }) {
  const ref = useRef(null);
  const [active, setActive] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined" ||
        window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setActive(true);
      return;
    }
    const io = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setActive(true); io.disconnect(); } },
      { threshold: 0.5 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const match = String(raw).match(/^(\d+)(.*)$/);
  const numeric = match ? parseInt(match[1], 10) : null;
  const rawSuffix = match ? match[2] : "";

  const count = useCountUp(numeric ?? 0, active, 1200);
  const display = numeric !== null ? `${count}${rawSuffix}` : (active ? raw : "0");

  return (
    <div ref={ref} className="trust-stat bg-paper p-6 sm:p-8 flex flex-col justify-between">
      <span className="font-neue text-4xl sm:text-5xl font-black tracking-tight text-ink" aria-label={raw}>
        {display}
      </span>
      <span className="mt-3 font-mono text-[10px] uppercase tracking-widest text-muted font-bold">
        {label}
      </span>
    </div>
  );
}

export default function TrustSection() {
  return (
    <section id="confianza" className="relative py-20 lg:py-32 bg-paper border-b border-line/40">
      <div className="ed-max section-bleed">
        <Reveal>
          <div className="trust-header">
            <div>
              <p className="light-eyebrow">
                <span className="text-brand">05</span>
                <span className="light-eyebrow-line" aria-hidden="true" />
                Seguridad & Compromiso
              </p>
              <h2 className="display-2 text-ink m-0 mt-5 font-neue max-w-3xl">
                <AnimatedText text="Un Estado digital que cuida a cada persona." as="span" />
              </h2>
            </div>
          </div>
        </Reveal>

        <div className="mt-14 grid grid-cols-1 md:grid-cols-3 gap-5">
          {PILLARS.map((p, i) => (
            <Reveal key={p.num} delay={i * 90}>
              <SpotlightCard className="group flex flex-col justify-between p-8 lg:p-9 min-h-[22rem] rounded-2xl border border-[#f3f1e9]/12 bg-[#141414]">
                <div>
                  <div className="flex items-start justify-between gap-4">
                    <span className="font-mono text-xs font-bold tracking-widest text-brand">
                      {p.num}
                    </span>
                    <span className="px-3 py-1 font-mono text-[9px] uppercase tracking-wider text-[#f3f1e9]/70 border border-white/10 rounded-full group-hover:border-brand/30 transition-colors">
                      {p.badge}
                    </span>
                  </div>

                  <p className="mt-8 font-neue text-lg lg:text-xl font-medium tracking-tight leading-relaxed text-[#f3f1e9]/90 group-hover:text-[#f3f1e9] transition-colors">
                    &ldquo;{p.quote}&rdquo;
                  </p>
                </div>

                <div className="mt-8 pt-4 border-t border-white/10">
                  <p className="m-0 font-neue font-bold text-base text-[#f3f1e9] tracking-tight group-hover:text-brand transition-colors">
                    {p.title}
                  </p>
                  <p className="mt-1 m-0 font-mono text-[9px] uppercase tracking-wider text-[#f3f1e9]/40">
                    {p.meta}
                  </p>
                </div>
              </SpotlightCard>
            </Reveal>
          ))}
        </div>

        <Reveal delay={180}>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-px bg-line mt-12 border border-line rounded-2xl overflow-hidden shadow-sm">
            <StatCell raw="24hs" label="Disponibilidad permanente" />
            <StatCell raw="0" label="Minutos de fila o espera" />
            <StatCell raw="100%" label="Trazabilidad documental" />
          </div>
        </Reveal>

        <Reveal delay={240}>
          <div className="mt-14 p-6 border border-line bg-mist/30 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center bg-ink text-paper font-black text-sm font-neue rounded-xl" aria-hidden="true">
                AP
              </span>
              <div>
                <p className="m-0 font-neue font-bold text-sm text-ink uppercase tracking-tight">
                  Marco Institucional Oficial
                </p>
                <p className="m-0 font-mono text-[9px] text-faint uppercase tracking-wider mt-0.5">
                  Subsecretaría de Recursos Humanos · Gobierno de la Provincia de Formosa
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-widest text-[#18bc42] bg-[#18bc42]/10 px-3.5 py-1.5 border border-[#18bc42]/30 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-[#18bc42] animate-pulse" />
              Validado por Recursos Humanos Provincial
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
