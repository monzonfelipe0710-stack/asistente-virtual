import { useEffect, useRef, useState } from "react";
import Reveal from "../common/Reveal";
import AnimatedText from "./AnimatedText";
import { useCountUp } from "../../hooks/useCountUp";

const PILLARS = [
  {
    num: "01",
    title: "Seguridad",
    quote: "Datos personales resguardados y acceso controlado, sin improvisar el circuito.",
    meta: "Protocolo oficial",
  },
  {
    num: "02",
    title: "Accesibilidad",
    quote: "Pensada para cada persona, desde cualquier dispositivo, a cualquier hora.",
    meta: "Dispositivo libre",
  },
  {
    num: "03",
    title: "Transparencia",
    quote: "Fuentes oficiales y trazabilidad de cada respuesta. Nada fuera de expediente.",
    meta: "Fuentes verificadas",
  },
];

/* ── Stat cell with count-up ─────────────────────────────────────── */
function StatCell({ raw, label }) {
  const ref = useRef(null);
  const [active, setActive] = useState(false);

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

  /* Parse the numeric part and keep the suffix (e.g. "24hs" → 24, "hs") */
  const match = String(raw).match(/^(\d+)(.*)$/);
  const numeric = match ? parseInt(match[1], 10) : null;
  const suffix  = match ? match[2] : raw;
  const prefix  = numeric === null ? raw : "";

  const count = useCountUp(numeric ?? 0, active, 1200);
  const display = numeric !== null ? `${count}${suffix}` : (active ? raw : "0");

  return (
    <div ref={ref} className="trust-stat">
      <span className="trust-stat__val" aria-label={raw}>{display}</span>
      <span className="trust-stat__label">{label}</span>
    </div>
  );
}

/* ── Inline dot-grid for cards ───────────────────────────────────── */
function DotGridMini() {
  return (
    <div
      className="pointer-events-none absolute inset-0"
      aria-hidden="true"
      style={{
        backgroundImage: "radial-gradient(circle, rgba(241,240,232,0.08) 1px, transparent 1px)",
        backgroundSize: "18px 18px",
      }}
    />
  );
}

export default function TrustSection() {
  return (
    <section id="confianza" className="relative py-16 lg:py-28 bg-paper">
      <div className="ed-max section-bleed">

        {/* Header */}
        <Reveal>
          <div className="trust-header">
            <div>
              <p className="light-eyebrow">
                <span className="text-brand">05</span>
                <span className="light-eyebrow-line" aria-hidden="true" />
                Confianza
              </p>
              <h2 className="display-2 text-ink m-0 mt-5 font-neue max-w-3xl">
                <AnimatedText text="El trabajo que se recuerda." as="span" />
              </h2>
            </div>
          </div>
        </Reveal>

        {/* Bento grid */}
        <div className="mt-14 trust-bento">
          {PILLARS.map((p, i) => (
            <Reveal key={p.num} delay={i * 90}>
              <article className="trust-card band-dark relative overflow-hidden group">
                <DotGridMini />
                <div className="relative z-10 flex flex-col h-full p-7 lg:p-9">
                  <div className="flex items-start justify-between gap-4">
                    <span className="trust-card__num">{p.num}</span>
                    <span className="trust-card__meta">{p.meta}</span>
                  </div>
                  <p className="trust-card__quote">"{p.quote}"</p>
                  <p className="trust-card__title mt-auto">{p.title}</p>

                  {/* Hover line — grows from left on hover */}
                  <span className="trust-card__line" aria-hidden="true" />
                </div>
              </article>
            </Reveal>
          ))}
        </div>

        {/* Stats strip */}
        <Reveal delay={180}>
          <div className="trust-stats mt-10">
            {[
              { raw: "24hs",  label: "disponibilidad" },
              { raw: "0",     label: "tiempo de espera" },
              { raw: "1",     label: "asistente, toda la info" },
            ].map((s) => (
              <StatCell key={s.raw + s.label} raw={s.raw} label={s.label} />
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
