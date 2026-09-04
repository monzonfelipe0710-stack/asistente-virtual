import { useState, useEffect, useCallback, useRef } from "react";
import { useLocation, Routes } from "react-router-dom";

export default function AnimatedRoutes({ children }) {
  const location = useLocation();
  const [displayedLocation, setDisplayedLocation] = useState(location);
  const [transitionStage, setTransitionStage] = useState("enter");
  const isTransitioning = useRef(false);
  const pendingPath = useRef(null);

  useEffect(() => {
    if (location.pathname !== displayedLocation.pathname) {
      if (isTransitioning.current) {
        pendingPath.current = location.pathname;
        return;
      }
      isTransitioning.current = true;
      setTransitionStage("exit");
    }
  }, [location.pathname, displayedLocation.pathname]);

  const onExitComplete = useCallback(() => {
    setDisplayedLocation({ ...location, pathname: pendingPath.current || location.pathname });
    pendingPath.current = null;
    setTransitionStage("enter");
    requestAnimationFrame(() => {
      isTransitioning.current = false;
    });
  }, [location]);

  const animClass = transitionStage === "exit" ? "animate-route-exit" : "animate-route-enter";

  return (
    <div
      key={transitionStage === "exit" ? "exit-" + displayedLocation.pathname : displayedLocation.pathname}
      className={animClass}
      onAnimationEnd={(e) => {
        if (e.target === e.currentTarget && transitionStage === "exit") {
          onExitComplete();
        }
      }}
    >
      <Routes location={displayedLocation}>
        {children}
      </Routes>
    </div>
  );
}
