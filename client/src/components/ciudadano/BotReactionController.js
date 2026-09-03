/**
 * BotReactionController v3 — Reacciones naturales con personalidad
 * ----------------------------------------------------------------
 * El bot tiene vida propia: en idle (pantalla de inicio y sin uso),
 * ejecuta secuencias de reacciones naturales que lo hacen sentir
 * como una persona real esperando, no un loop robótico.
 *
 * Modos de idle:
 *  - "curious": mira a lados, inclina cabeza, parpadea
 *  - "bored": bosteza virtual, se estira, mira al techo
 *  - "happy": mueve el cuerpo, sonríe, hace micro-bounces
 *  - "sleepy": parpadea lento, inclina cabeza, se duerme un poco
 *  - "alert": mira al frente, atento, parpadeo frecuente
 *
 * Secuencias de idle:
 *  - "lookAroundBlink": mira izq → der → parpadea
 *  - "tiltNod": inclina → asiente → vuelve
 *  - "microExpress": micro-expresión facial → idle
 *  - "stretchRelax": estira → relaja → parpadea
 */

export const BOT_REACTIONS = [
  // ── Básicas ──
  "idle", "blink", "lookLeft", "lookRight", "lookAround",
  "tilt", "bounce", "squash", "stretch", "wink",
  "lookUp", "lookDown", "tiltLeft", "tiltRight",
  "microBounce", "microSquash",

  // ── Expresiones faciales ──
  "surprised", "thinking", "attention",
  "happy", "excited", "proud", "shy",
  "worried", "confus", "curious",
  "angry", "scared", "bored", "sleepy",
  "relieved", "suspicious", "fierce",

  // ── Estados del cuerpo ──
  "notify", "exclaim", "playful",

  // ── Micro-gestos ──
  "nod", "shake",
];

const TRANSFORM_REACTIONS = new Set([
  "tilt", "bounce", "squash", "stretch", "lookAround",
  "tiltLeft", "tiltRight", "microBounce", "microSquash",
]);

/* ──────────────────── POOLS DE IDLE CON PERSONALIDAD ──────────────────── */

/**
 * Cada pool de idle es un array de "paso": { reaction, hold, pause }.
 * - reaction: qué reacción emitir
 * - hold: cuánto ms mantenerla
 * - pause: pausa ms antes del siguiente paso
 *
 * Si reaction es un array, se elige una al azar (sub-pool).
 */
const IDLE_SEQUENCES = {
  curious: [
    { reaction: ["lookLeft", "lookRight"], hold: 800, pause: 200 },
    { reaction: "blink", hold: 400, pause: 100 },
    { reaction: ["tiltLeft", "tiltRight", "tilt"], hold: 900, pause: 300 },
    { reaction: "curious", hold: 1000, pause: 400 },
    { reaction: "blink", hold: 400, pause: 100 },
  ],
  bored: [
    { reaction: "lookDown", hold: 700, pause: 300 },
    { reaction: "bored", hold: 1100, pause: 500 },
    { reaction: "blink", hold: 400, pause: 200 },
    { reaction: ["microSquash", "tilt"], hold: 800, pause: 400 },
    { reaction: "lookDown", hold: 600, pause: 300 },
  ],
  happy: [
    { reaction: "microBounce", hold: 500, pause: 150 },
    { reaction: "happy", hold: 1100, pause: 300 },
    { reaction: "wink", hold: 800, pause: 200 },
    { reaction: "nod", hold: 500, pause: 150 },
    { reaction: "blink", hold: 400, pause: 200 },
  ],
  sleepy: [
    { reaction: "blink", hold: 500, pause: 300 },
    { reaction: "sleepy", hold: 1200, pause: 500 },
    { reaction: ["lookDown", "lookRight"], hold: 700, pause: 300 },
    { reaction: "blink", hold: 600, pause: 400 },
    { reaction: "microSquash", hold: 800, pause: 400 },
  ],
  alert: [
    { reaction: ["lookLeft", "lookRight"], hold: 700, pause: 200 },
    { reaction: "attention", hold: 900, pause: 200 },
    { reaction: "blink", hold: 400, pause: 100 },
    { reaction: "lookUp", hold: 600, pause: 200 },
    { reaction: "nod", hold: 500, pause: 200 },
  ],
  stretch: [
    { reaction: "stretch", hold: 900, pause: 300 },
    { reaction: "blink", hold: 400, pause: 100 },
    { reaction: ["happy", "relieved"], hold: 1000, pause: 300 },
    { reaction: "nod", hold: 500, pause: 200 },
  ],
  lookAround: [
    { reaction: "lookLeft", hold: 800, pause: 200 },
    { reaction: "blink", hold: 400, pause: 100 },
    { reaction: "lookRight", hold: 800, pause: 200 },
    { reaction: "lookUp", hold: 600, pause: 200 },
    { reaction: "blink", hold: 400, pause: 100 },
    { reaction: "lookDown", hold: 600, pause: 200 },
  ],
  wave: [
    { reaction: "microBounce", hold: 500, pause: 100 },
    { reaction: ["excited", "happy"], hold: 1000, pause: 200 },
    { reaction: "wink", hold: 800, pause: 200 },
    { reaction: "nod", hold: 500, pause: 200 },
  ],
  think: [
    { reaction: "thinking", hold: 1300, pause: 400 },
    { reaction: ["lookLeft", "lookRight"], hold: 700, pause: 200 },
    { reaction: "nod", hold: 500, pause: 200 },
    { reaction: "blink", hold: 400, pause: 100 },
  ],
};

const IDLE_MOOD_KEYS = ["curious", "bored", "happy", "sleepy", "alert", "stretch", "lookAround", "wave", "think"];

/* ──────────────────── POOLS CONTEXTUALES (chat) ──────────────────── */

const POOLS = {
  greeting: [
    "attention", "happy", "bounce", "wink", "excited",
    "nod", "surprised", "microBounce",
  ],
  thinking: [
    "thinking", "lookLeft", "lookRight", "lookAround",
    "blink", "tilt", "confus", "wink", "curious",
    "lookUp", "lookDown", "nod", "microSquash",
  ],
  respond: [
    "attention", "bounce", "squash", "blink",
    "lookLeft", "wink", "happy", "nod",
    "microBounce", "tilt",
  ],
  happy: [
    "happy", "excited", "proud", "bounce", "wink",
    "nod", "microBounce", "stretch", "relieved",
  ],
  error: [
    "error", "worried", "confus", "shy", "lookDown", "tilt",
  ],
  concern: [
    "worried", "confus", "attention", "suspicious",
    "scared", "fierce", "lookDown",
  ],
  confused: [
    "confus", "curious", "thinking", "tilt",
    "lookLeft", "lookRight", "blink", "wink",
  ],
  frustrated: [
    "angry", "fierce", "exclaim", "squash", "tilt", "lookRight",
  ],
  relieved: [
    "relieved", "happy", "stretch", "nod", "wink", "microBounce",
  ],
  apologetic: [
    "worried", "shy", "confus", "lookDown", "tilt",
  ],
  proud: [
    "proud", "happy", "nod", "stretch", "wink", "microBounce",
  ],
};

/* ──────────────────── DURACIONES ──────────────────── */

const BASE_DURATION = {
  idle: 900,
  blink: 400,
  lookLeft: 800,
  lookRight: 800,
  lookAround: 1100,
  lookUp: 700,
  lookDown: 700,
  tilt: 900,
  tiltLeft: 800,
  tiltRight: 800,
  bounce: 800,
  squash: 850,
  stretch: 850,
  microBounce: 500,
  microSquash: 500,
  surprised: 1100,
  thinking: 1300,
  attention: 1000,
  happy: 1200,
  excited: 1000,
  proud: 1100,
  shy: 900,
  worried: 1200,
  confus: 1000,
  curious: 900,
  angry: 1100,
  scared: 1000,
  bored: 1000,
  sleepy: 1100,
  relieved: 1000,
  suspicious: 1000,
  fierce: 900,
  error: 1400,
  wink: 900,
  nod: 600,
  shake: 700,
  notify: 1100,
  exclaim: 1000,
  playful: 900,
  apologetic: 1200,
};

/* ──────────────────── DETECCIÓN DE CONTEXTO ──────────────────── */

function detectUserContext(text) {
  const t = text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  if (/^(hola|buenos?|buenas?|hey|saludos?|como estas?|que tal|como va|que onda)/.test(t)) return "greeting";
  if (/^(gracias?|muchas? gracias|te agradezco|genial|perfecto|excelente|buenisimo|ideal)/.test(t)) return "happy";
  if (/^(perdon|disculpa|sorry|no|nop|nope|para)/.test(t)) return "confused";
  if (/^(que|como|donde|cuando|quien|cuanto|por que|porque)/.test(t)) return "curious";
  if (/^(urgente|ayuda|socorro|emergencia|necesito)/.test(t)) return "concern";
  if (/^(chau|adios|hasta|bye|nos vemos)/.test(t)) return "relieved";
  return "neutral";
}

function detectResponseTone(response) {
  if (!response) return "neutral";
  const text = (response.text || "").toLowerCase();
  if (response.action) {
    if (response.action.type === "download") return "proud";
    if (response.action.type === "location") return "helpful";
  }
  if (/seguridad|no compartas|elimina|cambia la clave/.test(text)) return "concern";
  if (/no encontr|no disponible|error|no se pudo/.test(text)) return "apologetic";
  if (/podés|consultar|ingresar|comunicate/.test(text)) return "helpful";
  return "neutral";
}

/* ──────────────────── CONTROLLER ──────────────────── */

// Tiempo de inactividad antes de dormir (ms)
const SLEEPY_AFTER_MS = 180000;  // 3 min → empieza a parpadear lento
const SLEEP_AFTER_MS = 300000;   // 5 min → cierra ojos + Zzz

export class BotReactionController {
  constructor({ emit, isReducedMotion }) {
    this.emit = emit;
    this.isReducedMotion = isReducedMotion || (() => false);
    this.recent = [];
    this.timer = null;
    this.stopped = true;
    this.mode = "idle";
    this.conversationCount = 0;
    this.lastUserContext = "neutral";
    this.lastResponseTone = "neutral";
    this.consecutiveErrors = 0;
    this.lastReactionTime = 0;
    this.sequencing = false;

    // Idle: personalidad y secuencias
    this.idleMood = this.randomMood();
    this.idleSequenceIndex = 0;
    this.idleSequenceStep = 0;
    this.idleMoodTimer = 0;
    this.idleMoodInterval = 20000 + Math.random() * 25000;

    // Sleep tracking
    this.lastActivityTime = Date.now();
    this.isSleeping = false;
    this.sleepCheckTimer = null;
  }

  start() {
    this.stopped = false;
    this.lastActivityTime = Date.now();
    this.startSleepCheck();
    if (this.mode === "idle") this.idleLoop();
  }

  stop() {
    this.stopped = true;
    this.clearTimer();
    this.stopSleepCheck();
  }

  reset() {
    this.clearTimer();
    this.stopSleepCheck();
    this.mode = "idle";
    this.recent = [];
    this.conversationCount = 0;
    this.lastUserContext = "neutral";
    this.lastResponseTone = "neutral";
    this.consecutiveErrors = 0;
    this.sequencing = false;
    this.idleMood = this.randomMood();
    this.idleSequenceIndex = 0;
    this.idleSequenceStep = 0;
    this.idleMoodTimer = 0;
    this.lastActivityTime = Date.now();
    this.isSleeping = false;
    this.emit("idle");
    this.startSleepCheck();
    if (!this.stopped) this.idleLoop();
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

  /* ── Sleep tracking ── */

  startSleepCheck() {
    this.stopSleepCheck();
    this.sleepCheckTimer = setInterval(() => {
      if (this.stopped || this.conversationCount > 0) return;
      const elapsed = Date.now() - this.lastActivityTime;
      if (elapsed >= SLEEP_AFTER_MS && !this.isSleeping) {
        this.isSleeping = true;
        this.clearTimer();
        this.emit("sleep");
      } else if (elapsed >= SLEEPY_AFTER_MS && elapsed < SLEEP_AFTER_MS && !this.isSleeping) {
        // Modo sleepy: micro-reacciones de sueño
        if (Math.random() < 0.2) {
          this.emit("sleepy");
          setTimeout(() => this.emit("idle"), 800);
        }
      }
    }, 5000);
  }

  stopSleepCheck() {
    if (this.sleepCheckTimer) {
      clearInterval(this.sleepCheckTimer);
      this.sleepCheckTimer = null;
    }
  }

  wakeUp() {
    if (this.isSleeping) {
      this.isSleeping = false;
      this.lastActivityTime = Date.now();
      // Secuencia de despertar: surprise → stretch → nod
      this.sequencing = true;
      this.emit("surprised");
      setTimeout(() => {
        this.emit("stretch");
        setTimeout(() => {
          this.emit("nod");
          setTimeout(() => {
            this.emit("idle");
            this.sequencing = false;
            this.idleMood = this.randomMood();
            this.idleSequenceStep = 0;
            this.idleMoodTimer = 0;
            this.lastActivityTime = Date.now();
            if (!this.stopped) this.idleLoop();
          }, 600);
        }, 800);
      }, 800);
    }
  }

  randomMood() {
    const weights = {
      curious: 3,
      bored: 1,
      happy: 3,
      sleepy: 1,
      alert: 2,
      stretch: 2,
      lookAround: 3,
      wave: 2,
      think: 2,
    };
    const pool = [];
    for (const [mood, w] of Object.entries(weights)) {
      for (let i = 0; i < w; i++) pool.push(mood);
    }
    return pool[(Math.random() * pool.length) | 0];
  }

  pickFromArray(arr) {
    if (Array.isArray(arr)) return arr[(Math.random() * arr.length) | 0];
    return arr;
  }

  /* ── Idle loop con secuencias y personalidad ── */

  idleLoop() {
    if (this.stopped || this.sequencing) return;

    const seq = IDLE_SEQUENCES[this.idleMood];
    if (!seq || seq.length === 0) {
      this.idleMood = this.randomMood();
      this.idleSequenceStep = 0;
      this.schedule(() => this.idleLoop(), 500);
      return;
    }

    const step = seq[this.idleSequenceStep % seq.length];
    const reaction = this.pickFromArray(step.reaction);

    this.emit(reaction);
    const holdTime = step.hold * (0.8 + Math.random() * 0.4);

    this.schedule(() => {
      this.emit("idle");
      this.idleSequenceStep++;
      this.idleMoodTimer += holdTime + step.pause;

      // Cambiar de mood periódicamente
      if (this.idleMoodTimer >= this.idleMoodInterval) {
        const oldMood = this.idleMood;
        this.idleMood = this.randomMood();
        while (this.idleMood === oldMood) this.idleMood = this.randomMood();
        this.idleSequenceStep = 0;
        this.idleMoodTimer = 0;
        this.idleMoodInterval = 18000 + Math.random() * 25000;
      }

      // Pausa entre secuencias (más larga que dentro de la secuencia)
      const gap = this.idleSequenceStep % seq.length === 0
        ? 2500 + Math.random() * 4000
        : step.pause;
      this.schedule(() => this.idleLoop(), gap);
    }, holdTime);
  }

  /* ── Eventos principales ── */

  onEvent(type, data) {
    switch (type) {
      case "userMessageSent": {
        this.clearTimer();
        this.lastActivityTime = Date.now();

        // Si estaba dormido, despertar con animación
        if (this.isSleeping) {
          this.wakeUp();
          // Programar la reacción al mensaje después de despertar
          setTimeout(() => {
            this.conversationCount++;
            const ctx = detectUserContext(data?.text || "");
            this.lastUserContext = ctx;
            const pool = ctx === "greeting" ? POOLS.greeting
              : ctx === "concern" ? POOLS.concern
              : ctx === "confused" ? POOLS.confused
              : POOLS.thinking;
            const r = this.pick(pool);
            this.emit(r);
            setTimeout(() => {
              this.emit("idle");
              this.mode = "thinking";
              this.loop();
            }, this.durationFor(r) * 0.6);
          }, 2800);
          break;
        }

        this.conversationCount++;
        const ctx = detectUserContext(data?.text || "");
        this.lastUserContext = ctx;

        if (this.conversationCount === 1) {
          // Primera interacción: saludo más cálido
          this.emit("attention");
          this.schedule(() => {
            const r = this.pick(POOLS.greeting);
            this.emit(r);
            this.schedule(() => {
              this.emit("idle");
              this.mode = "thinking";
              this.loop();
            }, this.durationFor(r));
          }, 300);
        } else {
          const pool = ctx === "greeting" ? POOLS.greeting
            : ctx === "concern" ? POOLS.concern
            : ctx === "confused" ? POOLS.confused
            : POOLS.thinking;
          const r = this.pick(pool);
          this.emit(r);
          this.schedule(() => {
            this.emit("idle");
            this.mode = "thinking";
            this.loop();
          }, this.durationFor(r) * 0.6);
        }
        break;
      }

      case "botThinking":
        this.clearTimer();
        this.mode = "thinking";
        this.loop();
        break;

      case "botConcern":
        this.clearTimer();
        this.mode = "idle";
        this.emit(data || "worried");
        this.schedule(() => this.loop(), this.durationFor(data || "worried"));
        break;

      case "botResponding": {
        this.clearTimer();
        this.mode = "respond";
        const tone = detectResponseTone(data);
        this.lastResponseTone = tone;

        let pool;
        switch (tone) {
          case "concern": pool = POOLS.concern; break;
          case "apologetic": pool = POOLS.apologetic; break;
          case "proud": pool = POOLS.proud; break;
          case "helpful": pool = POOLS.happy; break;
          default: pool = POOLS.respond;
        }

        const r = this.pick(pool);
        this.emit(r);
        this.schedule(() => {
          this.emit("idle");
          this.mode = "idle";
          this.schedule(() => this.loop(), this.idleHold());
        }, this.durationFor(r));
        break;
      }

      case "botFinished":
        this.clearTimer();
        this.mode = "idle";
        this.emit("idle");
        this.sequencing = false;
        this.idleMood = this.randomMood();
        this.idleSequenceStep = 0;
        this.idleMoodTimer = 0;
        this.schedule(() => this.idleLoop(), this.idleHold() * 1.5);
        break;

      case "botError":
        this.clearTimer();
        this.consecutiveErrors++;
        this.mode = "idle";
        this.emit("idle");
        this.schedule(() => {
          const pool = this.consecutiveErrors >= 3 ? POOLS.frustrated : POOLS.error;
          const r = this.pick(pool);
          this.emit(r);
          this.schedule(() => {
            this.emit("idle");
            this.loop();
          }, this.durationFor(r) + this.idleHold());
        }, 200);
        break;

      case "botSuccess":
        this.clearTimer();
        this.consecutiveErrors = 0;
        this.sequencing = true;
        this.mode = "idle";
        this.emit("happy");
        this.schedule(() => {
          this.emit("nod");
          this.schedule(() => {
            this.emit("idle");
            this.sequencing = false;
            this.idleMood = this.randomMood();
            this.idleSequenceStep = 0;
            this.idleMoodTimer = 0;
            this.loop();
          }, this.durationFor("nod"));
        }, this.durationFor("happy") * 0.7);
        break;

      case "userTyping":
        if (!this.sequencing && Math.random() < 0.3) {
          this.emit("attention");
          this.schedule(() => this.emit("idle"), 600);
        }
        break;

      default:
        break;
    }
  }

  /* ── Loops (chat) ── */

  loop() {
    if (this.stopped || this.sequencing) return;
    if (this.mode === "thinking") this.step(POOLS.thinking, () => this.idleHold());
    else if (this.mode === "respond") this.respondStep();
    else this.idleLoop();
  }

  step(pool, gapAfterIdle) {
    if (this.stopped) return;
    const r = this.pick(pool);
    this.emit(r);
    this.schedule(() => {
      this.emit("idle");
      this.schedule(() => this.loop(), gapAfterIdle());
    }, this.durationFor(r));
  }

  respondStep() {
    if (this.stopped) return;
    const r = this.pick(POOLS.respond);
    this.emit(r);
    this.schedule(() => {
      this.emit("idle");
      this.mode = "idle";
      this.schedule(() => this.loop(), this.idleHold());
    }, this.durationFor(r));
  }

  /* ── Selección inteligente ── */

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
    if (this.isReducedMotion()) {
      available = available.filter((t) => !TRANSFORM_REACTIONS.has(t));
      if (available.length === 0) {
        available = pool.filter((t) => t !== last && !TRANSFORM_REACTIONS.has(t));
      }
    }
    if (available.length === 0) return "idle";

    const choice = available[(Math.random() * available.length) | 0];
    this.recent.push({ type: choice, t: now });
    if (this.recent.length > 20) this.recent.shift();
    this.lastReactionTime = now;
    return choice;
  }

  durationFor(r) {
    const base = BASE_DURATION[r] ?? 900;
    if (this.isReducedMotion()) return base * 0.7;
    return base * (0.75 + Math.random() * 0.5);
  }

  idleHold() {
    return 300 + Math.random() * 400;
  }
}