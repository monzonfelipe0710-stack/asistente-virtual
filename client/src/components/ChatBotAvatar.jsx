import { useEffect, useRef, useState } from "react";
import { BotEngine } from "../bloub/engine";
import { SHAPE_BY_ID, DEFAULT_SHAPE } from "../bloub/skins";
import { RAYON, DEMI_VIEWBOX } from "../bloub/repere";
import { POSES } from "../bloub/states";
import { EXPRESSION_BY_ID } from "../bloub/expressions";

const INK = "#0a0a0c";
const EYE = "#ffffff";

const VB = DEMI_VIEWBOX;
const R = RAYON;

/**
 * Cada reacción se traduce a una configuración del MOTOR (mismo personaje):
 *  - state:  morph del cuerpo (idle / thinking / wide / alert / wink)
 *  - expr:   expresión facial sobre el estado de reposo (attentif, triste, ...)
 *  - look:   mirada (setLook)
 *  - transform: clase CSS de deformación del mismo SVG (tilt/bounce/squash/stretch)
 *  - blink:  parpadeo forzado
 * Nunca se cambia de personaje: todas son animaciones del blob.
 */
const REACTION_CONFIG = {
  idle: { state: "idle", look: { yaw: 0, pitch: 0, mix: 0, spin: 0, wander: 1 } },
  blink: { blink: true },
  lookLeft: { look: { yaw: -35, pitch: 0, mix: 1, spin: 0, wander: 0 } },
  lookRight: { look: { yaw: 35, pitch: 0, mix: 1, spin: 0, wander: 0 } },
  lookAround: { look: { yaw: 0, pitch: 0, mix: 0, spin: 360, wander: 0 } },
  tilt: { transform: "rx-tilt", state: "idle", look: { yaw: 0, pitch: 0, mix: 0, spin: 0, wander: 1 } },
  bounce: { transform: "rx-bounce", state: "idle", look: { yaw: 0, pitch: 0, mix: 0, spin: 0, wander: 1 } },
  squash: { transform: "rx-squash", state: "idle", look: { yaw: 0, pitch: 0, mix: 0, spin: 0, wander: 1 } },
  stretch: { transform: "rx-stretch", state: "idle", look: { yaw: 0, pitch: 0, mix: 0, spin: 0, wander: 1 } },
  surprised: { state: "wide" },
  thinking: { state: "thinking" },
  attention: { expr: "attentif" },
  error: { state: "alert" },
  worried: { expr: "triste" },
  confus: { expr: "confus" },
  wink: { state: "wink" },
};

const DOT_POOL = 6;
const MAX_YAW = 35;
const MAX_PITCH = 28;

function applyConfig(engine, cfg, t) {
  if (cfg.blink) {
    engine.forceBlink(t);
    return;
  }
  if (cfg.state) engine.setState(cfg.state, t);
  if (cfg.expr) engine.setExpression(EXPRESSION_BY_ID.get(cfg.expr) ?? null, t);
  if (cfg.look) engine.setLook(cfg.look, t);
}

export default function ChatBotAvatar({
  reaction = "idle",
  size = 44,
  speaking = false,
  static: isStatic = false,
}) {
  const svgRef = useRef(null);
  const bodyRef = useRef(null);
  const eyeARef = useRef(null);
  const eyeBRef = useRef(null);
  const dotRefs = useRef([]);
  const reactionRef = useRef(reaction);
  const drawRef = useRef(null);
  const engineRef = useRef(null);
  const clockRef = useRef(0);
  const colorsRef = useRef({ body: INK, eye: EYE });
  const [rxClass, setRxClass] = useState("");

  // --- montaje: motor, pintura, loop de animación (único rAF), listeners ---
  useEffect(() => {
    const readColors = () => {
      const cs = getComputedStyle(document.documentElement);
      colorsRef.current = {
        body: cs.getPropertyValue("--bot-body").trim() || INK,
        eye: cs.getPropertyValue("--bot-eye").trim() || EYE,
      };
    };
    readColors();

    const engine = new BotEngine(
      R,
      "idle",
      SHAPE_BY_ID.get(DEFAULT_SHAPE)?.radii ?? null,
      null
    );
    engineRef.current = engine;
    clockRef.current = 0;

    const paint = (f) => {
      const { body, eye } = colorsRef.current;
      if (bodyRef.current) {
        bodyRef.current.setAttribute("d", f.bodyPath);
        bodyRef.current.setAttribute("opacity", String(f.bodyAlpha));
        bodyRef.current.setAttribute("fill", body);
      }
      [eyeARef.current, eyeBRef.current].forEach((el, i) => {
        if (!el) return;
        const e = f.eyes[i];
        if (e && e.alpha > 0.01) {
          el.setAttribute("d", e.d);
          el.setAttribute("transform", e.matrix);
          el.setAttribute("opacity", String(e.alpha));
          el.setAttribute("fill", eye);
          el.style.display = "";
        } else {
          el.style.display = "none";
        }
      });
      for (let i = 0; i < DOT_POOL; i++) {
        const el = dotRefs.current[i];
        if (!el) continue;
        const d = f.dots[i];
        if (d && d.opacity > 0.01 && d.r > 0.0005) {
          el.setAttribute("cx", String(d.x));
          el.setAttribute("cy", String(d.y));
          el.setAttribute("r", String(d.r));
          el.setAttribute("opacity", String(d.opacity));
          el.setAttribute("fill", body);
          el.style.display = "";
        } else {
          el.style.display = "none";
        }
      }
    };

    const reduceMQ = window.matchMedia ? window.matchMedia("(prefers-reduced-motion: reduce)") : null;

    const drawStatic = () => {
      const cfg = REACTION_CONFIG[reactionRef.current] || REACTION_CONFIG.idle;
      const st = cfg.state || "idle";
      if (!cfg.blink) {
        if (cfg.state) engine.setState(cfg.state, 0);
        if (cfg.expr) engine.setExpression(EXPRESSION_BY_ID.get(cfg.expr) ?? null, 0);
        if (cfg.look) engine.setLook(cfg.look, 0);
      }
      paint(engine.sample(POSES[st] ?? 1));
    };
    drawRef.current = drawStatic;

    const themeObserver = new MutationObserver(() => {
      readColors();
      if (isStatic) drawStatic();
    });
    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });

    if (isStatic) {
      drawStatic();
      return () => {
        themeObserver.disconnect();
        engineRef.current = null;
        drawRef.current = null;
      };
    }

    let raf = 0;
    let clock = 0;
    let last = 0;

    const tick = (ms) => {
      raf = requestAnimationFrame(tick);
      const dt = last ? Math.min((ms - last) / 1000, 0.064) : 0;
      last = ms;
      clock += dt;
      clockRef.current = clock;
      paint(engine.sample(clock));
    };

    const start = () => {
      cancelAnimationFrame(raf);
      last = 0;
      raf = requestAnimationFrame(tick);
    };
    const stop = () => cancelAnimationFrame(raf);

    const onReduce = (e) => {
      if (e.matches) {
        stop();
        drawStatic();
      } else if (!document.hidden) {
        start();
      }
    };

    const onVis = () => {
      if (document.hidden) stop();
      else if (!(reduceMQ && reduceMQ.matches)) start();
    };

    // La mirada sigue al cursor SOLO en reposo (reacción idle). Si el bot está
    // reaccionando, la reacción controla la mirada y no debe pelearse con el mouse.
    const onMove = (e) => {
      if (reactionRef.current !== "idle") return;
      const el = svgRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      const nx = (e.clientX - cx) / (window.innerWidth / 2);
      const ny = (e.clientY - cy) / (window.innerHeight / 2);
      const yaw = Math.max(-MAX_YAW, Math.min(MAX_YAW, nx * MAX_YAW));
      const pitch = Math.max(-MAX_PITCH, Math.min(MAX_PITCH, -ny * MAX_PITCH));
      engine.setLook({ yaw, pitch, mix: 1, spin: 0, wander: 0 }, clockRef.current);
    };

    if (reduceMQ && reduceMQ.matches) {
      drawStatic();
    } else {
      start();
    }

    window.addEventListener("mousemove", onMove);
    reduceMQ?.addEventListener("change", onReduce);
    document.addEventListener("visibilitychange", onVis);

    return () => {
      stop();
      window.removeEventListener("mousemove", onMove);
      reduceMQ?.removeEventListener("change", onReduce);
      document.removeEventListener("visibilitychange", onVis);
      themeObserver.disconnect();
      engineRef.current = null;
      drawRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isStatic]);

  // --- cambio de reacción: aplica la configuración al motor ---
  useEffect(() => {
    reactionRef.current = reaction;
    const engine = engineRef.current;
    if (!engine) return;
    const cfg = REACTION_CONFIG[reaction] || REACTION_CONFIG.idle;
    const t = clockRef.current;
    applyConfig(engine, cfg, t);

    // Transformaciones CSS (mismo SVG). Se suprimen mientras "habla" para no
    // pelear con el balanceo de lectura (animate-speak).
    const reduce = window.matchMedia ? window.matchMedia("(prefers-reduced-motion: reduce)").matches : false;
    const transform = cfg.transform && !speaking && !reduce ? cfg.transform : "";
    setRxClass(transform);

    if (reduce || isStatic) drawRef.current?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reaction, speaking, isStatic]);

  return (
    <svg
      ref={svgRef}
      width={size}
      height={size}
      viewBox={`${-VB} ${-VB} ${VB * 2} ${VB * 2}`}
      role="img"
      aria-label="Avatar animado del asistente ChatAP"
      className={`block ${speaking ? "animate-speak" : ""} ${rxClass}`}
    >
      <path ref={bodyRef} fill={INK} />
      <path ref={eyeARef} fill={EYE} />
      <path ref={eyeBRef} fill={EYE} />
      {Array.from({ length: DOT_POOL }).map((_, i) => (
        <circle
          key={i}
          ref={(el) => (dotRefs.current[i] = el)}
          fill={INK}
          style={{ display: "none" }}
        />
      ))}
    </svg>
  );
}
