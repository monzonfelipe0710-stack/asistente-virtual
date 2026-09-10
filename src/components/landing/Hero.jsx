import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import DotGrid from "./DotGrid";
import AnimatedText from "./AnimatedText";

const PROJECT_PILLARS = [
  { label: "Expedientes SIGED", query: "¿Cómo consultar el estado de un expediente SIGED?" },
  { label: "Recibos de Haberes", query: "¿Cómo descargar mi recibo de sueldo oficial?" },
  { label: "Régimen de Licencias", query: "Requisitos para solicitar licencia médica" },
  { label: "Mesa de Entradas", query: "Trámites en Mesa General de Entradas" },
];

const NETWORK_NODES = [
  { id: "siged", name: "Sistema SIGED", tag: "EXPEDIENTES", status: "Conectado", icon: "🏛️" },
  { id: "rrhh", name: "Subsecretaría RRHH", tag: "PERSONAL", status: "Activo", icon: "👥" },
  { id: "haberes", name: "Liquidación & Haberes", tag: "RECIBOS PDF", status: "En línea", icon: "📄" },
  { id: "mesa", name: "Mesa de Entradas", tag: "TRAZABILIDAD", status: "Operativo", icon: "📥" },
];

export default function Hero() {
  const [ready, setReady] = useState(false);
  const [prompt, setPrompt] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const id = requestAnimationFrame(() => setReady(true));
    return () => cancelAnimationFrame(id);
  }, []);

  function handlePromptSubmit(e) {
    e.preventDefault();
    const q = prompt.trim();
    if (!q) {
      navigate("/chat");
      return;
    }
    navigate("/chat", { state: { initialQuery: q } });
  }

  function handleChipClick(query) {
    navigate("/chat", { state: { initialQuery: query } });
  }

  function scrollToBot() {
    document.getElementById("nuestro-bot")?.scrollIntoView({ behavior: "smooth" });
  }

  return (
    <section
      id="inicio"
      aria-label="Presentación del Proyecto ChatAP"
      className="hero-split relative"
    >
      {/* ── LEFT — cream: Presentación del Proyecto ────────────────── */}
      <div className="hero-split__left flex flex-col justify-between px-6 pb-12 pt-32 sm:px-10 lg:px-16 lg:pt-36">

        {/* Project Header Eyebrow — slot 0 */}
        <div className={`hero-eyebrow m-0 items-center flex-wrap gap-2 ${ready ? "hero-enter-0" : "opacity-0"}`}>
          <span className="hero-eyebrow-dot" aria-hidden="true" />
          <span className="font-bold text-ink tracking-widest">PROYECTO PROVINCIAL</span>
          <span className="text-line">/</span>
          <span className="text-muted font-medium">Modernización & Transformación Pública</span>
          <span className="text-line">/</span>
          <span className="text-brand font-semibold">Formosa 2026</span>
        </div>

        {/* Project Mission & Vision Headline — slots 1-3 */}
        <div className="my-auto py-8 lg:py-10">
          <h1 className={`hero-headline m-0 font-neue text-ink ${ready ? "hero-enter-1" : "opacity-0"}`}>
            <AnimatedText text="El Estado moderno que responde al ciudadano." as="span" wordDelay={40} />
          </h1>

          <p className={`hero-lead mt-6 m-0 max-w-xl text-muted font-neue-text ${ready ? "hero-enter-2" : "opacity-0"}`}>
            <strong className="text-ink font-bold">ChatAP</strong> es la iniciativa de transformación digital de la <strong className="text-ink font-semibold">Subsecretaría de Recursos Humanos</strong> del Gobierno de Formosa. Unificamos la gestión de expedientes SIGED, recibos de haberes y trámites en una plataforma ágil, segura y sin filas presenciales.
          </p>

          {/* Search/Prompt Box for Provincial Procedures */}
          <div className={`mt-8 max-w-xl ${ready ? "hero-enter-3" : "opacity-0"}`}>
            <form
              onSubmit={handlePromptSubmit}
              className="hero-prompt-bar p-1.5 sm:p-2"
            >
              <span className="pl-3 pr-2 text-brand" aria-hidden="true">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </span>
              <input
                type="text"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Buscador de trámites, expedientes o normativa..."
                className="w-full bg-transparent px-2 py-2 text-sm text-ink placeholder:text-faint focus:outline-none font-neue-text"
                aria-label="Buscar trámites o consultas"
              />
              <button
                type="submit"
                className="flex items-center gap-1.5 bg-ink hover:bg-brand text-paper hover:text-ink px-4 py-2.5 rounded-full font-mono text-[11px] uppercase tracking-wider font-bold transition-all duration-200 cursor-pointer shrink-0"
              >
                <span>Consultar</span>
                <span className="font-sans">→</span>
              </button>
            </form>

            {/* Quick procedural chips */}
            <div className="mt-3.5 flex flex-wrap items-center gap-2">
              <span className="font-mono text-[9px] uppercase tracking-widest text-faint mr-1">
                Ejes del proyecto:
              </span>
              {PROJECT_PILLARS.map((item) => (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => handleChipClick(item.query)}
                  className="prompt-chip"
                >
                  <span>{item.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Project Action CTAs */}
          <div className={`mt-8 flex flex-wrap items-center gap-4 ${ready ? "hero-enter-3" : "opacity-0"}`}>
            <button
              type="button"
              onClick={scrollToBot}
              className="hero-btn-primary group"
            >
              Conocé a nuestro Bot
              <span className="hero-btn-arrow" aria-hidden="true">↓</span>
            </button>
            <Link to="/chat" className="hero-btn-ghost">
              Ir directo al Asistente
            </Link>
          </div>
        </div>

        {/* Project Meta Bar — slot 4 */}
        <div className={`hero-meta-bar flex-wrap gap-4 ${ready ? "hero-enter-4" : "opacity-0"}`}>
          <span className="font-bold text-ink">Proyecto Oficial ChatAP</span>
          <span className="hero-meta-sep" aria-hidden="true" />
          <span className="flex items-center gap-1.5 font-semibold text-[#18bc42]">
            <span className="hero-status-dot" aria-hidden="true" />
            OPERATIVO 24/7 EN TODA LA PROVINCIA
          </span>
          <span className="hero-meta-sep hidden sm:inline" aria-hidden="true" />
          <span className="text-faint hidden sm:inline">SUBSEC. DE RECURSOS HUMANOS</span>
        </div>
      </div>

      {/* ── RIGHT — dark: Arquitectura y Red Digital del Proyecto ─── */}
      <div className="hero-split__right relative overflow-hidden flex flex-col justify-between p-8 sm:p-12">
        <DotGrid color="rgba(241, 240, 232, 0.08)" />

        {/* Ambient background glow */}
        <div
          className="ambient-glow-brand absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[480px] h-[480px] rounded-full"
          aria-hidden="true"
        />

        {/* Top Header of the Digital Hub */}
        <div className="relative z-10 flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#18bc42] animate-pulse" />
            <span className="font-mono text-[10px] uppercase tracking-widest text-[#f3f1e9] font-bold">
              Red Digital Integrada · Formosa
            </span>
          </div>
          <span className="font-mono text-[9px] uppercase tracking-wider px-2.5 py-0.5 bg-brand/20 text-brand border border-brand/40 rounded-full">
            SIGED v2.4 Conectado
          </span>
        </div>

        {/* Center: Interactive Project Topology / Nodes */}
        <div className="relative z-10 my-auto py-8">
          <div className="text-center mb-8">
            <span className="font-mono text-[9px] uppercase tracking-[0.28em] text-brand font-bold">
              Ecosistema Gubernamental
            </span>
            <h3 className="font-neue text-2xl sm:text-3xl font-extrabold text-[#f3f1e9] m-0 mt-1">
              Todos los organismos en una sola plataforma
            </h3>
            <p className="font-neue-text text-xs text-[#f3f1e9]/60 max-w-sm mx-auto mt-2 m-0">
              Integración nativa con los sistemas de gestión, validación de identidad provincial y expediente digital.
            </p>
          </div>

          {/* 4 Connected Nodes Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 max-w-lg mx-auto">
            {NETWORK_NODES.map((node) => (
              <div
                key={node.id}
                className="p-4 bg-[#181818] border border-white/10 hover:border-brand/40 transition-colors flex items-center justify-between rounded-xl"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl" aria-hidden="true">{node.icon}</span>
                  <div>
                    <p className="m-0 font-neue text-xs font-bold text-[#f3f1e9]">
                      {node.name}
                    </p>
                    <p className="m-0 font-mono text-[8px] uppercase tracking-wider text-brand font-semibold">
                      {node.tag}
                    </p>
                  </div>
                </div>
                <span className="font-mono text-[8px] uppercase tracking-wider text-[#18bc42] px-2 py-0.5 bg-[#18bc42]/10 border border-[#18bc42]/30 rounded-full">
                  {node.status}
                </span>
              </div>
            ))}
          </div>

          {/* Central Platform Seal */}
          <div className="mt-8 text-center">
            <button
              type="button"
              onClick={scrollToBot}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand/10 border border-brand/30 text-brand hover:bg-brand hover:text-ink font-mono text-[10px] uppercase tracking-wider font-bold transition-all cursor-pointer rounded-full"
            >
              <span>Conocé el Asistente Virtual que orquesta este sistema</span>
              <span>↓</span>
            </button>
          </div>
        </div>

        {/* Bottom Telemetry Bar */}
        <div className="relative z-10 pt-4 border-t border-white/10 flex flex-wrap items-center justify-between gap-4 font-mono text-[9px] uppercase tracking-widest text-[#f3f1e9]/50">
          <span>+14.800 Trámites Digitales</span>
          <span>Latencia &lt; 90ms</span>
          <span>Cifrado Provincial Seguro</span>
        </div>
      </div>
    </section>
  );
}