import { useRef, useEffect, useState } from "react";
import { motion, useInView } from "motion/react";

/* ─── Count-up animado ────────────────────────────────────────── */
function CountUp({ target, suffix = "", duration = 1.2 }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, amount: 0.5 });
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!inView) return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCount(target);
      return;
    }
    let start = null;
    let raf;
    function step(ts) {
      if (!start) start = ts;
      const progress = Math.min((ts - start) / (duration * 1000), 1);
      const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      setCount(Math.round(eased * target));
      if (progress < 1) raf = requestAnimationFrame(step);
    }
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [inView, target, duration]);

  return (
    <span ref={ref} aria-label={`${target}${suffix}`} style={{ fontVariantNumeric: "tabular-nums" }}>
      {count}{suffix}
    </span>
  );
}

const STATS = [
  { num: 24,   suffix: "hs",  label: "Disponibilidad" },
  { num: 0,    suffix: "",    label: "Tiempo de espera" },
  { num: 16,   suffix: "+",   label: "Organismos" },
  { num: 100,  suffix: "%",   label: "Oficial" },
];

const STEPS = [
  {
    title: "Preguntás en lenguaje natural",
    body: "Sin formularios ni tecnicismos. Escribís lo que necesitás y el sistema entiende el contexto.",
  },
  {
    title: "Obtenés información oficial",
    body: "Requisitos, plazos y organismos directamente de las fuentes de la Administración Pública.",
  },
  {
    title: "Resolvés el trámite",
    body: "Seguimiento de expedientes, formularios y derivación directa al área correspondiente.",
  },
];

export default function IntroSection() {
  return (
    <section id="que-es" className="chatap-experience">
      <div className="ed-max section-bleed">
        <div className="chatap-section-heading">
          <p className="chatap-label">02 · EXPERIENCIA</p>
          <h2>Resolver empieza por poder preguntar.</h2>
          <p>ChatAP traduce la complejidad de los trámites públicos en una conversación clara, orientada y útil.</p>
        </div>

        {/* Pasos */}
        <div className="chatap-experience__steps">
          {STEPS.map((s, i) => (
            <motion.div
              key={s.title}
              className="chatap-step"
              initial={{ opacity: 0, y: 22 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.45, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] }}
            >
              <span className="chatap-step__number" aria-hidden="true">0{i + 1}</span>
              <h3>{s.title}</h3>
              <p>{s.body}</p>
            </motion.div>
          ))}
        </div>

        {/* Stats */}
        <div className="chatap-stats">
          {STATS.map((s) => (
            <div key={s.label} className="chatap-stat">
              <span className="chatap-stat__value">
                <CountUp target={s.num} suffix={s.suffix} />
              </span>
              <span className="chatap-stat__label">{s.label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}