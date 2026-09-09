import { useRef, useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Reveal from "../common/Reveal";
import AnimatedText from "./AnimatedText";
import DotGrid from "./DotGrid";
import { useCountUp } from "../../hooks/useCountUp";

const SERVICES = [
  { num: "01", title: "Trámites",    tag: "Iniciar",    to: "/chat" },
  { num: "02", title: "Información", tag: "Consultar",  to: "/chat" },
  { num: "03", title: "Organismos",  tag: "Directorio", to: "/contacto" },
  { num: "04", title: "Consultas",   tag: "Preguntar",  to: "/chat" },
  { num: "05", title: "Asistencia",  tag: "Soporte",    to: "/contacto" },
  { num: "06", title: "Servicios",   tag: "Canales",    to: "/contacto" },
];

/* ── Magnetic hover row ──────────────────────────────────────────── */
function ServiceRow({ num, title, tag, to }) {
  const ref = useRef(null);

  function onMouseMove(e) {
    const el = ref.current;
    if (!el || window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    const rect = el.getBoundingClientRect();
    /* Vertical offset: how far from the row's vertical centre (normalised -1…1) */
    const relY = ((e.clientY - rect.top) / rect.height - 0.5) * 8;
    el.style.setProperty("--row-tilt", `${relY.toFixed(2)}px`);
  }

  function onMouseLeave() {
    ref.current?.style.setProperty("--row-tilt", "0px");
  }

  return (
    <Link
      ref={ref}
      to={to}
      className="services-row group no-underline"
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
      style={{ "--row-tilt": "0px" }}
    >
      <span className="services-row__num">{num}</span>
      <span
        className="services-row__title"
        style={{ transform: "translateY(var(--row-tilt))" }}
      >
        {title}
      </span>
      <span className="services-row__tag">
        {tag}
        <svg
          className="w-3.5 h-3.5 opacity-60 transition-transform duration-200 group-hover:translate-x-1"
          fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
        </svg>
      </span>
    </Link>
  );
}

/* ── Counter for "06 canales" ────────────────────────────────────── */
function ServiceCount() {
  const ref = useRef(null);
  const [active, setActive] = useState(false);
  const count = useCountUp(6, active, 900);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined" ||
        window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
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

  return (
    <p ref={ref} className="services-count">
      <span className="services-count__num" aria-label="06">
        {String(count).padStart(2, "0")}
      </span>
      <span className="services-count__label">canales</span>
    </p>
  );
}

export default function ServicesSection() {
  return (
    <section id="servicios" className="relative overflow-hidden band-dark py-16 lg:py-24">
      <DotGrid color="rgba(241,240,232,0.05)" />

      <div className="ed-max section-bleed relative z-10">
        {/* Header */}
        <Reveal>
          <div className="services-header">
            <div>
              <p className="services-eyebrow">
                <span className="text-brand">03</span>
                <span className="services-eyebrow-line" aria-hidden="true" />
                Servicios
              </p>
              <h2 className="display-2 text-[#f3f1e9] m-0 mt-5 font-neue max-w-4xl">
                <AnimatedText
                  text="Cada decisión, ya tomada. Para ir a lo que importa."
                  as="span"
                />
              </h2>
            </div>
            <ServiceCount />
          </div>
        </Reveal>

        {/* Divider */}
        <div className="mt-14 border-t border-[#f3f1e9]/10" />

        {/* Service rows — staggered Reveal */}
        <ul className="m-0 p-0 list-none">
          {SERVICES.map((s, i) => (
            <Reveal key={s.num} as="li" delay={i * 60}>
              <ServiceRow {...s} />
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  );
}
