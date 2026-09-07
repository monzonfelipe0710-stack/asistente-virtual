import { useEffect, useRef, useState } from "react";

const VARIANT_CLASS = {
  up: "reveal",
  img: "reveal-img",
  blur: "blur-reveal",
};

export default function Reveal({
  as: Tag = "div",
  variant = "up",
  delay = 0,
  className = "",
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
      { threshold: 0.15, rootMargin: "0px 0px -8% 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const base = VARIANT_CLASS[variant] || "reveal";

  return (
    <Tag
      ref={ref}
      className={`${base} ${shown ? "is-revealed" : ""} ${className}`}
      style={showDelay(delay)}
      {...rest}
    />
  );
}

function showDelay(ms) {
  return ms ? { animationDelay: `${ms}ms` } : undefined;
}