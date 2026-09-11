import { useRef, useEffect, useState, useCallback } from "react";
import "./GooeyNav.css";

const noise = (n = 1) => n / 2 - Math.random() * n;

const getXY = (distance, pointIndex, totalPoints) => {
  const angle = ((360 + noise(8)) / totalPoints) * pointIndex * (Math.PI / 180);
  return [distance * Math.cos(angle), distance * Math.sin(angle)];
};

export default function GooeyNav({
  items = [],
  animationTime = 600,
  particleCount = 15,
  particleDistances = [90, 10],
  particleR = 100,
  timeVariance = 300,
  colors = [1, 2, 3, 1, 2, 3, 1, 4],
  initialActiveIndex = 0,
  onItemClick,
  className = "",
}) {
  const containerRef = useRef(null);
  const navRef = useRef(null);
  const filterRef = useRef(null);
  const textRef = useRef(null);
  const [activeIndex, setActiveIndex] = useState(initialActiveIndex);
  const [prevInitialIndex, setPrevInitialIndex] = useState(initialActiveIndex);

  // Sincronización limpia de prop durante el render (patrón oficial React)
  if (initialActiveIndex !== undefined && initialActiveIndex !== prevInitialIndex) {
    setPrevInitialIndex(initialActiveIndex);
    setActiveIndex(initialActiveIndex);
  }

  const createParticle = useCallback(
    (i, t, d, r) => {
      const rotate = noise(r / 10);
      const chosenColor = colors[Math.floor(Math.random() * colors.length)];
      return {
        start: getXY(d[0], particleCount - i, particleCount),
        end: getXY(d[1] + noise(7), particleCount - i, particleCount),
        time: t,
        scale: 1 + noise(0.2),
        color: chosenColor,
        rotate: rotate > 0 ? (rotate + r / 20) * 10 : (rotate - r / 20) * 10,
      };
    },
    [colors, particleCount]
  );

  const makeParticles = useCallback(
    (element) => {
      const d = particleDistances;
      const r = particleR;
      const bubbleTime = animationTime * 2 + timeVariance;
      element.style.setProperty("--time", `${bubbleTime}ms`);

      for (let i = 0; i < particleCount; i += 1) {
        const t = animationTime * 2 + noise(timeVariance * 2);
        const p = createParticle(i, t, d, r);
        element.classList.remove("active");

        setTimeout(() => {
          const particle = document.createElement("span");
          const point = document.createElement("span");
          particle.classList.add("particle");
          particle.style.setProperty("--start-x", `${p.start[0]}px`);
          particle.style.setProperty("--start-y", `${p.start[1]}px`);
          particle.style.setProperty("--end-x", `${p.end[0]}px`);
          particle.style.setProperty("--end-y", `${p.end[1]}px`);
          particle.style.setProperty("--time", `${p.time}ms`);
          particle.style.setProperty("--scale", `${p.scale}`);

          const colorValue =
            typeof p.color === "string" && (p.color.startsWith("#") || p.color.startsWith("rgb"))
              ? p.color
              : `var(--color-${p.color}, white)`;
          particle.style.setProperty("--color", colorValue);
          particle.style.setProperty("--rotate", `${p.rotate}deg`);

          point.classList.add("point");
          particle.appendChild(point);
          element.appendChild(particle);

          requestAnimationFrame(() => {
            element.classList.add("active");
          });

          setTimeout(() => {
            try {
              if (element.contains(particle)) {
                element.removeChild(particle);
              }
            } catch {
              /* noop */
            }
          }, t);
        }, 30);
      }
    },
    [animationTime, createParticle, particleCount, particleDistances, particleR, timeVariance]
  );

  const updateEffectPosition = useCallback((element) => {
    if (!containerRef.current || !filterRef.current || !textRef.current) return;
    if (!element) {
      filterRef.current.style.opacity = "0";
      textRef.current.style.opacity = "0";
      return;
    }
    filterRef.current.style.opacity = "1";
    textRef.current.style.opacity = "1";

    const containerRect = containerRef.current.getBoundingClientRect();
    const pos = element.getBoundingClientRect();
    const styles = {
      left: `${pos.x - containerRect.x}px`,
      top: `${pos.y - containerRect.y}px`,
      width: `${pos.width}px`,
      height: `${pos.height}px`,
    };
    Object.assign(filterRef.current.style, styles);
    Object.assign(textRef.current.style, styles);
    textRef.current.innerText = element.innerText;
  }, []);

  const handleClick = (e, index) => {
    e.preventDefault();
    const liEl = e.currentTarget.closest("li") || e.currentTarget;
    const isNew = activeIndex !== index;

    if (isNew) {
      setActiveIndex(index);
      updateEffectPosition(liEl);

      if (filterRef.current) {
        const existingParticles = filterRef.current.querySelectorAll(".particle");
        existingParticles.forEach((p) => {
          if (filterRef.current && filterRef.current.contains(p)) {
            filterRef.current.removeChild(p);
          }
        });
      }

      if (textRef.current) {
        textRef.current.classList.remove("active");
        void textRef.current.offsetWidth;
        textRef.current.classList.add("active");
      }

      if (filterRef.current) {
        makeParticles(filterRef.current);
      }
    }

    if (onItemClick) {
      onItemClick(items[index], index);
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      const liEl = e.currentTarget.closest("li") || e.currentTarget;
      handleClick({ currentTarget: liEl, preventDefault: () => {} }, index);
    }
  };

  useEffect(() => {
    if (!navRef.current || !containerRef.current) return undefined;
    const lis = navRef.current.querySelectorAll("li");
    const activeLi = activeIndex >= 0 && activeIndex < lis.length ? lis[activeIndex] : null;

    updateEffectPosition(activeLi);
    if (activeLi) {
      textRef.current?.classList.add("active");
    } else {
      textRef.current?.classList.remove("active");
    }

    const resizeObserver = new ResizeObserver(() => {
      const currentLis = navRef.current?.querySelectorAll("li") || [];
      const currentActiveLi =
        activeIndex >= 0 && activeIndex < currentLis.length ? currentLis[activeIndex] : null;
      updateEffectPosition(currentActiveLi);
    });

    resizeObserver.observe(containerRef.current);

    // Ajuste tras carga de fuentes
    if (typeof document !== "undefined" && document.fonts?.ready) {
      document.fonts.ready.then(() => {
        const loadedLis = navRef.current?.querySelectorAll("li") || [];
        const loadedActiveLi =
          activeIndex >= 0 && activeIndex < loadedLis.length ? loadedLis[activeIndex] : null;
        updateEffectPosition(loadedActiveLi);
      }).catch(() => {});
    }

    return () => resizeObserver.disconnect();
  }, [activeIndex, updateEffectPosition]);

  return (
    <div className={`gooey-nav ${className}`.trim()} ref={containerRef}>
      {/* SVG Gooey Filter: Clean, robust metaball effect with NO black box background */}
      <svg
        className="pointer-events-none"
        style={{ width: 0, height: 0, position: "absolute", overflow: "hidden" }}
        aria-hidden="true"
      >
        <defs>
          <filter id="gooey-nav-filter" x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="5" result="blur" />
            <feColorMatrix
              in="blur"
              type="matrix"
              values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -7"
              result="goo"
            />
            <feComposite in="SourceGraphic" in2="goo" operator="atop" />
          </filter>
        </defs>
      </svg>

      <nav className="flex relative" style={{ transform: "translate3d(0,0,0.01px)" }}>
        <ul
          ref={navRef}
          className="flex gap-1 sm:gap-2 list-none p-0 px-1 m-0 relative z-[3]"
          style={{
            color: "white",
            textShadow: "0 1px 1px hsl(205deg 30% 10% / 0.2)",
          }}
        >
          {items.map((item, index) => {
            const isActive = activeIndex === index;
            return (
              <li
                key={item.href || index}
                className={`rounded-full relative cursor-pointer transition-[background-color_color_box-shadow] duration-300 ease ${
                  isActive ? "active" : ""
                }`}
              >
                <a
                  href={item.href}
                  onClick={(e) => handleClick(e, index)}
                  onKeyDown={(e) => handleKeyDown(e, index)}
                  className="outline-none py-1.5 px-3.5 inline-block select-none"
                  aria-current={isActive ? "page" : undefined}
                >
                  {item.label}
                </a>
              </li>
            );
          })}
        </ul>
      </nav>
      <span className="effect filter" ref={filterRef} aria-hidden="true" />
      <span className="effect text" ref={textRef} aria-hidden="true" />
    </div>
  );
}
