import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import ChatBotAvatar from "../ChatBotAvatar";

const STORAGE_KEY_PREFIX = "chatap_tutorial_completed_";
const TRIGGER_KEY_PREFIX = "chatap_tutorial_trigger_";
const TUTORIAL_STEP_KEY = "chatap_tutorial_last_step_";

const STEPS = [
  {
    id: "welcome",
    reaction: "excited",
    kicker: "¡Bienvenido!",
    title: (user) => `Hola, ${user?.name ? user.name.split(" ")[0] : "amigo/a"}`,
    description: "Primero, conocé la página de inicio: acá te contamos qué es ChatAP y cómo puede ayudarte. Después vamos a entrar al asistente para recorrer sus herramientas.",
    route: "/",
    target: "#inicio",
    action: null,
  },
  {
    id: "history",
    reaction: "happy",
    kicker: "Tu historial",
    title: "Conversaciones anteriores",
    description: "A la izquierda está tu historial. Mirá este ejemplo: cada tarjeta representa una conversación y muestra la pregunta con la que empezó.",
    route: "/chat",
    target: ["#chat-history-panel", "#chat-history-drawer", "#chat-history-open-button"],
    action: null,
  },
  {
    id: "input",
    reaction: "happy",
    kicker: "Escribí tu consulta",
    title: "Campo de texto",
    description: "Escribí tu consulta con tus propias palabras —por ejemplo, «¿Cómo solicito una licencia?»— y enviála con la flecha.",
    route: "/chat",
    target: "#chat-here",
    action: null,
  },
  {
    id: "attach",
    reaction: "playful",
    kicker: "Adjuntar archivos",
    title: "Botón de clip",
    description: "Si necesitás aportar contexto, usá el clip para adjuntar una imagen relacionada con tu consulta (máximo 8 MB).",
    route: "/chat",
    target: "#chat-image-button",
    action: null,
  },
  {
    id: "quick-topics",
    reaction: "happy",
    kicker: "Trámites más solicitados",
    title: "Elegí un trámite",
    description: "Estas tarjetas son los trámites más solicitados. Seleccioná una para preguntarle a ChatAP cómo iniciar esa gestión.",
    route: "/chat",
    target: ".chatap-popular-grid",
    action: null,
  },
  {
    id: "a11y",
    reaction: "excited",
    kicker: "Accesibilidad",
    title: "Encontrá el acceso a Tutorial",
    description: "El menú de accesibilidad reúne herramientas para adaptar la experiencia. Desde su opción «Tutorial» podés volver a recorrer esta guía cuando la necesites.",
    route: "/chat",
    target: "#accessibility-tutorial-button",
    action: null,
  },
  {
    id: "finish",
    reaction: "excited",
    kicker: "¡Listo!",
    title: "Ya sabés usar ChatAP",
    description: "¡Ya estás listo! Escribí una consulta o elegí uno de los trámites destacados. Podés volver a abrir este tutorial desde Accesibilidad cuando lo necesites.",
    route: "/chat",
    target: null,
    action: null,
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

// eslint-disable-next-line react-refresh/only-export-components
export function resetTutorialForUser(userId) {
  try {
    localStorage.removeItem(`${STORAGE_KEY_PREFIX}${userId}`);
    localStorage.removeItem(`${TRIGGER_KEY_PREFIX}${userId}`);
    localStorage.removeItem(`${TUTORIAL_STEP_KEY}${userId}`);
    window.dispatchEvent(new CustomEvent("chatap-force-open-tutorial"));
  } catch {
    /* noop */
  }
}

export default function BotOnboardingModal() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState("next");
  const [spotlight, setSpotlight] = useState(null);
  const [elementNotFound, setElementNotFound] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const tutorialActorKey = user?.id || "guest";
  const measureRef = useRef(null);
  const rafIdRef = useRef(0);
  const lastSuccessfulStep = useRef(0);
  const finishTimerRef = useRef(0);
  const navigationRunRef = useRef(0);

  const checkShouldOpen = useCallback(() => {
    const isCompleted = localStorage.getItem(`${STORAGE_KEY_PREFIX}${tutorialActorKey}`) === "true";
    const isTriggered = localStorage.getItem(`${TRIGGER_KEY_PREFIX}${tutorialActorKey}`) === "true";

    if (isTriggered && !isCompleted) {
      setIsOpen(true);
      setIsClosing(false);
      setStep(0);
      setDirection("next");
      lastSuccessfulStep.current = 0;
    }
  }, [tutorialActorKey]);

  const forceOpen = useCallback(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    if (location.pathname !== "/") navigate("/");
    setIsOpen(true);
    setIsClosing(false);
    setStep(0);
    setDirection("next");
    lastSuccessfulStep.current = 0;
  }, [location.pathname, navigate]);

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

  useEffect(() => () => {
    if (finishTimerRef.current) window.clearTimeout(finishTimerRef.current);
    navigationRunRef.current += 1;
  }, []);

  const handleFinish = useCallback((destination) => {
    if (finishTimerRef.current) window.clearTimeout(finishTimerRef.current);
    navigationRunRef.current += 1;
    try {
      localStorage.setItem(`${STORAGE_KEY_PREFIX}${tutorialActorKey}`, "true");
      localStorage.removeItem(`${TRIGGER_KEY_PREFIX}${tutorialActorKey}`);
      localStorage.removeItem(`${TUTORIAL_STEP_KEY}${tutorialActorKey}`);
    } catch {
      // El tutorial se puede cerrar aunque el almacenamiento esté bloqueado.
    }
    setIsClosing(true);
    setSpotlight(null);
    finishTimerRef.current = window.setTimeout(() => {
      setIsOpen(false);
      setIsClosing(false);
      if (destination) navigate(destination);
      finishTimerRef.current = 0;
    }, 200);
  }, [tutorialActorKey, navigate]);

  const goToStep = useCallback(async (newStep) => {
    const runId = ++navigationRunRef.current;
    // Al comenzar o volver atrás, la guía arranca desde la parte superior
    // para que el objetivo señalado no quede fuera del viewport.
    if (newStep <= step) window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
    const clampedStep = Math.max(0, Math.min(newStep, STEPS.length - 1));
    const targetRoute = STEPS[clampedStep]?.route;
    const isRouteChange = targetRoute && targetRoute !== location.pathname;
    
    // Desvanecer el spotlight suavemente antes de cualquier cambio
    setSpotlight(prev => prev ? { ...prev, opacity: 0 } : null);
    await new Promise(resolve => setTimeout(resolve, 180));
    if (runId !== navigationRunRef.current) return;
    
    // Limpiar spotlight y estado
    setSpotlight(null);
    setElementNotFound(false);
    
    // Navegar a la ruta del paso si es diferente
    if (isRouteChange) {
      navigate(targetRoute);
      // Esperar a que la navegación se complete y el DOM se actualice
      await new Promise(resolve => setTimeout(resolve, 250));
    }
    if (runId !== navigationRunRef.current) return;
    
    // Actualizar el paso después de la navegación
    setDirection(newStep > step ? "next" : "prev");
    setStep(clampedStep);
    lastSuccessfulStep.current = clampedStep;
    
    // Esperar un poco más para que el nuevo elemento se renderice
    await new Promise(resolve => setTimeout(resolve, 80));
    if (runId !== navigationRunRef.current) return;
  }, [step, location.pathname, navigate]);

  const goToNext = useCallback(async () => {
    if (isNavigating) return;
    setIsNavigating(true);
    await goToStep(step + 1);
    setIsNavigating(false);
  }, [step, goToStep, isNavigating]);

  const goToPrev = useCallback(async () => {
    if (isNavigating) return;
    setIsNavigating(true);
    await goToStep(step - 1);
    setIsNavigating(false);
  }, [step, goToStep, isNavigating]);

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

  useEffect(() => {
    const root = document.documentElement;
    const currentId = STEPS[step]?.id;

    if (isOpen && currentId === "history") {
      root.dataset.tutorialHistoryDemo = "true";
      window.dispatchEvent(new CustomEvent("chatap-open-history-for-tutorial"));
    } else {
      delete root.dataset.tutorialHistoryDemo;
    }

    if (isOpen && (currentId === "a11y" || currentId === "finish")) {
      root.dataset.tutorialAccessibilityDemo = "true";
      window.dispatchEvent(new CustomEvent("chatap-open-accessibility-for-tutorial"));
    } else {
      delete root.dataset.tutorialAccessibilityDemo;
    }

    return () => {
      delete root.dataset.tutorialHistoryDemo;
      delete root.dataset.tutorialAccessibilityDemo;
    };
  }, [isOpen, step]);

  useEffect(() => {
    if (!isOpen) return;
    const current = STEPS[step];
    if (!current?.target) {
      setTimeout(() => {
        setSpotlight(null);
        setElementNotFound(false);
      }, 0);
      return;
    }

    // Esperar más tiempo para asegurar que la navegación se completó
    const targetRoute = current.route;
    const delay = targetRoute && targetRoute !== location.pathname ? 500 : 100;
    const startMeasurement = () => {
      const maxAttempts = 200;
      let attempts = 0;
      let lastRect = null;
      let stableFrames = 0;
      const measure = () => {
        const targets = Array.isArray(current.target) ? current.target : [current.target];
        const el = targets
          .map((selector) => document.querySelector(selector))
          .find((candidate) => {
            if (!candidate) return false;
            const bounds = candidate.getBoundingClientRect();
            const style = window.getComputedStyle(candidate);
            return bounds.width > 0 && bounds.height > 0 && style.display !== "none" && style.visibility !== "hidden";
          });

        if (el) {
          const r = el.getBoundingClientRect();
          if (r.width > 0 && r.height > 0) {
            // Llevar el objetivo al viewport antes de dibujar el foco, sin
            // resaltar encabezados cercanos cuando el objetivo son las tarjetas.
            if (r.top < 24 || r.bottom > window.innerHeight - 24) {
              el.scrollIntoView({ block: "center", inline: "nearest", behavior: "smooth" });
              lastRect = null;
              stableFrames = 0;
              attempts += 1;
              if (attempts < maxAttempts) {
                rafIdRef.current = requestAnimationFrame(measure);
                return;
              }
            }
            const rect = { top: r.top, left: r.left, width: r.width, height: r.height, bottom: r.bottom, right: r.right };
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
              placement: rect.bottom + 235 < window.innerHeight ? "below" : "above",
            });
            setElementNotFound(false);
            if (stableFrames >= 5) {
              measureRef.current = null;
              return;
            }
          }
        } else {
          setElementNotFound(true);
        }

        attempts += 1;
        if (attempts < maxAttempts) {
          rafIdRef.current = requestAnimationFrame(measure);
        } else {
          measureRef.current = null;
          if (!el) setElementNotFound(true);
        }
      };

      measureRef.current = measure;
      rafIdRef.current = requestAnimationFrame(measure);
    };

    const timeoutId = setTimeout(startMeasurement, delay);
    
    return () => {
      clearTimeout(timeoutId);
      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = 0;
      measureRef.current = null;
    };
  }, [step, isOpen, location.pathname]);

  useEffect(() => {
    if (!isOpen || !STEPS[step]?.target) return;
    const onChange = () => {
      const measure = measureRef.current;
      if (measure) measure();
    };
    window.addEventListener("resize", onChange);
    return () => window.removeEventListener("resize", onChange);
  }, [step, isOpen]);

  if (!isOpen) return null;

  const hasSpotlight = !!spotlight && !elementNotFound;
  const progress = ((step + 1) / STEPS.length) * 100;
  const current = {
    ...STEPS[step],
    title: typeof STEPS[step].title === "function" ? STEPS[step].title(user) : STEPS[step].title,
  };
  const isFirst = step === 0;
  const isLast = step === STEPS.length - 1;

  // La tarjeta del tutorial siempre queda dentro de una zona segura y centrada.
  // En vez de calcular márgenes a partir del objetivo (que podían empujarla fuera
  // del viewport en móviles bajos o con zoom), el foco visual se mueve por separado.
  const wrapStyle = { marginTop: "auto", marginBottom: "auto" };

  const currentPath = location.pathname;
  const isOnCorrectRoute = current.route === currentPath || !current.route;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Tutorial de bienvenida"
      aria-describedby="tour-description"
      className={`tour-overlay fixed inset-0 z-50 flex flex-col items-center overflow-y-auto overscroll-contain p-3 sm:p-6 ${isClosing ? "animate-fade-out" : "animate-fade-in"}`}
    >
      {hasSpotlight && (() => {
        const left = Math.max(4, Math.min(spotlight.rect.left - 6, window.innerWidth - Math.min(spotlight.rect.width + 12, window.innerWidth - 8) - 4));
        const top = Math.max(4, Math.min(spotlight.rect.top - 6, window.innerHeight - Math.min(spotlight.rect.height + 12, window.innerHeight - 8) - 4));
        const width = Math.min(spotlight.rect.width + 12, window.innerWidth - 8);
        const height = Math.min(spotlight.rect.height + 12, window.innerHeight - 8);
        // Un único SVG con hueco real: evita las costuras de paneles superpuestos.
        return (
          <>
            <svg className="tour-spotlight-mask" width="100%" height="100%" viewBox={`0 0 ${window.innerWidth} ${window.innerHeight}`} preserveAspectRatio="none" aria-hidden="true">
              <path d={`M0 0H${window.innerWidth}V${window.innerHeight}H0Z M${left} ${top}H${left + width}V${top + height}H${left}Z`} fill="rgba(3,8,22,0.64)" fillRule="evenodd" />
            </svg>
            <div className="tour-ring" style={{ top, left, width, height, opacity: spotlight.opacity ?? 1 }} />
          </>
        );
      })()}

      <div
        key={step}
        className={`tour-card relative z-[60] my-auto flex w-full max-w-xl shrink-0 flex-col items-center gap-3 ${isClosing ? "animate-scale-out" : "animate-scale-in"}`}
        style={wrapStyle}
        transition="all 0.3s cubic-bezier(0.16, 1, 0.3, 1)"
      >
        <div className="flex items-center gap-3 w-full" style={{ maxWidth: 420 }}>
          <div className="relative inline-block shrink-0">
            <div className="tour-avatar w-16 h-16 rounded-2xl bg-paper border border-line shadow-soft flex items-center justify-center overflow-hidden animate-avatar-pop">
              <ChatBotAvatar size={44} reaction={current.reaction} followMouse={false} />
            </div>
            <span className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 px-1.5 py-px rounded-full bg-paper border border-line text-[9px] font-bold text-brand-deep shadow-xs whitespace-nowrap">
              ChatAP
            </span>
          </div>

          <div className={`tour-bubble ${direction === "next" ? "animate-step-next" : "animate-step-prev"}`}>
            <div>
              <p className="tour-kicker m-0">{current.kicker}</p>
              <h2 className="tour-title m-0">{current.title}</h2>
              <p id="tour-description" className="tour-desc m-0">{current.description}</p>
              {isNavigating && (
                <p className="text-xs text-brand mt-2 m-0 font-medium flex items-center gap-2">
                  <svg className="animate-spin h-3 w-3" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Cargando…
                </p>
              )}
              {elementNotFound && current.target && !isNavigating && (
                <p className="text-xs text-warn mt-2 m-0 font-medium">Elemento no visible en esta vista. Navegando…</p>
              )}
              {!isOnCorrectRoute && current.route && !isNavigating && (
                <p className="text-xs text-info mt-2 m-0 font-medium">Redirigiendo a la página del chat…</p>
              )}
            </div>
          </div>
        </div>

        <div className="tour-progress" aria-hidden="true">
          <span style={{ width: `${progress}%` }} />
        </div>

        <div className="tour-controls">
          <span className="tour-step-count" aria-live="polite">
            Paso {step + 1} de {STEPS.length}
          </span>
          {!isFirst && (
            <button
              type="button"
              onClick={goToPrev}
              className="tour-btn"
              aria-label="Paso anterior"
              disabled={isNavigating}
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M15 19l-7-7 7-7" />
              </svg>
              <span>Atrás</span>
            </button>
          )}

          {isLast ? (
            <button
              type="button"
              onClick={() => handleFinish("/chat")}
              className="tour-btn tour-btn-primary"
              disabled={isNavigating}
            >
              Finalizar
            </button>
          ) : (
            <button
              type="button"
              onClick={goToNext}
              className="tour-btn tour-btn-primary"
              disabled={isNavigating}
            >
              {isFirst ? "Comenzar" : "Siguiente"}
              <svg className="w-3.5 h-3.5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          )}

          <button type="button" onClick={() => handleFinish()} className="tour-skip" disabled={isNavigating}>
            {isLast ? "Cerrar tutorial" : "Omitir"}
          </button>
        </div>
      </div>
    </div>
  );
}