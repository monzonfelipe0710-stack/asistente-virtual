import { useEffect, useRef, useState } from "react";
import { BrowserRouter, Routes, useLocation } from "react-router-dom";
import BotOnboardingModal from "../components/common/BotOnboardingModal";
import AppRoutes from "./routes";

const EXIT_MS = 120;

function RouteTransition() {
  const location = useLocation();
  const [displayLocation, setDisplayLocation] = useState(location);
  const [phase, setPhase] = useState("enter");
  const prevKeyRef = useRef(location.key);
  const reduceMotion =
    typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

  useEffect(() => {
    if (prevKeyRef.current === location.key) return;
    prevKeyRef.current = location.key;

    if (reduceMotion) {
      setDisplayLocation(location);
      setPhase("enter");
      return;
    }

    const raf = requestAnimationFrame(() => setPhase("exit"));
    const timeout = setTimeout(() => {
      setDisplayLocation(location);
      setPhase("enter");
    }, EXIT_MS);

    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(timeout);
    };
  }, [location, reduceMotion]);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [displayLocation.key]);

  const animationClass =
    phase === "exit" && !reduceMotion
      ? "animate-route-exit"
      : "animate-route-enter";

  return (
    <div key={displayLocation.key} className={animationClass}>
      <Routes location={displayLocation}>
        <AppRoutes />
      </Routes>
    </div>
  );
}

export default function AppRouter() {
  return (
    <BrowserRouter>
      <BotOnboardingModal />
      <RouteTransition />
    </BrowserRouter>
  );
}
