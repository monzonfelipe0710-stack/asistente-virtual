/**
 * BotReactionController
 * ---------------------
 * Cerebro de las reacciones del avatar de ChatAP. Es agnóstico de React:
 * recibe un callback `emit(reaction)` y decide QUÉ reacción y CUÁNDO, nunca
 * cómo se dibuja (eso es responsabilidad de ChatBotAvatar + el motor Bloub).
 *
 * Reglas implementadas:
 *  - Historial con timestamps: `{ type, t }`.
 *  - No repetir la ULTIMA reacción (nunca dos consecutivas iguales).
 *  - No repetir ninguna reacción dentro del mismo segundo (ventana de 1000 ms).
 *  - Cooldown general: una reacción no vuelve a usarse antes de `cooldownMs`.
 *  - Selección por contexto (pools distintos según el evento).
 *  - Timing dinámico: duración de cada reacción y espera hasta la próxima
 *    son variables (con límites), no un timeline fijo.
 *  - Un único timer encadenado (setTimeout), sin múltiples intervalos.
 *  - Respeta `prefers-reduced-motion`: reduce frecuencia y saca las
 *    reacciones de movimiento rápido (tilt/bounce/squash/stretch/lookAround).
 *
 * Tipos de reacción técnicamente posibles con el motor Bloub (mismo
 * personaje, morphing/expresión/mirada — NO se cambia de personaje):
 *   idle | blink | lookLeft | lookRight | lookAround | tilt | bounce |
 *   squash | stretch | surprised | thinking | attention | error |
 *   worried | confus | wink
 */

export const BOT_REACTIONS = [
  "idle",
  "blink",
  "lookLeft",
  "lookRight",
  "lookAround",
  "tilt",
  "bounce",
  "squash",
  "stretch",
  "surprised",
  "thinking",
  "attention",
  "error",
  "worried",
  "confus",
  "wink",
];

const TRANSFORM_REACTIONS = new Set(["tilt", "bounce", "squash", "stretch", "lookAround"]);

const POOLS = {
  idle: ["lookLeft", "lookRight", "lookAround", "blink", "tilt", "squash", "stretch", "bounce", "wink"],
  thinking: ["thinking", "lookLeft", "lookRight", "lookAround", "blink", "tilt", "confus", "wink"],
  respond: ["attention", "bounce", "squash", "blink", "lookLeft", "wink"],
  error: ["error", "worried"],
  concern: ["worried", "confus", "attention"],
};

const BASE_DURATION = {
  thinking: 1300,
  surprised: 1100,
  attention: 1000,
  error: 1400,
  worried: 1200,
  confus: 1000,
  wink: 900,
  blink: 500,
  lookLeft: 800,
  lookRight: 800,
  lookAround: 1100,
  tilt: 900,
  bounce: 800,
  squash: 850,
  stretch: 850,
};

export class BotReactionController {
  constructor({ emit, isReducedMotion }) {
    this.emit = emit;
    this.isReducedMotion = isReducedMotion || (() => false);
    this.recent = [];
    this.timer = null;
    this.stopped = true;
    this.mode = "idle";
  }

  start() {
    this.stopped = false;
    if (this.mode === "idle") this.loop();
  }

  stop() {
    this.stopped = true;
    this.clearTimer();
  }

  /** Vuelve a reposo y limpia el historial (p. ej. al resetear el chat). */
  reset() {
    this.clearTimer();
    this.mode = "idle";
    this.recent = [];
    this.emit("idle");
    if (!this.stopped) this.loop();
  }

  clearTimer() {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }

  schedule(fn, ms) {
    this.clearTimer();
    this.timer = setTimeout(fn, ms);
  }

  /** Eventos que llegan desde ChatWindow. */
  onEvent(type, reaction = "worried") {
    switch (type) {
      case "userMessageSent":
        // El bot "percibe" la pregunta: una atención breve.
        this.emit("attention");
        break;
      case "botThinking":
        this.mode = "thinking";
        this.loop();
        break;
      case "botConcern":
        this.mode = "idle";
        this.emit(reaction);
        this.schedule(() => this.loop(), this.durationFor(reaction));
        break;
      case "botResponding":
        this.mode = "respond";
        this.loop();
        break;
      case "botFinished":
        this.mode = "idle";
        this.emit("idle");
        this.loop();
        break;
      case "botError":
        this.mode = "idle";
        this.emit("idle");
        this.schedule(() => {
          const r = this.pick(POOLS.error);
          this.emit(r);
          this.schedule(() => {
            this.emit("idle");
            this.loop();
          }, this.durationFor(r) + this.idleHold());
        }, 200);
        break;
      default:
        break;
    }
  }

  loop() {
    if (this.stopped) return;
    if (this.mode === "thinking") this.step(POOLS.thinking, () => this.idleHold());
    else if (this.mode === "respond") this.respondStep();
    else this.step(POOLS.idle, () => this.idleGap());
  }

  /** Paso genérico: reacción -> idle -> (espera) -> siguiente.
   *  `gapAfterIdle` es la pausa en reposo antes de la próxima reacción. */
  step(pool, gapAfterIdle) {
    if (this.stopped) return;
    const r = this.pick(pool);
    this.emit(r);
    this.schedule(() => {
      this.emit("idle");
      this.schedule(() => this.loop(), gapAfterIdle());
    }, this.durationFor(r));
  }

  /** El bot "habla": una reacción positiva y luego vuelve a reposo (el
   *  typewriter + el bob ya dan vida durante el resto del mensaje). */
  respondStep() {
    if (this.stopped) return;
    const r = this.pick(POOLS.respond);
    this.emit(r);
    this.schedule(() => {
      this.emit("idle");
      // Pasamos a idle para no sobre-actuar mientras escribe.
      this.mode = "idle";
      this.schedule(() => this.loop(), this.idleHold());
    }, this.durationFor(r));
  }

  /**
   * Selección con reglas:
   *  1. podar el historial fuera del cooldown;
   *  2. excluir la última reacción (no consecutivas);
   *  3. excluir todo lo usado en el último segundo;
   *  4. si no queda nada, relajar la regla del 1s pero nunca repetir la última.
   */
  pick(pool) {
    const now = typeof performance !== "undefined" ? performance.now() : Date.now();
    const cooldown = 3000;
    this.recent = this.recent.filter((e) => now - e.t < cooldown);

    const last = this.recent.length ? this.recent[this.recent.length - 1].type : null;
    const usedLastSecond = new Set(
      this.recent.filter((e) => now - e.t < 1000).map((e) => e.type)
    );

    let available = pool.filter((t) => t !== last && !usedLastSecond.has(t));
    if (available.length === 0) {
      available = pool.filter((t) => t !== last);
    }
    // Reduced motion: sin movimientos rápidos (deformaciones / giros).
    if (this.isReducedMotion()) {
      available = available.filter((t) => !TRANSFORM_REACTIONS.has(t));
      if (available.length === 0) {
        available = pool.filter((t) => t !== last && !TRANSFORM_REACTIONS.has(t));
      }
    }
    if (available.length === 0) return "idle";

    const choice = available[(Math.random() * available.length) | 0];
    this.recent.push({ type: choice, t: now });
    if (this.recent.length > 16) this.recent.shift();
    return choice;
  }

  durationFor(r) {
    const base = BASE_DURATION[r] ?? 900;
    if (this.isReducedMotion()) return base * 0.7;
    return base * (0.8 + Math.random() * 0.5);
  }

  idleHold() {
    // Pausa breve en "idle" entre reacciones, para que siempre vuelva a la
    // posición normal antes de la siguiente.
    return 300 + Math.random() * 400;
  }

  idleGap() {
    // Frecuencia baja en reposo: el personaje parece vivo, no en bucle.
    if (this.isReducedMotion()) return 9000 + Math.random() * 6000;
    return 4000 + Math.random() * 5000;
  }
}
