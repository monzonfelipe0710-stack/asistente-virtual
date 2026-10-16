import { arcRender, type ArcRender, type DotRender } from './decor'
import { blendExpression, type BotExpression } from './expressions'
import { eyeOffset } from './eyefit'
import { blinkScale, eyePoses, liveliness } from './face'
import { clamp, easings, lerp, r2 } from './math'
import {
  blend,
  capsulePath,
  closedPath,
  radiusAtAngle,
  toPoints,
  type Point,
  type Silhouette
} from './shape'
import { STATE_BY_ID, type Pose, type StateDef, type StateId } from './states'

interface RenderedEye {
  d: string
  matrix: string
  alpha: number
}

export interface BotFrame {
  bodyPath: string
  bodyAlpha: number
  eyes: RenderedEye[]
  dots: DotRender[]
  /** true = the dots go behind the body (burst particles) */
  dotsBehind: boolean
  arcs: ArcRender[]
  notif: { x: number; y: number; r: number } | null
  notch: { x: number; y: number; r: number } | null
}

/**
 * Where the bot directs its gaze when something external drives it — the
 * mouse pointer, today.
 *
 * `yaw` and `pitch` are ABSOLUTE directions, which replace those of the pose
 * as `mix` rises. Two reasons, each a trap already fallen into:
 *
 * - it is the ENGINE that must do this blend, not the caller, because only it
 *   knows the pose AT THIS INSTANT. A caller that compensated for the orientation of
 *   the expression would read its final value while the morph is still in
 *   progress, and the eyes jumped on every mood change;
 * - and it must be absolute on BOTH axes. In relative mode, the height of the
 *   eyes followed that of each expression — "neutral" looks at +28.6deg while
 *   the others are between -9 and +9 — so the eyes dropped all at once on the first
 *   mood change. What gives an expression its character during
 *   tracking is the SHAPE of its eyes (squinted, round, asymmetric), not
 *   where it looks: that is decided by the cursor.
 *
 * `mix` says how much the outside controls the DIRECTION (0 = not at all).
 *
 * `wander` says, separately, how much automatic drift remains. The two must not
 * be confused: when the pointer moves, the drift must die out — added together,
 * the bot would look like it is searching for the cursor without ever holding it. But when there
 * is NO pointer (arrival via keyboard, touch, or mouse out of the
 * window), the head must stay turned AND keep living. Confusing them
 * froze the gaze as soon as the view opened.
 *
 * `spin` is a turn to travel ALONG THE WAY, in degrees, faded towards 0
 * with the arrival. Since the eyes live on a sphere, a turn takes them
 * behind the ball and back on the other side — and `-360deg` being the same
 * angle as `0`, it changes nothing about where they settle.
 */
export interface Look {
  yaw: number
  pitch: number
  mix: number
  spin: number
  wander: number
}

const NO_LOOK: Look = { yaw: 0, pitch: 0, mix: 0, spin: 0, wander: 1 }

const lerpLook = (a: Look, b: Look, t: number): Look => ({
  yaw: lerp(a.yaw, b.yaw, t),
  pitch: lerp(a.pitch, b.pitch, t),
  mix: lerp(a.mix, b.mix, t),
  spin: lerp(a.spin, b.spin, t),
  wander: lerp(a.wander, b.wander, t)
})

const lerpEye = (a: Pose['eyes'][number], b: Pose['eyes'][number], t: number) => ({
  w: lerp(a.w, b.w, t),
  h: lerp(a.h, b.h, t),
  open: lerp(a.open, b.open, t),
  tilt: lerp(a.tilt ?? 0, b.tilt ?? 0, t)
})

/** Interpolation of two poses. The decor cross-fades in opacity, not in geometry. */
function blendPose(a: Pose, b: Pose, t: number): Pose {
  const out = 1 - t
  return {
    sil: blend(a.sil, b.sil, t),
    offX: lerp(a.offX, b.offX, t),
    offY: lerp(a.offY, b.offY, t),
    gaze: {
      yaw: lerp(a.gaze.yaw, b.gaze.yaw, t),
      pitch: lerp(a.gaze.pitch, b.gaze.pitch, t),
      roll: lerp(a.gaze.roll, b.gaze.roll, t)
    },
    split: lerp(a.split, b.split, t),
    eyes: [lerpEye(a.eyes[0], b.eyes[0], t), lerpEye(a.eyes[1], b.eyes[1], t)],
    eyeAlpha: lerp(a.eyeAlpha, b.eyeAlpha, t),
    bodyAlpha: lerp(a.bodyAlpha, b.bodyAlpha, t),
    dots: [
      ...a.dots.map((d) => ({ ...d, opacity: d.opacity * out })),
      ...b.dots.map((d) => ({ ...d, opacity: d.opacity * t }))
    ],
    arcs: [
      ...a.arcs.map((r) => ({ ...r, id: `a${r.id}`, opacity: r.opacity * out })),
      ...b.arcs.map((r) => ({ ...r, id: `b${r.id}`, opacity: r.opacity * t }))
    ],
    // the badge belongs to only one of the two states, it does not blend
    notif: t < 0.5 ? a.notif : b.notif,
    dotsBehind: t < 0.5 ? a.dotsBehind : b.dotsBehind
  }
}

/**
 * Clockless engine: `sample(t)` is a pure function of time.
 *
 * Practical consequence: pause, resume, slow motion and jumping to an arbitrary time
 * give exactly the same image, and rendering is testable without a DOM.
 */
export class BotEngine {
  /** radius of the ball at rest, in viewBox units */
  readonly scale: number

  private cur: StateId
  private prev: StateId | null = null
  /**
   * FROZEN starting pose, set only when a state change arrives while a
   * fade is already in progress. See `setState`.
   */
  private frozenStart: Pose | null = null
  private tCur = 0
  private tPrev = 0
  private blinkAt = -10
  private pts: Point[] = []
  private shape: number[] | null = null
  private expr: BotExpression | null = null
  private exprPrev: BotExpression | null = null
  private exprAt = -10
  private look: Look = NO_LOOK
  private lookPrev: Look = NO_LOOK
  private lookAt = -10
  /** current catch-up duration; see `LOOK_MORPH`, its default value */
  private lookMorph = 0.24

  /** duration of the morph when the expression changes */
  static readonly SHAPE_MORPH = 0.45

  /**
   * Catch-up duration of the gaze towards the target. Shorter than `SHAPE_MORPH`:
   * a gaze that follows must look attentive, not sluggish. Since the target is
   * set again on every mouse move, this duration is what gives tracking
   * its inertia — the gaze never quite reaches a moving cursor.
   */
  static readonly LOOK_MORPH = 0.24

  constructor(
    scale = 100,
    initial: StateId = 'idle',
    shape: number[] | null = null,
    expression: BotExpression | null = null
  ) {
    this.scale = scale
    this.cur = initial
    this.shape = shape
    this.expr = expression
  }

  /**
   * Resting expression chosen in the customizer. It slides towards the
   * new value instead of jumping.
   */
  setExpression(expression: BotExpression | null, now = 0) {
    if (expression === this.expr) return
    this.exprPrev = this.expr
    this.expr = expression
    this.exprAt = now
  }

  /** Effective expression at instant `now`, morph in progress included. */
  private exprAtTime(now: number): BotExpression | null {
    const to = this.expr
    const from = this.exprPrev
    if (!to || !from) return to
    const k = (now - this.exprAt) / BotEngine.SHAPE_MORPH
    if (k >= 1) return to
    return blendExpression(from, to, easings.easeOutQuint(clamp(k)))
  }

  /**
   * New gaze target, `null` to go back to the state's own.
   *
   * It restarts from the CURRENT value, not from the previous target: this
   * method is called on every pointer move, and restarting from the old
   * target would pull the gaze back a notch before each catch-up — tracking
   * would jitter instead of sliding.
   *
   * External state enters through a timestamped setter, never through a variable read
   * during `sample`, otherwise the engine stops being a pure function of time.
   */
  setLook(look: Look | null, now: number, morph = BotEngine.LOOK_MORPH) {
    /*
     * A non-finite target is rejected. The engine KEEPS the last one: a `NaN`
     * set a single time would propagate to every frame and the bot would
     * never settle again. It really happened — a
     * `getBoundingClientRect` on a zero-size box gives `0 / 0` on the
     * caller's side. That one is fixed, but the engine does not have to depend on the
     * caution of its callers to stay replayable.
     */
    if (look && !Number.isFinite(look.yaw + look.pitch + look.mix + look.spin + look.wander)) {
      return
    }
    this.lookPrev = this.lookAtTime(now)
    this.look = look ?? NO_LOOK
    this.lookAt = now
    this.lookMorph = morph
  }

  /** Effective gaze at instant `now`, catch-up in progress included. */
  private lookAtTime(now: number): Look {
    const k = (now - this.lookAt) / this.lookMorph
    if (k >= 1) return this.look
    return lerpLook(this.lookPrev, this.look, easings.easeOutQuint(clamp(k)))
  }

  private posed(
    def: StateDef,
    t: number,
    shape: number[] | null,
    expr: BotExpression | null
  ): Pose {
    let pose = def.pose(t)
    if (def.baseBody && shape) {
      // we keep the pose (rotation, offset, squash) and only swap the profile
      pose = { ...pose, sil: { ...pose.sil, radii: shape } }
    }
    if (def.baseFace && expr) {
      pose = { ...pose, gaze: expr.gaze, split: expr.split, eyes: expr.eyes }
    }
    return pose
  }

  /**
   * Eye offset at instant `now` for a given state, in ball-radius units.
   *
   * It is READ from a table and interpolated, never recomputed: `eyefit.ts` explains
   * why that distinction is the whole fix. Here all that remains is to interpolate it
   * along the expression axis, with the curve and duration of its morph.
   */
  private offsetAtTime(now: number, state: StateId): { x: number; y: number } {
    /**
     * A morph axis: we read the table at its two ENDPOINTS and interpolate with its
     * curve. Never on the interpolated value — that one has no identity and exists
     * in no table, and feeding it in is what made the previous
     * versions jitter.
     */
    const alongAxis = (
      start: number,
      duration: number,
      a: { x: number; y: number },
      b: { x: number; y: number }
    ) => {
      if (a === b) return b
      const k = (now - start) / duration
      if (k >= 1) return b
      const t = easings.easeOutQuint(clamp(k))
      return { x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t) }
    }

    return alongAxis(
      this.exprAt,
      BotEngine.SHAPE_MORPH,
      eyeOffset(this.shape, state, this.exprPrev?.id ?? null),
      eyeOffset(this.shape, state, this.expr?.id ?? null)
    )
  }

  /**
   * Origin of the fade in progress: the frozen pose if there is one, otherwise the state being left,
   * evaluated at its own elapsed time — so still animating, which is intended.
   */
  private origin(
    now: number,
    shape: number[] | null,
    expr: BotExpression | null
  ): Pose | null {
    if (this.frozenStart) return this.frozenStart
    if (!this.prev) return null
    const prevDef = STATE_BY_ID.get(this.prev)!
    return this.posed(prevDef, Math.max(0, now - this.tPrev), shape, expr)
  }

  /**
   * Composite pose at instant `now`, fade in progress included: exactly what `sample`
   * blends, before the idle-life and gaze layer. Extracted so that `setState`
   * can freeze it.
   */
  private compositePose(now: number): Pose {
    const def = STATE_BY_ID.get(this.cur)!
    const shape = this.shape
    const expr = this.exprAtTime(now)
    const pose = this.posed(def, Math.max(0, now - this.tCur), shape, expr)
    const since = now - this.tCur
    if (since >= def.morph) return pose
    const origin = this.origin(now, shape, expr)
    if (!origin) return pose
    return blendPose(origin, pose, easings.easeOutQuint(clamp(since / def.morph)))
  }

  /**
   * State change, timestamped.
   *
   * The engine keeps only ONE history slot, so a change that arrived during a
   * fade replaced the origin of the blend with the FULL pose of the state being left,
   * instead of the partially blended image that was on screen. Measured on
   * `idle -> wide -> idle` at 100 ms: a 35.9 px jump versus 8.0 px of normal motion.
   *
   * So we freeze the current composite pose and blend from it. Continuous by
   * construction, no matter how many changes are chained.
   *
   * And ONLY in that case. Freezing on every change would abruptly stop the animation of
   * the state being left for the whole fade — the "!" of `alert` would freeze mid
   * travel — while there is nothing to correct outside a morph: the state being left is already
   * exactly the displayed image there. Playing a sequence, whose blocks last at least
   * the longest fade, therefore never freezes anything and renders bit for bit what it
   * rendered before.
   */
  setState(id: StateId, now: number) {
    if (id === this.cur) return
    const morph = STATE_BY_ID.get(this.cur)!.morph
    const midFade = this.prev !== null && now - this.tCur < morph
    this.frozenStart = midFade ? this.compositePose(now) : null
    this.prev = this.cur
    this.tPrev = this.tCur
    this.cur = id
    this.tCur = now
      // In the video, every shape change is masked by a blink.
      if (STATE_BY_ID.get(id)?.blinkIn) this.blinkAt = now
    }

    /** Forces an immediate blink, used by the explicit `blink` reaction. */
    forceBlink(now: number) {
      this.blinkAt = now
    }


  sample(now: number): BotFrame {
    const R = this.scale
    const def = STATE_BY_ID.get(this.cur)!
    const shape = this.shape
    const expr = this.exprAtTime(now)
    let pose = this.posed(def, Math.max(0, now - this.tCur), shape, expr)
    let offset = this.offsetAtTime(now, this.cur)

    // --- transition -------------------------------------------------------
    const since = now - this.tCur
    // The previous state is never purged: `since < def.morph` is enough to
    // ignore it once the fade is over, and forgetting it would make the engine non
    // replayable — re-reading a time before the end of the fade would no longer
    // find it. It is the optimization that looks innocent and breaks everything.
    const origin = since < def.morph ? this.origin(now, shape, expr) : null
    if (origin) {
      // Exponential ease-out: it is the curve measured on the video. The body
      // has no overshoot (only the badge and the eye opening have one).
      // The ratio is clamped: re-reading a time BEFORE the state change
      // would give a negative ratio, which the ease-out extrapolates — the silhouette
      // then goes thirty times too far.
      const ratio = easings.easeOutQuint(clamp(since / def.morph))
      pose = blendPose(origin, pose, ratio)
      // The eye offset follows the SAME curve as the silhouette that motivates it. It comes
      // from the state being left, which `setState` always fills in together with the origin —
      // the check is there for typing, not for a real case.
      const leaving = this.prev
      if (leaving) {
        const before = this.offsetAtTime(now, leaving)
        offset = {
          x: lerp(before.x, offset.x, ratio),
          y: lerp(before.y, offset.y, ratio)
        }
      }
    }

    // --- idle life --------------------------------------------------------
    const alive = pose.eyeAlpha > 0.01
    const look = this.lookAtTime(now)
    const life = liveliness(now, { wander: alive ? look.wander : 0, blink: alive })

    const gaze = {
      // Both aims REPLACE those of the pose instead of adding to them (see
      // `Look`), and the turn is subtracted along the way. The drift is added AFTER the
      // blend, otherwise the target would cancel it along with the pose — yet it
      // must survive a turned head without a pointer.
      yaw: lerp(pose.gaze.yaw, look.yaw, look.mix) + life.dYaw - look.spin,
      pitch: lerp(pose.gaze.pitch, look.pitch, look.mix) + life.dPitch,
      // the roll, for its part, follows nothing: the bot's head is tilted by -13deg in
      // the video, and making it roll with the cursor breaks that signature
      roll: pose.gaze.roll + life.dRoll
    }

    // blink triggered by the state change, on top of the schedule
    const forced = clamp((now - this.blinkAt) / 0.2)
    const forcedLid = forced < 1 ? Math.abs(forced * 2 - 1) : 1
    const lid = Math.min(life.lid, forcedLid)

    const offX = pose.offX + life.driftX
    const offY = pose.offY + life.driftY

    // --- body -------------------------------------------------------------
    const sil: Silhouette = {
      ...pose.sil,
      cx: pose.sil.cx + offX,
      cy: pose.sil.cy + offY,
      sy: pose.sil.sy * life.breath
    }
    const bodyPath = closedPath(toPoints(sil, R, this.pts))

    // --- eyes -------------------------------------------------------------
    // The eyes live on a sphere of radius 1; as soon as the silhouette is no
    // longer a circle, we bring them back in proportion to the real radius in their
    // direction, otherwise they overflow and the mask clips them.
    const bodyRadius = (x: number, y: number) =>
      radiusAtAngle(pose.sil.radii, Math.atan2(y, x) - pose.sil.rot)

    const eyes: RenderedEye[] = []
    if (pose.eyeAlpha > 0.01) {
      const poses = eyePoses(gaze, R, pose.split)
      for (let i = 0; i < 2; i++) {
        const e = poses[i]!
        if (e.depth <= 0.02) continue
        const cfg = pose.eyes[i]!
        const fit = bodyRadius(e.x, e.y)
        // Individual tilt of the eye: we compose the tangent frame with a
        // rotation in the plane of the eye (Basis x Rot). That is what allows
        // mirrored tilts between the two eyes.
        const phi = ((cfg.tilt ?? 0) * Math.PI) / 180
        const cp = Math.cos(phi)
        const sp = Math.sin(phi)
        const ax = e.a * cp + e.c * sp
        const ay = e.b * cp + e.d * sp
        const cx2 = -e.a * sp + e.c * cp
        const cy2 = -e.b * sp + e.d * cp
        // The blink applies AFTER all that: it is a vertical squash
        // on screen, not along the axis of the capsule.
        const k = blinkScale(Math.min(lid, cfg.open))
        eyes.push({
          d: capsulePath(cfg.w * R, cfg.h * R),
          matrix: `matrix(${r2(ax)},${r2(ay * k)},${r2(cx2)},${r2(cy2 * k)},${r2(e.x * fit + (offX + offset.x) * R)},${r2(e.y * fit + (offY + offset.y) * R)})`,
          alpha: pose.eyeAlpha * clamp(e.depth / 0.12)
        })
      }
    }

    // --- decor ------------------------------------------------------------
    const dots = pose.dots
      .filter((p) => p.opacity > 0.01 && p.r > 0.0005)
      .map((p) => ({ ...p, x: (p.x + offX) * R, y: (p.y + offY) * R, r: p.r * R }))

    // the badge is placed on the outline: so it follows the shape too
    const nFit = pose.notif ? bodyRadius(pose.notif.x, pose.notif.y) : 1
    const nx = pose.notif ? (pose.notif.x * nFit + offX) * R : 0
    const ny = pose.notif ? (pose.notif.y * nFit + offY) * R : 0
    const notif = pose.notif ? { x: nx, y: ny, r: pose.notif.r * R } : null
    const notch = pose.notif ? { x: nx, y: ny, r: pose.notif.notch * R } : null

    return {
      bodyPath,
      bodyAlpha: pose.bodyAlpha,
      eyes,
      dots,
      dotsBehind: pose.dotsBehind,
      // States declare arcs in ball-radius units; the engine
      // is the only one that knows the viewBox scale, so it is the one that draws.
      arcs: pose.arcs
        .filter((a) => a.opacity > 0.01)
        .map((a) => arcRender(a.seed, a.t, R, a.id, a.opacity)),
      notif,
      notch
    }
  }
}

