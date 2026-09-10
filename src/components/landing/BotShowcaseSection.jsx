import { useState } from "react";
import { Link } from "react-router-dom";
import Reveal from "../common/Reveal";
import AnimatedText from "./AnimatedText";
import ChatBotAvatar from "../ChatBotAvatar";
import SpotlightCard from "../common/SpotlightCard";

const BOT_EMOTIONS = [
  { id: "happy", label: "Saludar", icon: "👋", reaction: "happy" },
  { id: "thinking", label: "Analizar", icon: "🧠", reaction: "thinking" },
  { id: "wink", label: "Cómplice", icon: "😉", reaction: "wink" },
  { id: "excited", label: "Entusiasmo", icon: "⚡", reaction: "excited" },
  { id: "attention", label: "Atento", icon: "👁️", reaction: "attention" },
];

const BOT_TRAITS = [
  {
    icon: "📜",
    title: "Entrenado en Normativa Formoseña",
    desc: "Comprende el marco legal de la provincia, estatutos de empleados públicos, resoluciones ministeriales y circuitos del SIGED.",
  },
  {
    icon: "🎙️",
    title: "Voz Neural y Dictado por Micrófono",
    desc: "Inclusión sin barreras: podés hablarle con tu voz natural y escuchar las respuestas leídas con cadencia clara.",
  },
  {
    icon: "⚡",
    title: "Resolución sin Esperas (0.6s)",
    desc: "Acceso instantáneo a recibos con hash criptográfico, estado de expedientes y documentación oficial validada.",
  },
  {
    icon: "🤝",
    title: "Empatía y Lenguaje Ciudadano",
    desc: "Diseñado para explicar gestiones difíciles en palabras sencillas, guiándote paso a paso como un asesor personal.",
  },
];

export default function BotShowcaseSection() {
  const [activeReaction, setActiveReaction] = useState("idle");
  const [activeEmotionLabel, setActiveEmotionLabel] = useState("Modo Escucha Activa");

  function triggerReaction(reaction, label) {
    setActiveReaction(reaction);
    setActiveEmotionLabel(`Reacción: ${label}`);
    // Auto reset after 3 seconds
    setTimeout(() => {
      setActiveReaction("idle");
      setActiveEmotionLabel("Modo Escucha Activa");
    }, 3200);
  }

  return (
    <section id="nuestro-bot" className="relative overflow-hidden band-dark py-24 lg:py-36 border-y border-[#f3f1e9]/10">
      {/* Background ambient lighting */}
      <div
        className="ambient-glow-brand absolute top-1/2 left-1/4 -translate-y-1/2 w-[520px] h-[520px] rounded-full"
        aria-hidden="true"
      />

      <div className="ed-max section-bleed relative z-10">

        {/* Section Header */}
        <Reveal>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-12 border-b border-[#f3f1e9]/10">
            <div>
              <p className="services-eyebrow">
                <span className="text-brand">02</span>
                <span className="services-eyebrow-line" aria-hidden="true" />
                El Asistente Inteligente
              </p>
              <h2 className="display-2 text-[#f3f1e9] m-0 mt-5 font-neue max-w-3xl">
                <AnimatedText
                  text="Conocé a ChatAP: La inteligencia artificial al servicio de tu tiempo."
                  as="span"
                />
              </h2>
            </div>
            <div className="flex flex-col items-start md:items-end">
              <span className="font-mono text-[9px] uppercase tracking-widest text-[#18bc42] bg-[#18bc42]/10 px-3 py-1 border border-[#18bc42]/30 flex items-center gap-1.5 font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-[#18bc42] animate-pulse" />
                ASISTENTE PROVINCIAL ACTIVO
              </span>
              <span className="font-mono text-[9px] uppercase tracking-wider text-[#f3f1e9]/40 mt-2">
                Subsecretaría de Recursos Humanos
              </span>
            </div>
          </div>
        </Reveal>

        {/* Main Bot Showcase Stage (Grid) */}
        <div className="mt-16 grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">

          {/* Left Column: Interactive Avatar Stage (5 cols) */}
          <div className="lg:col-span-5 flex flex-col items-center text-center">
            <Reveal>
              <div className="relative p-10 sm:p-14 bg-[#141414] border border-[#f3f1e9]/15 shadow-2xl flex flex-col items-center w-full max-w-md mx-auto rounded-3xl">
                {/* Tech corners */}
                <span className="absolute top-3 left-4 font-mono text-[8px] text-[#f3f1e9]/30">SYS//01</span>
                <span className="absolute top-3 right-4 font-mono text-[8px] text-[#f3f1e9]/30">IA.FORMOSA</span>
                <span className="absolute bottom-3 left-4 font-mono text-[8px] text-[#f3f1e9]/30">LAT_90MS</span>
                <span className="absolute bottom-3 right-4 font-mono text-[8px] text-[#f3f1e9]/30">SIGED_OK</span>

                {/* Avatar container */}
                <div className="relative my-4 flex items-center justify-center">
                  {/* Subtle glowing ring behind */}
                  <div className="absolute w-48 h-48 rounded-full bg-brand/10 filter blur-xl animate-pulse" />

                  <ChatBotAvatar
                    size={168}
                    reaction={activeReaction}
                    followMouse={true}
                  />
                </div>

                {/* Live reaction status badge */}
                <div className="mt-4 px-3.5 py-1.5 bg-white/5 border border-white/10 text-brand font-mono text-[10px] uppercase tracking-widest font-semibold flex items-center gap-2 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-brand animate-ping" />
                  <span>{activeEmotionLabel}</span>
                </div>

                {/* Interactive Emotion Buttons */}
                <div className="mt-8 w-full">
                  <p className="font-mono text-[9px] uppercase tracking-widest text-[#f3f1e9]/40 mb-3">
                    Hacé clic para interactuar con ChatAP:
                  </p>
                  <div className="flex flex-wrap justify-center gap-2">
                    {BOT_EMOTIONS.map((emo) => (
                      <button
                        key={emo.id}
                        type="button"
                        onClick={() => triggerReaction(emo.reaction, emo.label)}
                        className="px-3.5 py-1.5 bg-[#1e1e1e] hover:bg-brand text-[#f3f1e9] hover:text-[#171717] font-mono text-[10px] uppercase tracking-wider font-semibold border border-white/10 hover:border-brand transition-all cursor-pointer flex items-center gap-1.5 rounded-full"
                      >
                        <span aria-hidden="true">{emo.icon}</span>
                        <span>{emo.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Prompt instruction */}
                <p className="mt-6 font-neue-text text-xs text-[#f3f1e9]/50 m-0">
                  ChatAP sigue el cursor con la mirada y reacciona a cada consulta con expresiones adaptativas.
                </p>
              </div>
            </Reveal>
          </div>

          {/* Right Column: Traits and Capabilities (7 cols) */}
          <div className="lg:col-span-7 flex flex-col gap-6">
            <Reveal delay={100}>
              <div className="mb-4">
                <span className="font-mono text-[10px] uppercase tracking-[0.24em] text-brand font-bold">
                  ¿Quién es ChatAP?
                </span>
                <h3 className="font-neue text-3xl sm:text-4xl font-extrabold text-[#f3f1e9] m-0 mt-2 tracking-tight">
                  Más que un asistente: tu guía oficial dentro del Estado.
                </h3>
                <p className="font-neue-text text-base text-[#f3f1e9]/65 mt-4 leading-relaxed m-0">
                  Desarrollado específicamente para la Administración Pública de Formosa, ChatAP une el conocimiento normativo de la Subsecretaría de Recursos Humanos con tecnología de inteligencia artificial para responder con precisión jurídica en lenguaje claro y accesible.
                </p>
              </div>
            </Reveal>

            {/* 4 Capability Cards in a 2x2 grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {BOT_TRAITS.map((trait, idx) => (
                <Reveal key={trait.title} delay={150 + idx * 60}>
                  <SpotlightCard className="p-6 bg-[#161616] border border-white/10 flex flex-col justify-between min-h-[12rem] group">
                    <div>
                      <span className="text-2xl mb-3 block" aria-hidden="true">
                        {trait.icon}
                      </span>
                      <h4 className="font-neue font-bold text-lg text-[#f3f1e9] m-0 group-hover:text-brand transition-colors">
                        {trait.title}
                      </h4>
                      <p className="font-neue-text text-xs text-[#f3f1e9]/60 mt-2 leading-relaxed m-0">
                        {trait.desc}
                      </p>
                    </div>
                  </SpotlightCard>
                </Reveal>
              ))}
            </div>

            {/* CTAs */}
            <Reveal delay={400}>
              <div className="mt-6 flex flex-wrap items-center gap-4">
                <Link to="/chat" className="hero-btn-primary group">
                  Iniciar conversación con ChatAP
                  <span className="hero-btn-arrow" aria-hidden="true">→</span>
                </Link>
                <Link
                  to="/chat"
                  state={{ initialQuery: "¿Qué trámites puedo realizar con tu ayuda?" }}
                  className="hero-btn-ghost text-white border-white/20 hover:bg-white/10"
                >
                  Ver qué trámites puede hacer →
                </Link>
              </div>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}