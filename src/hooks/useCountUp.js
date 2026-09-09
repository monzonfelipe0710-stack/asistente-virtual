import { useEffect, useRef, useState } from "react";

/**
 * Count-up hook — animates from 0 to `target` when `active` becomes true.
 * Uses requestAnimationFrame with an easeOutExpo curve for a snappy feel.
 *
 * @param {number}  target   — final value (integers only)
 * @param {boolean} active   — start counting when true
 * @param {number}  duration — ms, default 1400
 */
export function useCountUp(target, active, duration = 1400) {
  const [value, setValue] = useState(0);
  const rafRef = useRef(null);
  const startRef = useRef(null);

  useEffect(() => {
    if (!active) return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
      setValue(target);
      return;
    }

    cancelAnimationFrame(rafRef.current);
    startRef.current = null;

    const animate = (ts) => {
      if (!startRef.current) startRef.current = ts;
      const elapsed = ts - startRef.current;
      const progress = Math.min(elapsed / duration, 1);
      // easeOutExpo
      const ease = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      setValue(Math.round(ease * target));
      if (progress < 1) rafRef.current = requestAnimationFrame(animate);
    };

    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, [active, target, duration]);

  return value;
}
