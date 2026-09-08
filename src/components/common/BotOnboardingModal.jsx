import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import ChatBotAvatar from "../ChatBotAvatar";

const STORAGE_KEY_PREFIX = "chatap_tutorial_completed_";
const TRIGGER_KEY_PREFIX = "chatap_tutorial_trigger_";

const STEPS = [
  {
    reaction: "excited",
    kicker: "¡Bienvenido/a a ChatAP!",
    title: (user) => `¡Hola, ${user?.name ? user.name.split(" ")[0] : "amigo/a"}!`,
    description:
      "Soy tu Asistente Virtual Oficial. Te voy a mostrar cómo funciona la plataforma en pocos pasos.",
    tip: "Esta breve guía no volverá a molestarte.",
    badge: "Paso 1 de 7",
    badgeColor: "bg-brand-deep/10 text-brand-deep",
  },
  {
    reaction: "curious",
    kicker: "Sección 1 · Inicio",
    title: "Todo lo importante en un solo lugar",
    description:
      "El Inicio es el punto de partida: novedades, trámites frecuentes y métricas en tiempo real. ¡Ya estamos ahí!",
    tip: "El siguiente paso te muestra dónde arrancar a chatear.",
    badge: "Paso 2 de 7",
    badgeColor: "bg-brand-deep/10 text-brand-deep",
    route: "/",
  },
  {
    reaction: "playful",
    kicker: "Sección 2 · Chatear (24/7)",
    title: "Acá arrancá tu consulta",
    description:
      "El botón iluminado, 'Preguntar a ChatAP', te lleva directo a la pantalla de chat. Un solo clic y estás adentro.",
    tip: "También llegás desde el menú superior, en la pestaña 'Chatear'.",
    badge: "Paso 3 de 7",
    badgeColor: "bg-emerald-50 text-emerald-700",
    route: "/",
    target: "#chat-cta",
  },
  {
    reaction: "attention",
    kicker: "Dentro del chat",
    title: "Esto es lo que podés hacer acá",
    description:
      "Preguntá por trámites y expedientes, consultá recibos, pedí certificados o empezá tocando una pregunta sugerida. También podés dictar con el micrófono.",
    tip: "Escribí como hablarías con una persona: entendemos tu idioma.",
    badge: "Paso 4 de 7",
    badgeColor: "bg-sky-50 text-sky-700",
    route: "/chat",
    target: "#chat-here",
  },
  {
    reaction: "attention",
    kicker: "Sección 3 · Soporte & Ayuda",
    title: "Atención humana y canales directos",
    description:
      "En 'Soporte' tenés WhatsApp oficial, línea 0800 gratuita y un formulario para hablar con nuestro equipo.",
    tip: "WhatsApp es el canal más rápido para inconvenientes técnicos.",
    badge: "Paso 5 de 7",
    badgeColor: "bg-amber-50 text-amber-700",
    route: "/contacto",
  },
  {
    reaction: "proud",
    kicker: "Sección 4 · Mi Perfil",
    title: "Tu espacio personal y seguro",
    description:
      "En 'Mi Perfil' podés revisar tus datos, cambiar tu contraseña y seguir el estado de tus gestiones.",
    tip: "Tu información es confidencial.",
    badge: "Paso 6 de 7",
    badgeColor: "bg-purple-50 text-purple-700",
    route: "/perfil",
  },
  {
    reaction: "happy",
    kicker: "¡Todo listo para comenzar!",
    title: "Ya conocés lo fundamental",
    description:
      "Este tutorial no volverá a aparecer. Podés explorar la plataforma o hacer tu primera consulta en el chat.",
    tip: "¿Hacemos la primera pregunta juntos?",
    badge: "Completado",
    badgeColor: "bg-emerald-100 text-emerald-800",
    isFinal: true,
  },
];

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
  const [spotlight, setSpotlight] = useState(null); // { rect, placement }
  const measureRef = useRef(null);

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
    setSpotlight(null);
    setTimeout(() => {
      setIsOpen(false);
      setIsClosing(false);
      if (destination) {
        navigate(destination);
      }
    }, 200);
  }, [user?.id, navigate]);

  // Mide el elemento a resaltar cuando el paso tiene un target.
  useEffect(() => {
    if (!isOpen) return;
    const current = STEPS[step];
    if (!current?.target) {
      const raf0 = requestAnimationFrame(() => setSpotlight(null));
      return () => cancelAnimationFrame(raf0);
    }
    const maxAttempts = 150; // ~2,5s (transición de página ~0,7s)
    let attempts = 0;
    let lastRect = null;
    let stableFrames = 0;
    let raf = 0;

    const measure = () => {
      const el = document.querySelector(current.target);
      if (el) {
        const r = el.getBoundingClientRect();
        if (r.width > 0 && r.height > 0) {
          const rect = {
            top: r.top,
            left: r.left,
            width: r.width,
            height: r.height,
            bottom: r.bottom,
            right: r.right,
          };
          if (
            lastRect &&
            Math.abs(rect.top - lastRect.top) < 0.5 &&
            Math.abs(rect.left - lastRect.left) < 0.5 &&
            Math.abs(rect.width - lastRect.width) < 0.5
          ) {
            stableFrames += 1;
          } else {
            stableFrames = 0;
          }
          lastRect = rect;
          setSpotlight({
            rect,
            placement: rect.bottom + 280 < window.innerHeight ? "below" : "above",
          });
          if (stableFrames >= 8) {
            measureRef.current = null;
            return;
          }
        }
      }
      attempts += 1;
      if (attempts < maxAttempts) {
        raf = requestAnimationFrame(measure);
      } else {
        measureRef.current = null;
      }
    };

    measureRef.current = measure;
    raf = requestAnimationFrame(measure);
    return () => {
      cancelAnimationFrame(raf);
      measureRef.current = null;
    };
  }, [step, isOpen]);

  // Recalcula el spotlight si la ventana cambia de tamaño.
  useEffect(() => {
    if (!isOpen || !STEPS[step]?.target) return;
    const onChange = () => {
      const measure = measureRef.current;
      if (measure) measure();
    };
    window.addEventListener("resize", onChange);
    return () => window.removeEventListener("resize", onChange);
  }, [step, isOpen]);

  function goToNext() {
    const nextIndex = Math.min(step + 1, STEPS.length - 1);
    const nextRoute = STEPS[nextIndex]?.route;
    if (nextRoute) {
      navigate(nextRoute);
    }
    setDirection("next");
    setStep(nextIndex);
  }

  function goToPrev() {
    const prevIndex = Math.max(step - 1, 0);
    const prevRoute = STEPS[prevIndex]?.route;
    if (prevRoute) {
      navigate(prevRoute);
    }
    setDirection("prev");
    setStep(prevIndex);
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

  const hasSpotlight = !!spotlight;
  const placement = hasSpotlight ? spotlight.placement : null;
  const current = {
    ...STEPS[step],
    title: typeof STEPS[step].title === "function" ? STEPS[step].title(user) : STEPS[step].title,
  };
  const isFirst = step === 0;
  const isLast = step === STEPS.length - 1;

  let wrapStyle = null;
  if (hasSpotlight) {
    wrapStyle =
      placement === "below"
        ? { marginTop: spotlight.rect.bottom + 20 }
        : {
            marginTop: "auto",
            marginBottom: Math.max(20, window.innerHeight - spotlight.rect.top + 20),
          };
  }

  const dots = (
    <div className="flex items-center gap-1.5">
      {STEPS.map((_, i) => (
        <span
          key={i}
          className={i === step ? "tour-dot is-active" : "tour-dot"}
        />
      ))}
    </div>
  );

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Tutorial de bienvenida"
      className={`fixed inset-0 z-50 flex flex-col items-center p-4 sm:p-6 ${
        hasSpotlight ? "" : "justify-center"
      } ${isClosing ? "animate-fade-out" : "animate-fade-in"}`}
    >
      {/* Spotlight: oscurece todo menos el elemento señalado */}
      {hasSpotlight && (
        <>
          <div className="tour-dim" style={{ top: 0, left: 0, width: "100%", height: spotlight.rect.top }} />
          <div className="tour-dim" style={{ top: 0, left: 0, height: "100%", width: spotlight.rect.left }} />
          <div
            className="tour-dim"
            style={{ top: spotlight.rect.bottom, left: 0, width: "100%", height: `calc(100% - ${spotlight.rect.bottom}px)` }}
          />
          <div
            className="tour-dim"
            style={{ top: 0, left: spotlight.rect.right, height: "100%", width: `calc(100% - ${spotlight.rect.right}px)` }}
          />
          <div
            className="tour-ring"
            style={{
              top: spotlight.rect.top - 8,
              left: spotlight.rect.left - 8,
              width: spotlight.rect.width + 16,
              height: spotlight.rect.height + 16,
            }}
          />
        </>
      )}

      {/* El bot junto a su nube de texto */}
      <div
        className={`relative z-[60] flex flex-col items-center gap-3 w-full ${isClosing ? "animate-scale-out" : "animate-scale-in"}`}
        style={wrapStyle}
      >
        <div className="flex items-center gap-3 w-full" style={{ maxWidth: 400 }}>
          <div className="relative inline-block shrink-0">
            <div
              key={`avatar-${step}`}
              className="w-16 h-16 rounded-2xl bg-paper border border-line shadow-soft flex items-center justify-center overflow-hidden animate-avatar-pop"
            >
              <ChatBotAvatar size={44} reaction={current.reaction} followMouse={false} />
            </div>
            <span className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 px-1.5 py-px rounded-full bg-paper border border-line text-[9px] font-bold text-brand-deep shadow-xs whitespace-nowrap">
              ChatAP
            </span>
          </div>

          <div
            className={`tour-bubble ${direction === "next" ? "animate-step-next" : "animate-step-prev"}`}
            data-placement={placement}
          >
            <div key={step} className="animate-fade-in">
              <p className="tour-kicker m-0">{current.kicker}</p>
              <h2 className="tour-title m-0">{current.title}</h2>
              <p className="tour-desc m-0">{current.description}</p>
            </div>
          </div>
        </div>

        {/* Controles mínimos */}
        <div className="tour-controls">
          {!isFirst && (
            <button
              type="button"
              onClick={goToPrev}
              className="tour-btn"
              aria-label="Paso anterior"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}

          {dots}

          {isLast ? (
            <>
              <button type="button" onClick={() => handleFinish()} className="tour-btn tour-btn-ghost">
                Explorar
              </button>
              <button
                type="button"
                onClick={() => handleFinish("/chat")}
                className="tour-btn tour-btn-primary"
              >
                Ir al Chat
              </button>
            </>
          ) : (
            <button type="button" onClick={goToNext} className="tour-btn tour-btn-primary">
              {isFirst ? "Comenzar" : "Siguiente"}
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          )}

          {!isLast && (
            <button type="button" onClick={() => handleFinish()} className="tour-skip">
              Omitir
            </button>
          )}
        </div>
      </div>
    </div>
  );
}