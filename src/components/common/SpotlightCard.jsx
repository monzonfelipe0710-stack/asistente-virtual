import { useRef } from "react";

export default function SpotlightCard({
  children,
  className = "",
  as: Component = "div",
  ...props
}) {
  const cardRef = useRef(null);

  const handlePointerMove = (e) => {
    const el = cardRef.current;
    if (!el || window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    const rect = el.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    el.style.setProperty("--mouse-x", `${x.toFixed(2)}%`);
    el.style.setProperty("--mouse-y", `${y.toFixed(2)}%`);
  };

  return (
    <Component
      ref={cardRef}
      onPointerMove={handlePointerMove}
      className={`spotlight-card ${className}`}
      {...props}
    >
      {children}
    </Component>
  );
}