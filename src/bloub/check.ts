/**
 * Check del motor tras el port a React Native.
 *
 * El motor no cambió una línea, pero ahora lo consume react-native-svg en vez
 * del DOM: si un cuadro trae NaN o un path vacío, en web se ve raro y en nativo
 * revienta el render. Esto falla antes de llegar ahí.
 *
 * Correr:  npx tsc src/bloub/check.ts --outDir <tmp> --module commonjs ... && node <tmp>/check.js
 */
import { strict as assert } from "node:assert";

import { BotEngine } from "./engine";
import { EXPRESSION_BY_ID } from "./expressions";
import { RAYON } from "./repere";
import { DEFAULT_SHAPE, SHAPE_BY_ID } from "./skins";
import { POSES, STATES } from "./states";

const NUM = /-?\d+(\.\d+)?/g;

/** Ningún número del path puede ser NaN/Infinity: react-native-svg los rechaza. */
function assertFinite(d: string, what: string) {
  assert.ok(d.length > 0, `${what}: path vacío`);
  assert.ok(!/NaN|Infinity/.test(d), `${what}: contiene NaN/Infinity -> ${d.slice(0, 80)}`);
  const nums = d.match(NUM) ?? [];
  assert.ok(nums.length > 0, `${what}: path sin coordenadas`);
  for (const n of nums) {
    assert.ok(Number.isFinite(Number(n)), `${what}: coordenada no finita "${n}"`);
  }
}

function demo() {
  const engine = new BotEngine(
    RAYON,
    "idle",
    SHAPE_BY_ID.get(DEFAULT_SHAPE)?.radii ?? null,
    null
  );

  // 1. Un cuadro en reposo trae cuerpo y dos ojos.
  const f0 = engine.sample(0);
  assertFinite(f0.bodyPath, "bodyPath t=0");
  assert.equal(f0.eyes.length, 2, "se esperan dos ojos");
  for (const [i, e] of f0.eyes.entries()) {
    assertFinite(e.d, `ojo ${i}`);
    assert.match(e.matrix, /^matrix\(/, `ojo ${i}: transform no es una matriz SVG`);
    assert.ok(!/NaN/.test(e.matrix), `ojo ${i}: matriz con NaN -> ${e.matrix}`);
  }

  // 2. Dos segundos de reloj, cuadro a cuadro a 60fps: nada se degrada.
  for (let t = 0; t < 2; t += 1 / 60) {
    const f = engine.sample(t);
    assertFinite(f.bodyPath, `bodyPath t=${t.toFixed(3)}`);
    assert.ok(
      f.bodyAlpha >= 0 && f.bodyAlpha <= 1,
      `bodyAlpha fuera de rango en t=${t.toFixed(3)}: ${f.bodyAlpha}`
    );
    for (const d of f.dots) {
      assert.ok(Number.isFinite(d.x) && Number.isFinite(d.y), "punto con coordenada no finita");
      assert.ok(Number.isFinite(d.r) && d.r >= 0, "punto con radio inválido");
    }
  }

  // 3. Todos los estados que usa el avatar rinden un cuadro válido en su pose.
  for (const state of STATES) {
    const e = new BotEngine(RAYON, state.id, SHAPE_BY_ID.get(DEFAULT_SHAPE)?.radii ?? null, null);
    assertFinite(e.sample(POSES[state.id] ?? 1).bodyPath, `estado ${state.id}`);
  }

  // 4. Y todas las expresiones, que es lo que mueve los ojos.
  for (const expr of EXPRESSION_BY_ID.values()) {
    const e = new BotEngine(RAYON, "idle", SHAPE_BY_ID.get(DEFAULT_SHAPE)?.radii ?? null, expr);
    const f = e.sample(1);
    for (const [i, eye] of f.eyes.entries()) {
      if (eye.alpha > 0.01) assertFinite(eye.d, `expresión ${expr.id}, ojo ${i}`);
    }
  }

  // 5. forceBlink y setLook, que es lo que dispara cada reacción del avatar.
  engine.forceBlink(2);
  assertFinite(engine.sample(2.1).bodyPath, "tras forceBlink");
  engine.setLook({ yaw: -35, pitch: 20, mix: 1, spin: 360, wander: 0 }, 2.2);
  assertFinite(engine.sample(2.35).bodyPath, "tras setLook extremo");

  console.log("bloub OK: cuadros finitos en estados, expresiones, blink y look");
}

demo();
