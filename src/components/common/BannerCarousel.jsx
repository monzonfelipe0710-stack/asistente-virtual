import { useState, useEffect, useRef, useCallback } from "react";
import "./BannerCarousel.css";
import { Kicker } from "./editorial";

export default function BannerCarousel({
  slides = [],
  autoPlayInterval = 5000,
  className = "",
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const timerRef = useRef(null);

  const nextSlide = useCallback(() => {
    if (!slides.length) return;
    setActiveIndex((prev) => (prev + 1) % slides.length);
  }, [slides.length]);

  useEffect(() => {
    if (autoPlayInterval <= 0 || slides.length <= 1) return undefined;
    timerRef.current = setInterval(nextSlide, autoPlayInterval);
    return () => clearInterval(timerRef.current);
  }, [autoPlayInterval, nextSlide, slides.length]);

  if (!slides || !slides.length) return null;

  return (
    <div
      className={`banner-carousel ${className}`.trim()}
      role="region"
      aria-label="Mensajes del Asistente Virtual"
    >
      <div className="banner-carousel__slides">
        {slides.map((slide, idx) => {
          const isActive = idx === activeIndex;
          return (
            <div
              key={slide.id || idx}
              className={`banner-carousel__slide ${isActive ? "banner-carousel__slide--active" : ""}`}
              aria-hidden={!isActive}
            >
              <div className="flex max-w-4xl flex-col items-center gap-4 sm:gap-5 text-center px-4">
                <Kicker className="hero-cinematic__kicker">
                  {slide.kicker}
                </Kicker>
                <h1 className="hero-cinematic__title text-center text-balance m-0">
                  {slide.title}
                </h1>
                {slide.highlight ? (
                  <p className="banner-carousel__highlight text-sm sm:text-base md:text-lg text-muted/90 max-w-2xl m-0 font-medium leading-relaxed">
                    {slide.highlight}
                  </p>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
