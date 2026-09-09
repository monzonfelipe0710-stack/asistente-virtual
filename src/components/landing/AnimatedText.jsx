import { useEffect, useRef, useState } from "react";

const TAG = { h1: "h1", h2: "h2", h3: "h3", p: "p", span: "span", div: "div" };

export default function AnimatedText({
  text,
  as = "span",
  className = "",
  wordDelay = 28,
  ...rest
}) {
  const ref = useRef(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduced || typeof IntersectionObserver === "undefined") {
      const id = requestAnimationFrame(() => setShown(true));
      return () => cancelAnimationFrame(id);
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setShown(true);
            io.disconnect();
          }
        });
      },
      { threshold: 0.4, rootMargin: "0px 0px -6% 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const Tag = TAG[as] || "span";
  const words = String(text).split(/\s+/).filter(Boolean);

  return (
    <Tag
      ref={ref}
      className={`${shown ? "is-revealed" : ""} ${className}`}
      aria-label={text}
      {...rest}
    >
      {words.map((w, i) => (
        <span key={i} aria-hidden="true">
          <span
            className="word-reveal"
            style={{ transitionDelay: shown ? `${i * wordDelay}ms` : "0ms" }}
          >
            {w}
          </span>
          {i < words.length - 1 ? " " : ""}
        </span>
      ))}
    </Tag>
  );
}