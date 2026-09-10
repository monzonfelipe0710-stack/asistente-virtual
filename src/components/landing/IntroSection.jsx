import { useEffect, useRef, useState } from "react";
import Reveal from "../common/Reveal";
import AnimatedText from "./AnimatedText";

const SPECS = [
  { k: "CHATAP",  v: "1.0" },
  { k: "ESTADO",  v: "EN LÍNEA" },
  { k: "VOZ",     v: "ACTIVA" },
  { k: "MESA",    v: "PDF" },
  { k: "SIGED",   v: "CONECTADO" },
  { k: "DERIVA",  v: "0 COLA" },
];

const PROBLEMS = [
  { num: "001", title: "Hacer fila para una consulta de dos minutos",           time: "∞ HRS" },
  { num: "002", title: "No saber qué documentación llevar a mesa de entrada",   time: "~3 HRS" },
  { num: "003", title: "Horario de atención que no coincide con el tuyo",       time: "~4 HRS" },
  { num: "004", title: "Buscar un trámite en portales que no se hablan",        time: "~3 HRS" },
  { num: "005", title: "Reescribir la misma solicitud porque faltó un dato",    time: "~2 HRS" },
  { num: "006", title: "No encontrar a quién preguntar, ni a dónde ir",         time: "~2 HRS" },
];

/* ─── Spec strip cell — staggered entrance on first intersection ── */
function SpecCell({ label, value, index }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined" ||
        window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
      setVisible(true);
      return;
    }
    const io = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); io.disconnect(); } },
      { threshold: 0.3 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`spec-strip__cell ${index < SPECS.length - 1 ? "spec-strip__cell--border" : ""} ${
        visible ? "spec-cell-enter" : "opacity-0"
      }`}
      style={{ animationDelay: visible ? `${index * 55}ms` : "0ms" }}
    >
      <span className="spec-strip__key">{label}</span>
      <span className="spec-strip__val">{value}</span>
    </div>
  );
}

/* ─── Terminal rows — wipe-in when terminal enters viewport ──── */
function TerminalRows({ visible }) {
  return (
    <ul className="m-0 p-0 list-none">
      {PROBLEMS.map((p, i) => (
        <li
          key={p.num}
          className={`problems-terminal__row ${visible ? "terminal-row-enter" : "opacity-0"}`}
          style={{ animationDelay: `${i * 65}ms` }}
        >
          <span className="problems-terminal__col-num text-brand">{p.num}</span>
          <span className="problems-terminal__col-title">{p.title}</span>
          <span className="problems-terminal__col-time text-bad">{p.time}</span>
        </li>
      ))}
    </ul>
  );
}

export default function IntroSection() {
  const terminalRef = useRef(null);
  const [terminalVisible, setTerminalVisible] = useState(false);

  useEffect(() => {
    const el = terminalRef.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined" ||
        window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
      setTerminalVisible(true);
      return;
    }
    const io = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setTerminalVisible(true); io.disconnect(); } },
      { threshold: 0.1 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <section id="que-es" className="relative overflow-hidden py-16 lg:py-28 bg-paper">
      <div className="ed-max section-bleed">

        {/* ── Spec strip — each cell staggers in ─────────────────── */}
        <div className="spec-strip">
          {SPECS.map((s, i) => (
            <SpecCell key={s.k} label={s.k} value={s.v} index={i} />
          ))}
        </div>

        {/* ── Headline + body ──────────────────────────────────────── */}
        <Reveal>
          <div className="mt-16 lg:mt-24 grid grid-cols-1 lg:grid-cols-[1fr_auto] lg:items-end gap-8">
            <div>
              <p className="intro-kicker m-0">Problemas habituales</p>
              <h2 className="display-2 text-ink m-0 mt-5 font-neue max-w-4xl">
                <AnimatedText
                  text="La mesa de entrada sola te cuesta días. Cada vez."
                  as="span"
                />
              </h2>
            </div>
            <p className="m-0 text-sm font-mono uppercase tracking-[0.2em] text-faint lg:text-right lg:pb-2 lg:max-w-[18rem]">
              Tiempo estimado<br />perdido por gestión
            </p>
          </div>

          <p className="mt-8 max-w-2xl m-0 editorial-text">
            Nunca es lo fácil lo que duele. Es no saber qué pedir, a quién, con qué
            papeles. Es el horario que cierra. Es la información que cambia y nadie
            te avisa. ChatAP concentra eso: consulta, trámite y documentación en
            lenguaje claro, a cualquier hora.
          </p>
        </Reveal>

        {/* ── Problems terminal ────────────────────────────────────── */}
        <Reveal delay={80}>
          <div ref={terminalRef} className="problems-terminal mt-14">
            {/* Chrome bar */}
            <div className="problems-terminal__bar">
              <span className="problems-terminal__dot" style={{ background: "#ff5f57" }} />
              <span className="problems-terminal__dot" style={{ background: "#febc2e" }} />
              <span className="problems-terminal__dot" style={{ background: "#28c840" }} />
              <span className="ml-4 font-mono text-[10px] uppercase tracking-[0.2em] text-[#f3f1e9]/35">
                problemas — chatap.gob.ar
              </span>
            </div>

            {/* Header */}
            <div className="problems-terminal__header">
              <span className="problems-terminal__col-num">#</span>
              <span className="problems-terminal__col-title">DESCRIPCIÓN</span>
              <span className="problems-terminal__col-time">TIEMPO</span>
            </div>

            {/* Staggered rows */}
            <TerminalRows visible={terminalVisible} />

            <div className="problems-terminal__foot flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 bg-[#111]">
              <span className="inline-flex items-center gap-2 font-mono text-[11px] text-[#f3f1e9]">
                <span className="w-2 h-2 rounded-full bg-brand animate-pulse-dot" aria-hidden="true" />
                <span>Tiempo tradicional acumulado: <strong className="text-bad">~14 horas</strong></span>
                <span className="text-white/20">→</span>
                <span>Con ChatAP: <strong className="text-[#18bc42]">&lt; 60 segundos</strong></span>
              </span>
              <a
                href="/chat"
                className="font-mono text-[10px] uppercase tracking-wider text-brand hover:underline flex items-center gap-1.5"
              >
                <span>Resolver mi trámite ahora</span>
                <span>→</span>
              </a>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
