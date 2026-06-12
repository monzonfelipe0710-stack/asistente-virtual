import { useLocation } from "react-router-dom";
import { useEffect, useRef } from "react";

export default function PageTransition({ children, className = "" }) {
  const location = useLocation();
  const elRef = useRef(null);

  useEffect(() => {
    const el = elRef.current;
    if (!el) return;
    el.classList.remove("animate-page-enter");
    void el.offsetWidth;
    el.classList.add("animate-page-enter");
  }, [location.pathname]);

  return (
    <div ref={elRef} className={`animate-page-enter ${className}`}>
      {children}
    </div>
  );
}
