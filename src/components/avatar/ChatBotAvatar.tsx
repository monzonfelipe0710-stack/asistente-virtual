import { useEffect, useRef, useState } from "react";
import {
  AccessibilityInfo,
  Animated,
  AppState,
  Easing,
  Pressable,
  StyleSheet,
} from "react-native";
import Svg, { Circle, Path } from "react-native-svg";

import { BotEngine, type BotFrame, type Look } from "@/bloub/engine";
import { EXPRESSION_BY_ID } from "@/bloub/expressions";
import { RADIUS } from "@/bloub/frame";
import { DEFAULT_SHAPE, SHAPE_BY_ID } from "@/bloub/skins";
import { POSES, type StateId } from "@/bloub/states";
import { useColors } from "@/constants/theme";
import { useAjustes } from "@/lib/accesibilidad";

/**
 * Avatar del asistente. El motor (`src/bloub/`) es matemática pura: devuelve
 * paths SVG por cuadro y no sabe nada del DOM, así que acá solo lo dibujamos
 * con react-native-svg y le damos un reloj.
 */

type TransformId = "rx-tilt" | "rx-bounce" | "rx-squash" | "rx-stretch";

interface ReactionCfg {
  blink?: boolean;
  state?: StateId;
  expr?: string;
  look?: Look;
  transform?: TransformId;
}

const REACTION_CONFIG = {
  idle:        { state: "idle", look: { yaw: 0, pitch: 0, mix: 0, spin: 0, wander: 1 } },
  blink:       { blink: true },
  lookLeft:    { look: { yaw: -35, pitch: 0, mix: 1, spin: 0, wander: 0 } },
  lookRight:   { look: { yaw: 35, pitch: 0, mix: 1, spin: 0, wander: 0 } },
  lookUp:      { look: { yaw: 0, pitch: -20, mix: 1, spin: 0, wander: 0 } },
  lookDown:    { look: { yaw: 0, pitch: 20, mix: 1, spin: 0, wander: 0 } },
  tiltLeft:    { transform: "rx-tilt", state: "idle", look: { yaw: -15, pitch: 5, mix: 1, spin: 0, wander: 0 } },
  tiltRight:   { transform: "rx-tilt", state: "idle", look: { yaw: 15, pitch: 5, mix: 1, spin: 0, wander: 0 } },
  stretch:     { transform: "rx-stretch", state: "idle", look: { yaw: 0, pitch: 0, mix: 0, spin: 0, wander: 1 } },
  microBounce: { transform: "rx-bounce", state: "idle", look: { yaw: 0, pitch: 0, mix: 0, spin: 0, wander: 1 } },
  microSquash: { transform: "rx-squash", state: "idle", look: { yaw: 0, pitch: 0, mix: 0, spin: 0, wander: 1 } },
  wink:        { state: "wink" },
  surprised:   { state: "wide" },
  thinking:    { state: "thinking" },
  attention:   { expr: "attentive" },
  happy:       { expr: "happy", look: { yaw: 5, pitch: 9, mix: 1, spin: 0, wander: 0 } },
  excited:     { expr: "excited", state: "idle", look: { yaw: 6, pitch: -14, mix: 1, spin: 0, wander: 0 } },
  proud:       { expr: "proud", look: { yaw: 5, pitch: 17, mix: 1, spin: 0, wander: 0 } },
  shy:         { expr: "shy", look: { yaw: -19, pitch: -14, mix: 1, spin: 0, wander: 0 } },
  relieved:    { expr: "happy", state: "idle", look: { yaw: 0, pitch: 5, mix: 0.5, spin: 0, wander: 0.5 } },
  confused:    { expr: "confused", look: { yaw: -14, pitch: 3, mix: 1, spin: 0, wander: 0 } },
  curious:     { expr: "curious", look: { yaw: 16, pitch: -9, mix: 1, spin: 0, wander: 0 } },
  bored:       { expr: "bored", look: { yaw: -22, pitch: 2, mix: 1, spin: 0, wander: 0 } },
  sleepy:      { expr: "sleepy", look: { yaw: 6, pitch: -9, mix: 1, spin: 0, wander: 0 } },
  suspicious:  { expr: "suspicious", look: { yaw: 12, pitch: 6, mix: 1, spin: 0, wander: 0 } },
  exclaim:     { state: "exclaim" },
  playful:     { state: "wink", expr: "excited", look: { yaw: 8, pitch: -5, mix: 1, spin: 0, wander: 0 } },
  nod:         { look: { yaw: 0, pitch: 12, mix: 1, spin: 0, wander: 0 } },
} satisfies Record<string, ReactionCfg>;

type BotReaction = keyof typeof REACTION_CONFIG;

const DOT_POOL = 6;

/** Reacciones que el bot se dispara solo cuando nadie le pide nada. */
const AUTO_REACTIONS: BotReaction[] = [
  "blink", "wink", "blink", "wink",
  "lookLeft", "lookRight", "lookUp", "lookDown",
  "tiltLeft", "tiltRight",
  "microBounce", "microSquash", "stretch",
  "surprised", "thinking", "attention",
  "happy", "excited", "proud", "shy", "relieved",
  "curious", "confused", "playful", "nod",
  "bored", "sleepy", "exclaim", "suspicious",
];

const TRANSFORM_MS: Record<TransformId, number> = {
  "rx-tilt": 900,
  "rx-bounce": 800,
  "rx-squash": 800,
  "rx-stretch": 800,
};

function applyConfig(engine: BotEngine, cfg: ReactionCfg, t: number) {
  if (cfg.blink) {
    engine.forceBlink(t);
    return;
  }
  if (cfg.state) engine.setState(cfg.state, t);
  if (cfg.expr) engine.setExpression(EXPRESSION_BY_ID.get(cfg.expr) ?? null, t);
  if (cfg.look) engine.setLook(cfg.look, t);
}

interface Props {
  size?: number;
  /** Un solo cuadro, sin reloj: para listas y avatares chicos. */
  static?: boolean;
}

export function ChatBotAvatar({ size = 44, static: isStatic = false }: Props) {
  const C = useColors();
  const bodyColor = C.bot;
  const eyeColor = C.botEye;

  const [frame, setFrame] = useState<BotFrame | null>(null);
  const [autoReaction, setAutoReaction] = useState<BotReaction | null>(null);
  const [reduceMotionSO, setReduceMotion] = useState(false);
  const { reducirAnimaciones } = useAjustes();
  const reduceMotion = reduceMotionSO || reducirAnimaciones;
  const [rxKind, setRxKind] = useState<TransformId | "">("");

  const engineRef = useRef<BotEngine | null>(null);
  const clockRef = useRef(0);
  const reactionRef = useRef<BotReaction>("idle");
  const drawRef = useRef<(() => void) | null>(null);

  const [rx] = useState(() => new Animated.Value(0));

  useEffect(() => {
    let alive = true;
    AccessibilityInfo.isReduceMotionEnabled().then((v) => {
      if (alive) setReduceMotion(v);
    });
    const sub = AccessibilityInfo.addEventListener(
      "reduceMotionChanged",
      setReduceMotion
    );
    return () => {
      alive = false;
      sub.remove();
    };
  }, []);

  // Motor + reloj. Se rearma si cambia el modo estático o la preferencia de
  // movimiento reducido; nada más lo toca.
  useEffect(() => {
    const engine = new BotEngine(
      RADIUS,
      "idle",
      SHAPE_BY_ID.get(DEFAULT_SHAPE)?.radii ?? null,
      null
    );
    engineRef.current = engine;
    clockRef.current = 0;

    const drawStatic = () => {
      const cfg: ReactionCfg =
        REACTION_CONFIG[reactionRef.current] ?? REACTION_CONFIG.idle;
      const st = (cfg.state ?? "idle") as StateId;
      if (!cfg.blink) applyConfig(engine, cfg, 0);
      setFrame(engine.sample(POSES[st] ?? 1));
    };
    drawRef.current = drawStatic;

    if (isStatic || reduceMotion) {
      drawStatic();
      return () => {
        engineRef.current = null;
        drawRef.current = null;
      };
    }

    let raf = 0;
    let clock = 0;
    let last = 0;

    const tick = (ms: number) => {
      raf = requestAnimationFrame(tick);
      const dt = last ? Math.min((ms - last) / 1000, 0.064) : 0;
      last = ms;
      clock += dt;
      clockRef.current = clock;
      // ponytail: un setState por cuadro sobre 9 nodos SVG. Si en gama baja
      // se nota, mover a react-native-reanimated con useAnimatedProps.
      setFrame(engine.sample(clock));
    };

    const start = () => {
      cancelAnimationFrame(raf);
      last = 0;
      raf = requestAnimationFrame(tick);
    };
    const stop = () => cancelAnimationFrame(raf);

    start();

    // En segundo plano no se ve nada: parar el reloj ahorra batería.
    const appSub = AppState.addEventListener("change", (state) => {
      if (state === "active") start();
      else stop();
    });

    return () => {
      stop();
      appSub.remove();
      engineRef.current = null;
      drawRef.current = null;
    };
  }, [isStatic, reduceMotion]);

  useEffect(() => {
    const eff = autoReaction ?? "idle";
    reactionRef.current = eff;

    const engine = engineRef.current;
    if (!engine) return;

    const cfg: ReactionCfg = REACTION_CONFIG[eff] ?? REACTION_CONFIG.idle;
    applyConfig(engine, cfg, clockRef.current);

    const kind =
      cfg.transform && !reduceMotion ? cfg.transform : "";
    setRxKind(kind);

    if (kind) {
      rx.setValue(0);
      Animated.timing(rx, {
        toValue: 1,
        duration: TRANSFORM_MS[kind],
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }).start();
    }

    if (reduceMotion || isStatic) drawRef.current?.();
  }, [autoReaction, isStatic, reduceMotion, rx]);

  // Vida propia en reposo: cada tanto se manda una reacción al azar.
  useEffect(() => {
    if (isStatic || reduceMotion) return;

    let timer: ReturnType<typeof setTimeout> | null = null;
    const clear = () => {
      if (timer) clearTimeout(timer);
      timer = null;
    };
    const schedule = () => {
      clear();
      timer = setTimeout(() => {
        setAutoReaction(
          AUTO_REACTIONS[Math.floor(Math.random() * AUTO_REACTIONS.length)]
        );
        timer = setTimeout(() => {
          setAutoReaction(null);
          timer = setTimeout(schedule, 3200 + Math.random() * 3000);
        }, 1100 + Math.random() * 900);
      }, 2400 + Math.random() * 3200);
    };
    schedule();

    return () => {
      clear();
      setAutoReaction(null);
    };
  }, [isStatic, reduceMotion]);

  const transform: any[] = [];
  if (rxKind === "rx-tilt") {
    transform.push({
      rotate: rx.interpolate({
        inputRange: [0, 0.4, 0.7, 1],
        outputRange: ["0deg", "-9deg", "4deg", "0deg"],
      }),
    });
  } else if (rxKind === "rx-bounce") {
    transform.push({
      translateY: rx.interpolate({
        inputRange: [0, 0.3, 0.55, 0.75, 1],
        outputRange: [0, -size * 0.12, 0, -size * 0.05, 0],
      }),
    });
  } else if (rxKind === "rx-squash" || rxKind === "rx-stretch") {
    const squash = rxKind === "rx-squash";
    transform.push(
      {
        scaleX: rx.interpolate({
          inputRange: [0, 0.45, 1],
          outputRange: [1, squash ? 1.08 : 0.92, 1],
        }),
      },
      {
        scaleY: rx.interpolate({
          inputRange: [0, 0.45, 1],
          outputRange: [1, squash ? 0.84 : 1.12, 1],
        }),
      }
    );
  }

  /**
   * Un toque le hace pestañear. Va directo al motor en vez de pasar por el
   * estado de React: el parpadeo dura 0,2 s y un re-render de por medio se
   * come el arranque, así que el gesto se sentiría con retraso.
   */
  const blinkOnTap = () => {
    engineRef.current?.forceBlink(clockRef.current);
  };

  // 1.04 × RADIUS: deja aire para el rebote y el aplastado sin cortar el borde
  const vb = RADIUS * 1.04;

  return (
    <Pressable
      onPress={blinkOnTap}
      // El cuadro estático no tiene reloj: sin él el parpadeo no se vería.
      disabled={isStatic}
      accessibilityRole={isStatic ? "image" : "button"}
      accessibilityLabel={
        isStatic
          ? "Avatar del asistente ChatAP"
          : "Avatar del asistente ChatAP. Tocalo para que pestañee."
      }
      style={[styles.wrap, { width: size, height: size }]}
    >
      <Animated.View style={{ transform }}>
        <Svg
          width={size}
          height={size}
          viewBox={`${-vb} ${-vb} ${vb * 2} ${vb * 2}`}
        >
          {frame && (
            <>
              <Path
                d={frame.bodyPath}
                fill={bodyColor}
                opacity={frame.bodyAlpha}
              />
              {frame.eyes.map((e, i) =>
                e && e.alpha > 0.01 ? (
                  <Path
                    key={`eye-${i}`}
                    d={e.d}
                    transform={e.matrix}
                    fill={eyeColor}
                    opacity={e.alpha}
                  />
                ) : null
              )}
              {Array.from({ length: DOT_POOL }).map((_, i) => {
                const d = frame.dots[i];
                if (!d || d.opacity <= 0.01 || d.r <= 0.0005) return null;
                return (
                  <Circle
                    key={`dot-${i}`}
                    cx={d.x}
                    cy={d.y}
                    r={d.r}
                    fill={bodyColor}
                    opacity={d.opacity}
                  />
                );
              })}
            </>
          )}
        </Svg>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: "center",
    justifyContent: "center",
  },
});
