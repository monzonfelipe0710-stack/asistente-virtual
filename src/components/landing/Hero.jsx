import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import DotGrid from "./DotGrid";
import AnimatedText from "./AnimatedText";
import OrbitRings from "./OrbitRings";
import ChatBotAvatar from "../ChatBotAvatar";

/**
 * Hero — split layout (left cream / right dark).
 *
 * Perf notes:
 * - OrbitRings SVG animates with CSS only (no JS loop, GPU-composited transform).
 * - ChatBotAvatar runs its own rAF loop but only when visible (visibility API).
 * - All entrance animations are pure CSS (no JS spring libs).
 * - `will-change: opacity, transform` is set via CSS class only during animation,
 *   removed afterward via `animation-fill-mode: both` with opacity→1 as final state.
 */
export default function Hero() {
  const [ready, setReady] = useState(false);

  /* Trigger entrance sequence one frame after mount so the initial
     paint completes first — avoids a flash of un-styled content. */
  useEffect(() => {
    const id = requestAnimationFrame(() => setReady(true));
    return () => cancelAnimationFrame(id);
  }, []);

  function scrollNext() {
    document.getElementById("que-es")?.scrollIntoView({ behavior: "smooth" });
  }

  return (
    <section
      id="inicio"
      aria-label="Presentación de ChatAP"
      className="hero-split"
    >
      {/* ── LEFT — cream ─────────────────────────────────────────── */}
      <div className="hero-split__left flex flex-col justify-between px-6 pb-10 pt-32 sm:px-10 lg:px-16 lg:pt-40">

        {/* Eyebrow — slot 0 */}
        <p className={`hero-eyebrow m-0 ${ready ? "hero-enter-0" : "opacity-0"}`}>
          <span className="hero-eyebrow-dot" aria-hidden="true" />
          Subsecretaría de Recursos Humanos · Formosa
        </p>

        {/* Headline block — slots 1-3 */}
        <div className="my-auto py-12">
          <h1 className={`hero-headline m-0 font-neue text-ink ${ready ? "hero-enter-1" : "opacity-0"}`}>
            <AnimatedText text="El Estado que responde." as="span" wordDelay={42} />
          </h1>

          <p className={`hero-lead mt-8 m-0 max-w-sm text-muted font-neue-text ${ready ? "hero-enter-2" : "opacity-0"}`}>
            Trámites, información y asistencia de la Administración Pública de
            Formosa. En lenguaje claro, sin filas, las 24 horas.
          </p>

          {/* CTAs */}
          <div className={`mt-10 flex flex-wrap items-center gap-3 ${ready ? "hero-enter-3" : "opacity-0"}`}>
            <Link to="/chat" className="hero-btn-primary group">
              Empezar
              <span className="hero-btn-arrow" aria-hidden="true">→</span>
            </Link>
            <Link to="/login" className="hero-btn-ghost">
              Ingresar
            </Link>
          </div>
        </div>

        {/* Bottom meta bar — slot 4 */}
        <div className={`hero-meta-bar ${ready ? "hero-enter-4" : "opacity-0"}`}>
          <span>ChatAP v1.0</span>
          <span className="hero-meta-sep" aria-hidden="true" />
          <span className="flex items-center gap-1.5">
            <span className="hero-status-dot" aria-hidden="true" />
            EN LÍNEA
          </span>
          <span className="hero-meta-sep" aria-hidden="true" />
          <button
            type="button"
            onClick={scrollNext}
            className="hover:text-ink transition-colors cursor-pointer bg-transparent border-0 p-0 font-mono text-[10px] uppercase tracking-[0.2em] text-faint"
          >
            Explorar ↓
          </button>
        </div>
      </div>

      {/* ── RIGHT — dark with dot grid + avatar + orbit rings ────── */}
      <div className="hero-split__right relative overflow-hidden">
        {/* Dot texture */}
        <DotGrid />

        {/* Orbit rings + avatar centred */}
        <div className="absolute inset-0 flex items-center justify-center">
          {/* Orbit rings */}
          <OrbitRings rings={6} className="hero-orbit" />

          {/* Avatar at the centre — the rings revolve around it */}
          <div
            className={`absolute z-10 flex items-center justify-center hero-avatar-wrap ${ready ? "hero-enter-avatar" : "opacity-0"}`}
            aria-hidden="true"
          >
            <ChatBotAvatar
              size={140}
              reaction="idle"
              followMouse
            />
          </div>
        </div>

        {/* Top-left terminal badge */}
        <div className={`absolute top-8 left-8 flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.2em] text-[#f3f1e9]/40 ${ready ? "hero-enter-0" : "opacity-0"}`}>
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#18bc42] animate-pulse-dot" aria-hidden="true" />
          Sistema activo
        </div>

        {/* Corner label */}
        <p
          className="absolute bottom-8 right-8 m-0 font-mono text-[9px] uppercase tracking-[0.26em] text-[#f3f1e9]/30"
          aria-hidden="true"
        >
          ChatAP · AR
        </p>

        {/* Large ghost watermark */}
        <p
          className="pointer-events-none absolute -bottom-2 left-0 right-0 m-0 select-none text-center font-neue font-black leading-none tracking-[-0.06em] text-[22vw] text-[#f3f1e9]/[0.04]"
          aria-hidden="true"
        >
          AP
        </p>
      </div>
    </section>
  );
}
