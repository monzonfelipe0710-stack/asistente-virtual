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
    description: "Te acompaño a conocer las funciones principales. Podés avanzar a tu ritmo y cerrar el recorrido cuando quieras.",
  },
  {
    reaction: "playful",
    kicker: "Tu primera consulta",
    title: "Escribí o elegí una consulta",
    description: "Escribí tu duda con tus propias palabras o elegí un tema sugerido. Cuanto más clara sea tu pregunta, mejor podremos orientarte.",
    route: "/chat",
    target: "#chat-here",
  },
  {
    reaction: "playful",
    kicker: "Tus consultas, a mano",
    title: "Volvé al historial cuando lo necesites",
    description: "En el panel de conversaciones podés volver a abrir consultas anteriores. Así no necesitás escribir de nuevo una pregunta que ya hiciste.",
    route: "/chat",
  },
  {
    reaction: "happy",
    kicker: "A tu manera",
    title: "Adaptá la página a tus necesidades",
    description: "Desde Accesibilidad podés agrandar el texto, activar el alto contraste o elegir una letra más legible. Elegí lo que te resulte más cómodo. Podés volver a abrir este tutorial desde tu perfil.",
    route: "/chat",
    target: "#accessibility-menu",
  },
];

// eslint-disable-next-line react-refresh/only-export-components
export function triggerOnboardingForUser(userId) {
  try {
    localStorage.setItem(`${TRIGGER_KEY_PREFIX}${userId}`, "true");
    window.dispatchEvent(new CustomEvent("chatap-trigger-onboarding"));
  } catch {
    /* noop */
  }
}

// eslint-disable-next-line react-refresh/only-export-components
export function forceOpenTutorial() {
  try {
    window.dispatchEvent(new CustomEvent("chatap-force-open-tutorial"));
  } catch {
    /* noop */
  }
}

export default function BotOnboardingModal() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState("next"); // "next" | "prev"
  const [spotlight, setSpotlight] = useState(null); // { rect, placement }
  const measureRef = useRef(null);

  const checkShouldOpen = useCallback(() => {
    if (!user?.id) {
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
  }, [user]);

  const forceOpen = useCallback(() => {
    if (!user?.id) return;
    setIsOpen(true);
    setIsClosing(false);
    setStep(0);
    setDirection("next");
  }, [user]);

  useEffect(() => {
    const raf = requestAnimationFrame(() => checkShouldOpen());
    const handleEvent = () => checkShouldOpen();
    const handleForceOpen = () => forceOpen();
    window.addEventListener("chatap-trigger-onboarding", handleEvent);
    window.addEventListener("chatap-force-open-tutorial", handleForceOpen);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("chatap-trigger-onboarding", handleEvent);
      window.removeEventListener("chatap-force-open-tutorial", handleForceOpen);
    };
  }, [checkShouldOpen, forceOpen]);

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
  }, [user, navigate]);

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
            placement: rect.bottom + 260 < window.innerHeight ? "below" : "above",
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

  const goToNext = useCallback(() => {
    const nextIndex = Math.min(step + 1, STEPS.length - 1);
    const nextRoute = STEPS[nextIndex]?.route;
    setSpotlight(null);
    if (nextRoute) {
      navigate(nextRoute);
    }
    setDirection("next");
    setStep(nextIndex);
  }, [step, navigate]);

  const goToPrev = useCallback(() => {
    const prevIndex = Math.max(step - 1, 0);
    const prevRoute = STEPS[prevIndex]?.route;
    setSpotlight(null);
    if (prevRoute) {
      navigate(prevRoute);
    }
    setDirection("prev");
    setStep(prevIndex);
  }, [step, navigate]);

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
  }, [isOpen, isClosing, step, handleFinish, goToNext, goToPrev]);

  if (!isOpen) return null;

  const hasSpotlight = !!spotlight;
  const placement = hasSpotlight ? spotlight.placement : null;
  const progress = ((step + 1) / STEPS.length) * 100;
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

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Tutorial de bienvenida"
      aria-describedby="tour-description"
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
        key={step}
        className={`tour-card relative z-[60] flex flex-col items-center gap-3 w-full ${isClosing ? "animate-scale-out" : "animate-scale-in"}`}
        style={wrapStyle}
      >
        <div className="flex items-center gap-3 w-full" style={{ maxWidth: 400 }}>
          <div className="relative inline-block shrink-0">
            <div
              className="tour-avatar w-16 h-16 rounded-2xl bg-paper border border-line shadow-soft flex items-center justify-center overflow-hidden animate-avatar-pop"
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
            <div>
              <p className="tour-kicker m-0">{current.kicker}</p>
              <h2 className="tour-title m-0">{current.title}</h2>
              <p id="tour-description" className="tour-desc m-0">{current.description}</p>
            </div>
          </div>
        </div>

        <div className="tour-progress" aria-hidden="true">
          <span style={{ width: `${progress}%` }} />
        </div>

        {/* Controles mínimos */}
        <div className="tour-controls">
          <span className="tour-step-count" aria-live="polite">
            {step + 1} / {STEPS.length}
          </span>
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