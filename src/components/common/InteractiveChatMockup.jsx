import { useState, useEffect, useRef } from "react";
import ChatBotAvatar from "../ChatBotAvatar";

const SCENARIOS = [
  {
    id: "licencia",
    title: "Licencia médica",
    badge: "Salud y Personal",
    user1: "¿Cómo solicito una licencia médica y qué documentación necesito?",
    time1: "10:14",
    bot1: "Para gestionar una licencia médica oficial debés presentar dentro de las 48 hs hábiles el certificado médico con diagnóstico y el Formulario F-04.",
    chips: [
      { label: "📥 Descargar Formulario F-04", action: "download" },
      { label: "📋 Requisitos completos", action: "info" },
      { label: "📍 Mesa de Entradas Digital", action: "link" },
    ],
    timeBot1: "10:14",
    user2: "¿Puedo hacer la presentación de manera 100% digital?",
    time2: "10:15",
    bot2: "¡Sí! Podés adjuntar el formulario y el certificado escaneado a través de MiPortal Formosa con tu Clave Fiscal provincial, sin necesidad de acercarte a la oficina.",
    timeBot2: "10:15",
    verification: "Trámite 100% digital · Validez provincial inmediata",
  },
  {
    id: "haberes",
    title: "Recibo de haberes",
    badge: "Economía y Finanzas",
    user1: "¿Dónde puedo consultar y descargar mi último recibo de haberes?",
    time1: "11:20",
    bot1: "Tu recibo de sueldo digital se encuentra disponible en MiPortal Formosa dentro de la sección 'Mis Haberes', habilitado desde el último día hábil de cada mes.",
    chips: [
      { label: "📄 Ir a Mis Haberes", action: "link" },
      { label: "📅 Cronograma de pagos", action: "info" },
      { label: "🔑 Recuperar clave fiscal", action: "help" },
    ],
    timeBot1: "11:20",
    user2: "¿El recibo digital tiene validez legal para trámites bancarios?",
    time2: "11:21",
    bot2: "Sí, cuenta con firma digital certificada y código QR de validación fiscal avalado por el Gobierno de la Provincia de Formosa.",
    timeBot2: "11:21",
    verification: "Documento oficial con Firma Digital y código QR",
  },
  {
    id: "expediente",
    title: "Estado de expediente",
    badge: "Gestión Administrativa",
    user1: "Tengo el expediente EXP-2024-8841-ME, ¿en qué estado se encuentra?",
    time1: "14:05",
    bot1: "¡Encontrado! El expediente EXP-2024-8841-ME se encuentra en la Dirección de Recursos Humanos con pase aprobado el día de ayer.",
    chips: [
      { label: "🔍 Ver historial de pases", action: "info" },
      { label: "🔔 Activar notificaciones", action: "alert" },
    ],
    timeBot1: "14:05",
    user2: "¿Cuánto tiempo demora el siguiente paso del trámite?",
    time2: "14:06",
    bot2: "El tiempo estimado de resolución es de 3 a 5 días hábiles. Podés consultar las actualizaciones en tiempo real aquí mismo cuando lo desees.",
    timeBot2: "14:06",
    verification: "Estado: En curso (Paso 3 de 4) · Próxima resolución en 72 hs",
  },
];

export default function InteractiveChatMockup() {
  const [scenarioIdx, setScenarioIdx] = useState(0);
  const [step, setStep] = useState(1);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [activeChipToast, setActiveChipToast] = useState(null);
  const chatScrollRef = useRef(null);
  const current = SCENARIOS[scenarioIdx];

  // Auto-scroll inside mockup on step change
  useEffect(() => {
    if (chatScrollRef.current) {
      if (step === 1) {
        chatScrollRef.current.scrollTop = 0;
      } else {
        chatScrollRef.current.scrollTo({
          top: chatScrollRef.current.scrollHeight,
          behavior: "smooth",
        });
      }
    }
  }, [step]);

  // Continuous fluid conversation loop
  useEffect(() => {
    if (isTransitioning) return;

    // Fluid timings for seamless progression
    const delays = {
      1: 1100, // Citizen 1 is displayed, wait 1.1s then Bot starts typing
      2: 1300, // Bot typing indicator displays for 1.3s then shows Bot 1
      3: 2800, // User reads Bot 1 + action chips for 2.8s, then Citizen 2 asks
      4: 1100, // Citizen 2 is displayed, wait 1.1s then Bot starts typing
      5: 1300, // Bot typing indicator displays for 1.3s then shows Bot 2
      6: 4500, // Full conversation visible for 4.5s, then fluidly loops to next
    };

    const timer = setTimeout(() => {
      if (step === 6) {
        // Smooth dissolve transition to next scenario
        setIsTransitioning(true);
        setTimeout(() => {
          setScenarioIdx((prev) => (prev + 1) % SCENARIOS.length);
          setStep(1);
          setIsTransitioning(false);
        }, 300);
      } else {
        setStep((prev) => prev + 1);
      }
    }, delays[step] || 2000);

    return () => clearTimeout(timer);
  }, [step, scenarioIdx, isTransitioning]);

  function handleSelectScenario(index) {
    if (index === scenarioIdx && step === 1) return;
    setIsTransitioning(true);
    setTimeout(() => {
      setScenarioIdx(index);
      setStep(1);
      setIsTransitioning(false);
    }, 200);
  }

  function handleReplay() {
    setIsTransitioning(true);
    setTimeout(() => {
      setStep(1);
      setIsTransitioning(false);
    }, 200);
  }

  function handleChipClick(chipLabel) {
    setActiveChipToast(`Acción: "${chipLabel}"`);
    setTimeout(() => setActiveChipToast(null), 2200);
  }

  return (
    <div
      className="w-full max-w-lg mx-auto rounded-3xl border border-line bg-gradient-to-b from-mist/90 via-paper to-mist/60 p-3 sm:p-5 shadow-xl transition-all relative select-none"
      aria-label="Simulador interactivo de conversación con ChatAP"
    >
      {/* ── Mockup Window Header ──────────────────────── */}
      <div className="flex items-center justify-between pb-3.5 border-b border-line/70">
        <div className="flex items-center gap-3">
          {/* Decorative Window Controls */}
          <div className="hidden sm:flex items-center gap-1.5" aria-hidden="true">
            <span className="w-2.5 h-2.5 rounded-full bg-red-400/80 inline-block" />
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400/80 inline-block" />
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400/80 inline-block" />
          </div>

          <div className="flex items-center gap-2.5">
            <div className="relative">
              <ChatBotAvatar
                size={30}
                static={false}
                reaction={step === 2 || step === 5 ? "thinking" : step >= 6 ? "happy" : "idle"}
              />
              <span
                className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-paper animate-pulse"
                title="En línea"
              />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-ink tracking-tight">ChatAP</span>
                <span className="text-[10px] font-semibold text-brand-deep bg-brand-deep/10 px-1.5 py-0.2 rounded-md">
                  Oficial
                </span>
              </div>
              <p className="m-0 text-[10.5px] text-muted leading-tight">
                Gobierno de Formosa · En línea
              </p>
            </div>
          </div>
        </div>

        {/* Right side: Replay button */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleReplay}
            className="group flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-medium text-muted hover:text-brand-deep bg-paper hover:bg-white rounded-full border border-line transition-all shadow-2xs"
            title="Reiniciar esta conversación"
            aria-label="Reiniciar conversación"
          >
            <svg
              className="w-3.5 h-3.5 transition-transform group-hover:rotate-180 duration-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            <span className="hidden sm:inline">Reiniciar</span>
          </button>
        </div>
      </div>

      {/* ── Topic / Scenario Selector Pills ────────────── */}
      <div className="mt-2.5 flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        <span className="text-[10px] font-semibold text-muted uppercase tracking-wider pl-1 shrink-0">
          Ejemplos:
        </span>
        {SCENARIOS.map((sc, idx) => {
          const isActive = idx === scenarioIdx;
          return (
            <button
              key={sc.id}
              type="button"
              onClick={() => handleSelectScenario(idx)}
              className={`text-xs font-semibold px-2.5 py-1 rounded-full whitespace-nowrap transition-all border ${
                isActive
                  ? "bg-brand-deep text-white border-brand-deep shadow-xs"
                  : "bg-paper/80 text-muted border-line hover:border-brand/40 hover:text-ink hover:bg-paper"
              }`}
            >
              {sc.title}
            </button>
          );
        })}
      </div>

      {/* ── Messages Container ────────────────────────── */}
      <div
        ref={chatScrollRef}
        className={`mt-3 flex flex-col gap-3 min-h-[340px] max-h-[370px] overflow-y-auto px-1 py-1.5 transition-all duration-300 ${
          isTransitioning ? "opacity-0 translate-y-1" : "opacity-100 translate-y-0"
        }`}
        style={{ scrollBehavior: "smooth" }}
      >
        {/* Step 1+: Citizen First Question */}
        {step >= 1 && (
          <div className="chat-msg chat-msg--user animate-fade-up">
            <div className="chat-msg__body shadow-xs">
              <p className="m-0 text-xs sm:text-[13px] leading-relaxed text-white">
                {current.user1}
              </p>
            </div>
            <div className="chat-msg__meta">
              <span>Vos · {current.time1}</span>
            </div>
          </div>
        )}

        {/* Step 2: Bot Typing Indicator */}
        {step === 2 && (
          <div className="flex items-end gap-2 animate-fade-up">
            <ChatBotAvatar size={24} static reaction="thinking" />
            <div className="chat-msg">
              <div className="chat-msg__body py-2 px-3.5 bg-paper border border-line rounded-2xl flex items-center gap-1.5 shadow-2xs">
                <span className="text-[11px] text-muted mr-1">ChatAP está respondiendo</span>
                <span className="w-1.5 h-1.5 rounded-full bg-brand animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="w-1.5 h-1.5 rounded-full bg-brand animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="w-1.5 h-1.5 rounded-full bg-brand animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          </div>
        )}

        {/* Step 3+: Bot First Answer + Action Chips */}
        {step >= 3 && (
          <div className="flex items-start gap-2.5 animate-fade-up">
            <div className="shrink-0 mt-1">
              <ChatBotAvatar size={26} static reaction="idle" />
            </div>
            <div className="chat-msg">
              <div className="chat-msg__body shadow-xs bg-paper border border-line text-ink">
                <p className="m-0 text-xs sm:text-[13px] leading-relaxed">
                  {current.bot1}
                </p>

                {/* Interactive Action Chips */}
                {current.chips && (
                  <div className="mt-2.5 pt-2 border-t border-line/60 flex flex-wrap gap-1.5">
                    {current.chips.map((chip, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => handleChipClick(chip.label)}
                        className="bubble-chip text-[11px] py-1 px-2.5 transition-transform hover:scale-102 active:scale-98"
                      >
                        {chip.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="chat-msg__meta">
                <span className="inline-flex items-center gap-1 text-[10px] text-muted">
                  <span className="w-1.5 h-1.5 rounded-full bg-brand inline-block" />
                  ChatAP · {current.timeBot1}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Step 4+: Citizen Follow-up Question */}
        {step >= 4 && (
          <div className="chat-msg chat-msg--user animate-fade-up">
            <div className="chat-msg__body shadow-xs">
              <p className="m-0 text-xs sm:text-[13px] leading-relaxed text-white">
                {current.user2}
              </p>
            </div>
            <div className="chat-msg__meta">
              <span>Vos · {current.time2}</span>
            </div>
          </div>
        )}

        {/* Step 5: Bot Second Typing Indicator */}
        {step === 5 && (
          <div className="flex items-end gap-2 animate-fade-up">
            <ChatBotAvatar size={24} static reaction="thinking" />
            <div className="chat-msg">
              <div className="chat-msg__body py-2 px-3.5 bg-paper border border-line rounded-2xl flex items-center gap-1.5 shadow-2xs">
                <span className="text-[11px] text-muted mr-1">ChatAP verificando canales</span>
                <span className="w-1.5 h-1.5 rounded-full bg-brand animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="w-1.5 h-1.5 rounded-full bg-brand animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="w-1.5 h-1.5 rounded-full bg-brand animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          </div>
        )}

        {/* Step 6+: Bot Final Answer with Verification Badge */}
        {step >= 6 && (
          <div className="flex items-start gap-2.5 animate-fade-up">
            <div className="shrink-0 mt-1">
              <ChatBotAvatar size={26} static reaction="happy" />
            </div>
            <div className="chat-msg">
              <div className="chat-msg__body shadow-xs bg-paper border border-line text-ink">
                <p className="m-0 text-xs sm:text-[13px] leading-relaxed">
                  {current.bot2}
                </p>

                {/* Verification / Resolution Badge */}
                {current.verification && (
                  <div className="mt-2.5 inline-flex items-center gap-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
                    <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>{current.verification}</span>
                  </div>
                )}
              </div>
              <div className="chat-msg__meta">
                <span className="inline-flex items-center gap-1 text-[10px] text-muted">
                  <span className="w-1.5 h-1.5 rounded-full bg-brand inline-block" />
                  ChatAP · {current.timeBot2}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Floating feedback toast if chip is clicked */}
      {activeChipToast && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-20 px-3 py-1 bg-ink text-paper text-xs rounded-full shadow-lg border border-line flex items-center gap-1.5 animate-fade-up">
          <span className="text-emerald-400">✓</span>
          <span>{activeChipToast}</span>
        </div>
      )}

      {/* ── Mockup Simulated Input Bar ────────────────── */}
      <div className="mt-3 pt-2.5 border-t border-line/60">
        <div className="relative flex items-center">
          <input
            type="text"
            readOnly
            placeholder="Escribí tu consulta sobre trámites o servicios..."
            className="w-full rounded-full border border-line bg-paper/90 pl-4 pr-20 py-2 text-xs text-ink placeholder:text-muted/60 focus:outline-none cursor-default shadow-inner"
          />
          <div className="absolute right-1.5 flex items-center gap-1">
            <span
              className="p-1 text-muted hover:text-ink transition-colors cursor-pointer"
              title="Entrada de voz disponible"
              aria-hidden="true"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                />
              </svg>
            </span>
            <span
              className="w-6 h-6 rounded-full bg-brand-deep flex items-center justify-center text-white shadow-xs cursor-pointer hover:bg-brand transition-colors"
              title="Enviar"
              aria-hidden="true"
            >
              <svg className="w-3 h-3 translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </span>
          </div>
        </div>
        <div className="mt-1.5 flex items-center justify-between px-1 text-[10px] text-muted">
          <span>Respuestas oficiales en lenguaje sencillo</span>
          <span className="font-mono">Gobierno de Formosa</span>
        </div>
      </div>
    </div>
  );
}
