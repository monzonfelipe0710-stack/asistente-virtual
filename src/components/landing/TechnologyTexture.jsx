import { useEffect, useRef } from "react";

const DEFAULT_WORDS = [
  "CHATAP",
  "ADMINISTRACIÓN",
  "PÚBLICA",
  "TRÁMITES",
  "CIUDADANÍA",
  "SERVICIOS",
  "CHAT",
  "AI",
  "FORMOSA",
  "INFORMACIÓN",
  "ASISTENCIA",
  "24/7",
];

export default function TechnologyTexture({ words = DEFAULT_WORDS, className = "", repeat = 1 }) {
  const containerRef = useRef(null);
  const rafRef = useRef(0);
  const activeRef = useRef(false);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const reduce =
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ||
      typeof IntersectionObserver === "undefined";

    if (reduce) return;

    function tick() {
      if (!activeRef.current) return;
      const rows = el.querySelectorAll(".texture-row");
      const y = window.pageYOffset || window.scrollY || 0;
      rows.forEach((row, i) => {
        const shift = (y * 0.06 * (i % 2 === 0 ? 1 : -1)) % 56;
        row.style.transform = `translate3d(0, ${shift}px, 0)`;
      });
      rafRef.current = requestAnimationFrame(tick);
    }

    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries.some((e) => e.isIntersecting);
        if (visible && !activeRef.current) {
          activeRef.current = true;
          rafRef.current = requestAnimationFrame(tick);
        } else if (!visible && activeRef.current) {
          activeRef.current = false;
          cancelAnimationFrame(rafRef.current);
        }
      },
      { rootMargin: "0px 0px 40% 0px" }
    );
    io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(rafRef.current);
      activeRef.current = false;
    };
  }, []);

  return (
    <div ref={containerRef} className={`texture-words ${className}`} aria-hidden="true">
      {[0, 1].map((rowIdx) => (
        <div
          key={rowIdx}
          className="texture-row flex flex-wrap py-[1.1em] will-change-transform"
          style={{ marginTop: rowIdx === 0 ? "1.5em" : "0" }}
        >
          {Array.from({ length: repeat }, (_, copy) =>
            words.map((w, i) =>
              i % 2 === rowIdx ? <span key={`${rowIdx}-${copy}-${i}`} className="texture-word">{w}</span> : null
            )
          )}
        </div>
      ))}
    </div>
  );
}