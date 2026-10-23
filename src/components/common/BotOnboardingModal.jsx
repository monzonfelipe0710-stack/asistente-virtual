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
    kicker: "¡Bienvenido/a a ChatAP!",
    title: (user) => `¡Hola, ${user?.name ? user.name.split(" ")[0] : "amigo/a"}!`,
    description: "Voy a mostrarte dónde está cada función y para qué sirve. En cada paso señalaré la parte exacta de la pantalla; usá «Siguiente» para avanzar y «Anterior» para volver. Podés cerrar el recorrido cuando quieras.",
    route: "/chat",
    target: null,
  },
  {
    id: "history",
    reaction: "happy",
    kicker: "Mirá el lado izquierdo",
    title: "Tus conversaciones",
    description: "En la columna de la izquierda está tu historial: acá podés volver a abrir consultas anteriores. Arriba de esa columna también está «Nueva consulta» para empezar una conversación desde cero. En el celular, tocá «Historial» arriba para abrir este panel.",
    route: "/chat",
    target: ["#chat-history-panel", "#chat-history-open-button", "#chat-history-toggle-button"],
  },
  {
    id: "pills",
    reaction: "playful",
    kicker: "Atajos para empezar",
    title: "Elegí un tema sugerido",
    description: "Si estás en la pantalla inicial, acá aparecen botones con temas frecuentes, como recibos de haberes, expedientes o licencias. Tocá uno para enviar una pregunta de ejemplo sin escribirla completa. Si ya estás en una conversación, podés escribir directamente en el campo de consulta que te mostraré en el próximo paso.",
    route: "/chat",
    target: ["#chatap-pills-container", "#chat-here"],
  },
  {
    id: "input",
    reaction: "happy",
    kicker: "Hablá con ChatAP",
    title: "Escribí tu consulta acá",
    description: "Este campo es donde escribís con tus propias palabras lo que necesitás saber. Por ejemplo: «¿Qué documentación necesito para solicitar una licencia?». Después enviá la consulta con la flecha que aparece a la derecha.",
    route: "/chat",
    target: "#chat-here",
  },
  {
    id: "attach",
    reaction: "playful",
    kicker: "¿Tenés una imagen útil?",
    title: "Adjuntala desde el clip",
    description: "Este ícono de clip te permite adjuntar una imagen JPG, PNG o WebP de hasta 8 MB para dar contexto a tu pregunta. Elegí una imagen relacionada con la consulta y evitá compartir información personal que no sea necesaria.",
    route: "/chat",
    target: "#chat-image-button",
  },
  {
    id: "guided",
    reaction: "happy",
    kicker: "También hay ayuda guiada",
    title: "Seguí los pasos sugeridos",
    description: "Cuando estás en la pantalla inicial, debajo de los temas frecuentes aparecen las «Asistencias guiadas». Elegí una para recibir orientación paso a paso. Si no ves esa sección porque ya estás conversando, no pasa nada: podés seguir preguntando desde el campo de consulta.",
    route: "/chat",
    target: ["#chat-guided-assists", "#chat-here"],
  },
  {
    id: "finish",
    reaction: "excited",
    kicker: "¡Ya conocés lo principal!",
    title: "Podés volver cuando quieras",
    description: "Ahora sabés dónde buscar conversaciones, elegir temas y escribir tus consultas. Si más adelante necesitás recordar cómo funciona algo, abrí Mi perfil → Ayuda rápida → «Volver a ver tutorial». La información de trámites y estados puede depender de las integraciones disponibles; confirmá por canales oficiales si necesitás una verificación formal.",
    route: "/chat",
    target: "#chat-here",
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
  const measureRef = useRef(null);
  const lastSuccessfulStep = useRef(0);

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
      lastSuccessfulStep.current = 0;
    }
  }, [user]);

  const forceOpen = useCallback(() => {
    if (!user?.id) return;
    setIsOpen(true);
    setIsClosing(false);
    setStep(0);
    setDirection("next");
    lastSuccessfulStep.current = 0;
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

  const handleFinish = useCallback((destination) => {
    if (user?.id) {
      localStorage.setItem(`${STORAGE_KEY_PREFIX}${user.id}`, "true");
      localStorage.removeItem(`${TRIGGER_KEY_PREFIX}${user.id}`);
      localStorage.removeItem(`${TUTORIAL_STEP_KEY}${user.id}`);
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

  const goToStep = useCallback((newStep) => {
    const clampedStep = Math.max(0, Math.min(newStep, STEPS.length - 1));
    const targetRoute = STEPS[clampedStep]?.route;
    setSpotlight(null);
    setElementNotFound(false);
    if (targetRoute && targetRoute !== location.pathname) {
      navigate(targetRoute);
    }
    setDirection(newStep > step ? "next" : "prev");
    setStep(clampedStep);
    lastSuccessfulStep.current = clampedStep;
  }, [step, location.pathname, navigate]);

  const goToNext = useCallback(() => goToStep(step + 1), [step, goToStep]);
  const goToPrev = useCallback(() => goToStep(step - 1), [step, goToStep]);

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
    if (!isOpen) return;
    const current = STEPS[step];
    if (!current?.target) {
      setTimeout(() => {
        setSpotlight(null);
        setElementNotFound(false);
      }, 0);
      return;
    }

    const maxAttempts = 200;
    let attempts = 0;
    let lastRect = null;
    let stableFrames = 0;
    let raf = 0;

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
        raf = requestAnimationFrame(measure);
      } else {
        measureRef.current = null;
        if (!el) setElementNotFound(true);
      }
    };

    measureRef.current = measure;
    raf = requestAnimationFrame(measure);
    return () => {
      cancelAnimationFrame(raf);
      measureRef.current = null;
    };
  }, [step, isOpen]);

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

  const currentPath = location.pathname;
  const isOnCorrectRoute = current.route === currentPath || !current.route;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Tutorial de bienvenida"
      aria-describedby="tour-description"
      className={`tour-overlay fixed inset-0 z-50 flex flex-col items-center p-4 sm:p-6 ${hasSpotlight ? "" : "justify-center"} ${isClosing ? "animate-fade-out" : "animate-fade-in"}`}
    >
      {hasSpotlight && (
        <>
          <div className="tour-dim" style={{ top: 0, left: 0, width: "100%", height: spotlight.rect.top }} />
          <div className="tour-dim" style={{ top: 0, left: 0, height: "100%", width: spotlight.rect.left }} />
          <div className="tour-dim" style={{ top: spotlight.rect.bottom, left: 0, width: "100%", height: `calc(100% - ${spotlight.rect.bottom}px)` }} />
          <div className="tour-dim" style={{ top: 0, left: spotlight.rect.right, height: "100%", width: `calc(100% - ${spotlight.rect.right}px)` }} />
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

      <div
        key={step}
        className={`tour-card relative z-[60] flex flex-col items-center gap-3 w-full ${isClosing ? "animate-scale-out" : "animate-scale-in"}`}
        style={wrapStyle}
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

          <div className={`tour-bubble ${direction === "next" ? "animate-step-next" : "animate-step-prev"}`} data-placement={placement}>
            <div>
              <p className="tour-kicker m-0">{current.kicker}</p>
              <h2 className="tour-title m-0">{current.title}</h2>
              <p id="tour-description" className="tour-desc m-0">{current.description}</p>
              {elementNotFound && current.target && (
                <p className="text-xs text-warn mt-2 m-0 font-medium">Elemento no visible en esta vista. Navegando…</p>
              )}
              {!isOnCorrectRoute && current.route && (
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
              disabled={!isOnCorrectRoute}
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M15 19l-7-7 7-7" />
              </svg>
              <span>Anterior</span>
            </button>
          )}

          {isLast ? (
            <button
              type="button"
              onClick={() => handleFinish("/chat")}
              className="tour-btn tour-btn-primary"
            >
              Comenzar a usar el asistente
            </button>
          ) : (
            <button
              type="button"
              onClick={goToNext}
              className="tour-btn tour-btn-primary"
              disabled={!isOnCorrectRoute}
            >
              {isFirst ? "Comenzar" : "Siguiente"}
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          )}

          <button type="button" onClick={() => handleFinish()} className="tour-skip">
            {isLast ? "Cerrar tutorial" : "Omitir"}
          </button>
        </div>
      </div>
    </div>
  );
}