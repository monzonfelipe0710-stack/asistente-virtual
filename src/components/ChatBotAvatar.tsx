import { useEffect, useRef, useState } from "react";
import {
  AccessibilityInfo,
  Animated,
  AppState,
  Easing,
  Pressable,
  StyleSheet,
  View,
} from "react-native";
import Svg, { Circle, Path } from "react-native-svg";

import { BotEngine, type BotFrame, type Look } from "../bloub/engine";
import { EXPRESSION_BY_ID, type BotExpression } from "../bloub/expressions";
import { DEMI_VIEWBOX, RAYON } from "../bloub/repere";
import { DEFAULT_SHAPE, SHAPE_BY_ID } from "../bloub/skins";
import { POSES, type StateId } from "../bloub/states";
import { Typography, useColors } from "../constants/theme";

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
  customExpr?: BotExpression;
  look?: Look;
  transform?: TransformId;
}

/** Ojos cerrados e inclinación leve: se usa cuando el bot lleva rato dormido. */
const SLEEP_EXPRESSION: BotExpression = {
  id: "somnolent",
  gaze: { yaw: 4, pitch: -6, roll: -3 },
  split: 16,
  eyes: [
    { w: 0.2, h: 0.42, tilt: 0, open: 0 },
    { w: 0.2, h: 0.42, tilt: 0, open: 0 },
  ],
};

const REACTION_CONFIG = {
  idle:        { state: "idle", look: { yaw: 0, pitch: 0, mix: 0, spin: 0, wander: 1 } },
  blink:       { blink: true },
  lookLeft:    { look: { yaw: -35, pitch: 0, mix: 1, spin: 0, wander: 0 } },
  lookRight:   { look: { yaw: 35, pitch: 0, mix: 1, spin: 0, wander: 0 } },
  lookAround:  { look: { yaw: 0, pitch: 0, mix: 0, spin: 360, wander: 0 } },
  lookUp:      { look: { yaw: 0, pitch: -20, mix: 1, spin: 0, wander: 0 } },
  lookDown:    { look: { yaw: 0, pitch: 20, mix: 1, spin: 0, wander: 0 } },
  tilt:        { transform: "rx-tilt", state: "idle", look: { yaw: 0, pitch: 0, mix: 0, spin: 0, wander: 1 } },
  tiltLeft:    { transform: "rx-tilt", state: "idle", look: { yaw: -15, pitch: 5, mix: 1, spin: 0, wander: 0 } },
  tiltRight:   { transform: "rx-tilt", state: "idle", look: { yaw: 15, pitch: 5, mix: 1, spin: 0, wander: 0 } },
  bounce:      { transform: "rx-bounce", state: "idle", look: { yaw: 0, pitch: 0, mix: 0, spin: 0, wander: 1 } },
  squash:      { transform: "rx-squash", state: "idle", look: { yaw: 0, pitch: 0, mix: 0, spin: 0, wander: 1 } },
  stretch:     { transform: "rx-stretch", state: "idle", look: { yaw: 0, pitch: 0, mix: 0, spin: 0, wander: 1 } },
  microBounce: { transform: "rx-bounce", state: "idle", look: { yaw: 0, pitch: 0, mix: 0, spin: 0, wander: 1 } },
  microSquash: { transform: "rx-squash", state: "idle", look: { yaw: 0, pitch: 0, mix: 0, spin: 0, wander: 1 } },
  wink:        { state: "wink" },
  surprised:   { state: "wide" },
  thinking:    { state: "thinking" },
  attention:   { expr: "attentif" },
  happy:       { expr: "heureux", look: { yaw: 5, pitch: 9, mix: 1, spin: 0, wander: 0 } },
  excited:     { expr: "excite", state: "idle", look: { yaw: 6, pitch: -14, mix: 1, spin: 0, wander: 0 } },
  proud:       { expr: "fier", look: { yaw: 5, pitch: 17, mix: 1, spin: 0, wander: 0 } },
  shy:         { expr: "timide", look: { yaw: -19, pitch: -14, mix: 1, spin: 0, wander: 0 } },
  relieved:    { expr: "heureux", state: "idle", look: { yaw: 0, pitch: 5, mix: 0.5, spin: 0, wander: 0.5 } },
  worried:     { expr: "triste" },
  confus:      { expr: "confus", look: { yaw: -14, pitch: 3, mix: 1, spin: 0, wander: 0 } },
  curious:     { expr: "curieux", look: { yaw: 16, pitch: -9, mix: 1, spin: 0, wander: 0 } },
  angry:       { expr: "colere", look: { yaw: 3, pitch: 7, mix: 1, spin: 0, wander: 0 } },
  scared:      { expr: "effraye", look: { yaw: 2, pitch: -20, mix: 1, spin: 0, wander: 0 } },
  bored:       { expr: "blase", look: { yaw: -22, pitch: 2, mix: 1, spin: 0, wander: 0 } },
  sleepy:      { expr: "somnolent", look: { yaw: 6, pitch: -9, mix: 1, spin: 0, wander: 0 } },
  suspicious:  { expr: "mefiant", look: { yaw: 12, pitch: 6, mix: 1, spin: 0, wander: 0 } },
  fierce:      { expr: "colere", state: "alert", look: { yaw: 0, pitch: 5, mix: 1, spin: 0, wander: 0 } },
  notify:      { state: "notify" },
  exclaim:     { state: "exclaim" },
  playful:     { state: "wink", expr: "excite", look: { yaw: 8, pitch: -5, mix: 1, spin: 0, wander: 0 } },
  nod:         { look: { yaw: 0, pitch: 12, mix: 1, spin: 0, wander: 0 } },
  shake:       { look: { yaw: 0, pitch: 0, mix: 1, spin: 0, wander: 0 }, expr: "confus" },
  apologetic:  { expr: "triste", look: { yaw: 0, pitch: 15, mix: 1, spin: 0, wander: 0 } },
  sleep:       { customExpr: SLEEP_EXPRESSION, look: { yaw: 4, pitch: -6, mix: 0.5, spin: 0, wander: 0 } },
} satisfies Record<string, ReactionCfg>;

export type BotReaction = keyof typeof REACTION_CONFIG;

const DOT_POOL = 6;

/** Reacciones que el bot se dispara solo cuando nadie le pide nada. */
const AUTO_REACTIONS: BotReaction[] = [
  "blink", "wink", "blink", "wink",
  "lookLeft", "lookRight", "lookUp", "lookDown",
  "tiltLeft", "tiltRight",
  "microBounce", "microSquash", "stretch",
  "surprised", "thinking", "attention",
  "happy", "excited", "proud", "shy", "relieved",
  "curious", "confus", "playful", "nod",
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
  if (cfg.customExpr) {
    engine.setExpression(cfg.customExpr, t);
  } else if (cfg.expr) {
    engine.setExpression(EXPRESSION_BY_ID.get(cfg.expr) ?? null, t);
  }
  if (cfg.look) engine.setLook(cfg.look, t);
}

function ZzzLetter({
  size,
  delay,
  top,
  left,
  color,
  char,
}: {
  size: number;
  delay: number;
  top: number;
  left: number;
  color: string;
  char: string;
}) {
  const t = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(t, {
          toValue: 1,
          duration: 2400,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [delay, t]);

  return (
    <Animated.Text
      style={{
        position: "absolute",
        top,
        left,
        fontSize: size,
        fontWeight: Typography.bold,
        color,
        opacity: t.interpolate({
          inputRange: [0, 0.2, 0.8, 1],
          outputRange: [0, 1, 0.8, 0],
        }),
        transform: [
          {
            translateX: t.interpolate({
              inputRange: [0, 0.2, 0.8, 1],
              outputRange: [0, 4, 10, 12],
            }),
          },
          {
            translateY: t.interpolate({
              inputRange: [0, 0.2, 0.8, 1],
              outputRange: [0, -8, -28, -34],
            }),
          },
          {
            scale: t.interpolate({
              inputRange: [0, 0.2, 0.8, 1],
              outputRange: [0.6, 1, 1.1, 1.1],
            }),
          },
        ],
      }}
    >
      {char}
    </Animated.Text>
  );
}

/** Las tres "Z" que flotan cuando el bot duerme. */
function ZzzOverlay({ size, color }: { size: number; color: string }) {
  const base = size * 0.38;
  const letters = [
    { size: base, delay: 0, top: 0, left: 0 },
    { size: base * 0.8, delay: 600, top: -base * 0.3, left: base * 0.4 },
    { size: base * 0.6, delay: 1200, top: -base * 0.7, left: base * 0.8 },
  ];

  return (
    <View
      pointerEvents="none"
      style={[styles.zzzLayer, { top: -size * 0.15, right: -size * 0.1 }]}
    >
      {letters.map((l, i) => (
        <ZzzLetter
          key={i}
          size={l.size}
          delay={l.delay}
          top={l.top}
          left={l.left}
          color={color}
          char={i === 0 ? "Z" : "z"}
        />
      ))}
    </View>
  );
}

interface Props {
  reaction?: BotReaction;
  size?: number;
  speaking?: boolean;
  /** Un solo cuadro, sin reloj: para listas y avatares chicos. */
  static?: boolean;
}

export default function ChatBotAvatar({
  reaction = "idle",
  size = 44,
  speaking = false,
  static: isStatic = false,
}: Props) {
  const C = useColors();
  const bodyColor = C.slate900;
  const eyeColor = C.white;

  const [frame, setFrame] = useState<BotFrame | null>(null);
  const [autoReaction, setAutoReaction] = useState<BotReaction | null>(null);
  const [reduceMotion, setReduceMotion] = useState(false);
  const [rxKind, setRxKind] = useState<TransformId | "">("");

  const engineRef = useRef<BotEngine | null>(null);
  const clockRef = useRef(0);
  const reactionRef = useRef<BotReaction>(reaction);
  const drawRef = useRef<(() => void) | null>(null);

  const rx = useRef(new Animated.Value(0)).current;
  const speak = useRef(new Animated.Value(0)).current;

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
      RAYON,
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

  // Reacción efectiva: la que pidan, o la automática cuando está en reposo.
  useEffect(() => {
    const eff = reaction === "idle" && autoReaction ? autoReaction : reaction;
    reactionRef.current = eff;

    const engine = engineRef.current;
    if (!engine) return;

    const cfg: ReactionCfg = REACTION_CONFIG[eff] ?? REACTION_CONFIG.idle;
    applyConfig(engine, cfg, clockRef.current);

    const kind =
      cfg.transform && !speaking && !reduceMotion ? cfg.transform : "";
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
  }, [reaction, autoReaction, speaking, isStatic, reduceMotion, rx]);

  // Pulso mientras "habla".
  useEffect(() => {
    if (!speaking || reduceMotion) {
      speak.setValue(0);
      return;
    }
    const loop = Animated.loop(
      Animated.timing(speak, {
        toValue: 1,
        duration: 900,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      })
    );
    loop.start();
    return () => loop.stop();
  }, [speaking, reduceMotion, speak]);

  // Vida propia en reposo: cada tanto se manda una reacción al azar.
  useEffect(() => {
    if (isStatic || reduceMotion || reaction !== "idle") return;

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
  }, [isStatic, reduceMotion, reaction]);

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

  if (speaking && !reduceMotion) {
    transform.push(
      {
        translateY: speak.interpolate({
          inputRange: [0, 0.25, 0.5, 0.75, 1],
          outputRange: [0, -2, 0, -1, 0],
        }),
      },
      {
        scale: speak.interpolate({
          inputRange: [0, 0.25, 0.5, 0.75, 1],
          outputRange: [1, 1.03, 1, 1.02, 1],
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

  const isSleeping = reaction === "sleep";
  const vb = DEMI_VIEWBOX;

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
      {isSleeping && <ZzzOverlay size={size} color={C.slate500} />}
      <Animated.View style={{ transform, opacity: isSleeping ? 0.7 : 1 }}>
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
  zzzLayer: {
    position: "absolute",
    zIndex: 10,
    width: 1,
    height: 1,
  },
});
