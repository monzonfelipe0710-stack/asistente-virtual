import { useState, useEffect, useRef } from "react";
import "./HeroCinematicBackground.css";

const SLIDES = [
  {
    id: "civic-architecture",
    src: "/imagenes/formosa-centro-civico.svg",
    alt: "Ilustración institucional del centro cívico de Formosa",
  },
  {
    id: "river-twilight",
    src: "/imagenes/formosa-rio-paraguay.svg",
    alt: "Ilustración del río Paraguay y la costanera de Formosa",
  },
  {
    id: "mist-landscape",
    src: "/imagenes/administracion-publica.svg",
    alt: "Ilustración de atención y servicios de la administración pública provincial",
  },
];

const SLIDE_DURATION = 10000; // 10 segundos por diapositiva

export default function HeroCinematicBackground() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isReducedMotion, setIsReducedMotion] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  });
  const timerRef = useRef(null);
  const containerRef = useRef(null);
  const [isPaused, setIsPaused] = useState(false);

  // Pausar el Ken Burns y la rotación cuando el hero no está a la vista.
  useEffect(() => {
    const el = containerRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return undefined;
    const observer = new IntersectionObserver(
      ([entry]) => setIsPaused(!entry.isIntersecting),
      { rootMargin: "80px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Detección de cambios en prefers-reduced-motion
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

    const handleChange = (e) => {
      setIsReducedMotion(e.matches);
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  // Precargar imágenes para transiciones sin parpadeos
  useEffect(() => {
    SLIDES.forEach((slide) => {
      const img = new Image();
      img.src = slide.src;
    });
  }, []);

  // Rotación suave entre diapositivas si no hay reduced-motion
  useEffect(() => {
    if (isReducedMotion || isPaused) return;

    timerRef.current = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % SLIDES.length);
    }, SLIDE_DURATION);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isReducedMotion, isPaused]);

  return (
    <div
      ref={containerRef}
      className={`hero-cinematic-bg${isPaused ? " is-paused" : ""}`}
      aria-hidden="true"
    >
      {/* ── Layer 1: Visuales con Ken Burns y Crossfade ── */}
      <div className="hero-cinematic-bg__media-stack">
        {SLIDES.map((slide, index) => {
          const isActive = isReducedMotion ? index === 0 : index === currentIndex;
          return (
            <div
              key={slide.id}
              className={`hero-cinematic-bg__slide ${isActive ? "is-active" : ""}`}
            >
              <img
                src={slide.src}
                alt={slide.alt}
                className="hero-cinematic-bg__image"
                loading={index === 0 ? "eager" : "lazy"}
                decoding="async"
                draggable={false}
              />
            </div>
          );
        })}
      </div>

      {/* ── Layer 2: Composición Profesional de Overlays ── */}
      {/* Tinte base armónico con la paleta ChatAP */}
      <div className="hero-cinematic-bg__tint" />

      {/* Gradiente focal para máximo contraste del texto central */}
      <div className="hero-cinematic-bg__focal" />

      {/* Vignette periférico sutil */}
      <div className="hero-cinematic-bg__vignette" />

      {/* Gradiente vertical inferior: funde suavemente el Hero con la siguiente sección */}
      <div className="hero-cinematic-bg__bottom-fade" />

      {/* ── Layer 5: Iluminación ambiental sutil superior (Azul de Estado) ── */}
      <div className="hero-cinematic-bg__ambient-glow" />
    </div>
  );
}
