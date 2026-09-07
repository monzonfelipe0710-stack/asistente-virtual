import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import ChatBotAvatar from "../ChatBotAvatar";

const STORAGE_KEY_PREFIX = "chatap_tutorial_completed_";
const TRIGGER_KEY_PREFIX = "chatap_tutorial_trigger_";

export function triggerOnboardingForUser(userId) {
  try {
    localStorage.setItem(`${TRIGGER_KEY_PREFIX}${userId}`, "true");
    window.dispatchEvent(new CustomEvent("chatap-trigger-onboarding"));
  } catch {
    /* noop */
  }
}

export default function BotOnboardingModal() {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState("next"); // "next" | "prev"

  const checkShouldOpen = useCallback(() => {
    if (!isAuthenticated || !user?.id) {
      setIsOpen(false);
      return;
    }
    const isCompleted = localStorage.getItem(`${STORAGE_KEY_PREFIX}${user.id}`) === "true";
    const isTriggered = localStorage.getItem(`${TRIGGER_KEY_PREFIX}${user.id}`) === "true";

    if (isTriggered && !isCompleted) {
      setIsOpen(true);
      setIsClosing(false);
      setStep(0);
      setDirection("next");
    }
  }, [isAuthenticated, user?.id]);

  useEffect(() => {
    checkShouldOpen();
    const handleEvent = () => checkShouldOpen();
    window.addEventListener("chatap-trigger-onboarding", handleEvent);
    return () => window.removeEventListener("chatap-trigger-onboarding", handleEvent);
  }, [checkShouldOpen]);

  // Cierre animado y fluido
  const handleFinish = useCallback((destination) => {
    if (user?.id) {
      localStorage.setItem(`${STORAGE_KEY_PREFIX}${user.id}`, "true");
      localStorage.removeItem(`${TRIGGER_KEY_PREFIX}${user.id}`);
    }
    setIsClosing(true);
    setTimeout(() => {
      setIsOpen(false);
      setIsClosing(false);
      if (destination) {
        navigate(destination);
      }
    }, 200);
  }, [user?.id, navigate]);

  function goToNext() {
    setDirection("next");
    setStep((prev) => Math.min(prev + 1, STEPS.length - 1));
  }

  function goToPrev() {
    setDirection("prev");
    setStep((prev) => Math.max(prev - 1, 0));
  }

  // Navegación por teclado
  useEffect(() => {
    if (!isOpen || isClosing) return;
    function handleKeyDown(e) {
      if (e.key === "Escape") {
        handleFinish();
      } else if (e.key === "ArrowRight") {
        if (step < STEPS.length - 1) goToNext();
      } else if (e.key === "ArrowLeft") {
        if (step > 0) goToPrev();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isClosing, step, handleFinish]);

  if (!isOpen) return null;

  const STEPS = [
    {
      reaction: "excited",
      kicker: "¡BIENVENIDO/A A CHATAP!",
      title: `¡Hola, ${user?.name ? user.name.split(" ")[0] : "amigo/a"}! 👋`,
      subtitle: "Soy tu Asistente Virtual Oficial",
      description:
        "Te voy a mostrar en 4 pasos muy simples cómo funciona la plataforma para que encuentres todo lo que necesites al instante.",
      tip: "✨ Esta breve guía te tomará solo 30 segundos y no volverá a molestarte.",
      badge: "Paso 1 de 5",
      badgeColor: "bg-brand-deep/10 text-brand-deep",
    },
    {
      reaction: "curious",
      kicker: "SECCIÓN 1 · INICIO",
      title: "Todo lo importante en un solo lugar",
      subtitle: "Página Principal & Novedades",
      description:
        "En el Inicio podés conocer las últimas noticias de Recursos Humanos, acceder a los trámites más frecuentes y consultar métricas en tiempo real.",
      tip: "💡 Consejo: Si estás buscando algo rápido, la barra de búsqueda del inicio te lleva directo a la respuesta.",
      badge: "Paso 2 de 5",
      badgeColor: "bg-brand-deep/10 text-brand-deep",
    },
    {
      reaction: "playful",
      kicker: "SECCIÓN 2 · CHATEAR (24/7)",
      title: "Preguntame lo que necesites, las 24 horas",
      subtitle: "Inteligencia Artificial Especializada",
      description:
        "En la pestaña 'Chatear' podés preguntarme sobre recibos de haberes, cómo solicitar licencias, régimen horario o normativas provinciales. ¡Te respondo de forma inmediata!",
      tip: "🤖 Podés escribir como hablás habitualmente o usar las preguntas sugeridas de un solo clic.",
      badge: "Paso 3 de 5",
      badgeColor: "bg-emerald-50 text-emerald-700",
    },
    {
      reaction: "attention",
      kicker: "SECCIÓN 3 · SOPORTE & AYUDA",
      title: "Atención humana y canales directos",
      subtitle: "WhatsApp, 0800 y Mesa de Ayuda",
      description:
        "Si necesitás hablar con una persona de nuestro equipo, en 'Soporte' tenés acceso directo a nuestro WhatsApp oficial, línea 0800 gratuita y un formulario simple para enviarnos tu consulta.",
      tip: "📱 WhatsApp es el canal más rápido para resolver inconvenientes técnicos o de acceso.",
      badge: "Paso 4 de 5",
      badgeColor: "bg-amber-50 text-amber-700",
    },
    {
      reaction: "proud",
      kicker: "SECCIÓN 4 · MI PERFIL",
      title: "Tu espacio personal y seguro",
      subtitle: "Tus datos, trámites y seguridad",
      description:
        "Arriba a la derecha, en tu menú de usuario, podés ingresar a 'Mi Perfil' para revisar tus datos registrados, cambiar tu contraseña y seguir el estado de tus gestiones.",
      tip: "🔒 Tu información es confidencial y podés actualizar tus preferencias cuando quieras.",
      badge: "Paso 5 de 5",
      badgeColor: "bg-purple-50 text-purple-700",
    },
    {
      reaction: "happy",
      kicker: "¡TODO LISTO PARA COMENZAR!",
      title: "¡Ya conocés lo fundamental!",
      subtitle: "Tu asistente está listo para ayudarte",
      description:
        "Este tutorial no volverá a aparecer. Podés empezar a explorar la plataforma ahora mismo o hacer tu primera consulta en el chat.",
      tip: "🎉 ¿Hacemos la primera pregunta juntos?",
      badge: "Completado",
      badgeColor: "bg-emerald-100 text-emerald-800",
      isFinal: true,
    },
  ];

  const current = STEPS[step];
  const isFirst = step === 0;
  const isLast = step === STEPS.length - 1;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Tutorial de bienvenida"
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-ink/65 backdrop-blur-md transition-opacity duration-200 ${
        isClosing ? "animate-fade-out" : "animate-fade-in"
      }`}
    >
      <div
        className={`relative w-full max-w-lg rounded-3xl border border-line bg-paper shadow-2xl overflow-hidden ${
          isClosing ? "animate-scale-out" : "animate-scale-in"
        }`}
      >
        {/* Barra superior de progreso y botón omitir */}
        <div className="flex items-center justify-between px-6 pt-5 pb-3 border-b border-line/60 bg-mist/30">
          <div className="flex items-center gap-2">
            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-colors duration-200 ${current.badgeColor}`}>
              {current.badge}
            </span>
            <div className="flex items-center gap-1 ml-2">
              {STEPS.map((_, i) => (
                <span
                  key={i}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    i === step
                      ? "w-6 bg-brand-deep"
                      : i < step
                      ? "w-1.5 bg-brand-deep/40"
                      : "w-1.5 bg-line"
                  }`}
                />
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={() => handleFinish()}
            className="text-muted hover:text-ink text-xs font-semibold uppercase tracking-wider py-1 px-2.5 rounded-lg hover:bg-mist transition-all duration-180 cursor-pointer"
          >
            Omitir
          </button>
        </div>

        {/* Contenido principal del paso animado */}
        <div
          key={step}
          className={`p-6 sm:p-8 text-center ${
            direction === "next" ? "animate-step-next" : "animate-step-prev"
          }`}
        >
          {/* Avatar del bot con reacción y animación suave al cambiar */}
          <div className="relative inline-block mb-5">
            <div
              key={`avatar-${step}`}
              className="w-28 h-28 mx-auto rounded-3xl bg-mist/60 border border-line/80 flex items-center justify-center shadow-soft relative overflow-hidden animate-avatar-pop"
            >
              <ChatBotAvatar size={105} reaction={current.reaction} followMouse={false} />
            </div>
            <span className="absolute -bottom-2 -right-2 px-2 py-0.5 rounded-full bg-paper border border-line text-[10px] font-bold text-brand-deep shadow-xs">
              ChatAP
            </span>
          </div>

          {/* Textos del paso */}
          <p className="kicker mb-1.5 text-xs text-brand-deep font-bold tracking-widest">
            {current.kicker}
          </p>
          <h2 className="text-xl sm:text-2xl font-extrabold text-ink tracking-tight m-0 leading-tight">
            {current.title}
          </h2>
          <p className="text-xs font-semibold text-muted uppercase tracking-wider mt-1 m-0">
            {current.subtitle}
          </p>

          <p className="text-sm text-ink/80 mt-4 leading-relaxed max-w-md mx-auto m-0 font-normal">
            {current.description}
          </p>

          {/* Tip / Consejo si existe */}
          {current.tip && (
            <div className="mt-5 p-3 rounded-2xl bg-mist/50 border border-line/70 text-xs text-muted text-left flex items-start gap-2.5">
              <span>{current.tip}</span>
            </div>
          )}
        </div>

        {/* Barra inferior de acciones */}
        <div className="px-6 py-4 border-t border-line/60 bg-mist/20 flex items-center justify-between gap-3">
          <div>
            {!isFirst && !isLast && (
              <button
                type="button"
                onClick={goToPrev}
                className="px-4 py-2.5 rounded-xl border border-line bg-paper text-xs font-bold uppercase tracking-wider text-muted hover:text-ink hover:bg-mist transition-all duration-180 cursor-pointer"
              >
                Anterior
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 ml-auto">
            {isLast ? (
              <>
                <button
                  type="button"
                  onClick={() => handleFinish()}
                  className="px-4 py-2.5 rounded-xl border border-line bg-paper text-xs font-bold uppercase tracking-wider text-ink hover:bg-mist transition-all duration-180 cursor-pointer"
                >
                  Explorar Plataforma
                </button>
                <button
                  type="button"
                  onClick={() => handleFinish("/chat")}
                  className="px-5 py-2.5 rounded-xl bg-brand-deep text-paper text-xs font-bold uppercase tracking-wider hover:bg-brand transition-all duration-180 cursor-pointer shadow-soft flex items-center gap-1.5"
                >
                  <span>Ir al Chat</span>
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={goToNext}
                className="px-6 py-2.5 rounded-xl bg-brand-deep text-paper text-xs font-bold uppercase tracking-wider hover:bg-brand transition-all duration-180 cursor-pointer shadow-soft flex items-center gap-2"
              >
                <span>{isFirst ? "Comenzar" : "Siguiente"}</span>
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
