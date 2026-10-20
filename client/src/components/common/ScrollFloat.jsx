import { useLayoutEffect, useMemo, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import "./ScrollFloat.css";

gsap.registerPlugin(ScrollTrigger);

/**
 * Texto que se revela carácter a carácter al entrar en el viewport.
 * - mode="scroll" (por defecto): scrubbed por scroll, clásico React Bits.
 * - mode="once":  reproduce una sola vez al entrar, ideal para el hero.
 * Usa gsap.context + ctx.revert() para limpiar triggers en StrictMode.
 */
export default function ScrollFloat({
  as: Tag = "h2",
  children,
  containerClassName = "",
  textClassName = "",
  animationDuration = 1,
  ease = "back.inOut(2)",
  scrollStart = "center bottom+=50%",
  scrollEnd = "bottom bottom-=40%",
  stagger = 0.03,
  mode = "scroll",
  delay = 0,
}) {
  const containerRef = useRef(null);
  const text = typeof children === "string" ? children : "";

  const splitText = useMemo(() => (
    text.split(" ").map((word, wordIndex) => (
      <span className="scroll-float__word" key={`${word}-${wordIndex}`}>
        {Array.from(word).map((char, charIndex) => (
          <span className="scroll-float__char" key={`${char}-${charIndex}`}>{char}</span>
        ))}
      </span>
    ))
  ), [text]);

  useLayoutEffect(() => {
    const element = containerRef.current;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!element || reducedMotion) return undefined;

    const context = gsap.context(() => {
      const chars = element.querySelectorAll(".scroll-float__char");
      const from = {
        opacity: 0,
        yPercent: 45,
        transformOrigin: "50% 100%",
      };
      const to = {
        opacity: 1,
        yPercent: 0,
        duration: animationDuration,
        ease,
        stagger,
      };

      if (mode === "once") {
        gsap.fromTo(chars, from, {
          ...to,
          delay,
          scrollTrigger: {
            trigger: element,
            start: "top 85%",
            toggleActions: "play none none none",
            once: true,
          },
        });
      } else {
        gsap.fromTo(chars, from, {
          ...to,
          scrollTrigger: {
            trigger: element,
            start: scrollStart,
            end: scrollEnd,
            scrub: true,
          },
        });
      }
    }, element);

    return () => context.revert();
  }, [animationDuration, delay, ease, mode, scrollEnd, scrollStart, stagger, text]);

  return (
    <Tag ref={containerRef} className={`scroll-float ${containerClassName}`.trim()} aria-label={text}>
      <span className={`scroll-float__text ${textClassName}`.trim()} aria-hidden="true">{splitText}</span>
    </Tag>
  );
}