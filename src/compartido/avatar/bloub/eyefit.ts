import { EXPRESSIONS, type BotExpression } from './expressions'
import { eyePoses } from './face'
import { radiusAtAngle, toPoints, type Point } from './shape'
import { SHAPES } from './skins'
import { STATES, type Pose, type StateDef, type StateId } from './states'

const R = 100

const DRIFT_YAW = 5.5 + 1.6
const DRIFT_PITCH = 4.2 + 1.3
const DRIFT_X = 0.006
const DRIFT_Y = 0.007

interface Face {
  gaze: Pose['gaze']
  split: number
  eyes: Pose['eyes']
}

interface Footprint {
  x: number
  y: number
  ax: number
  ay: number
  r: number
  m: [number, number, number, number]
}

function footprints(face: Face, sil: Pose['sil'], radii: number[]): Footprint[] {
  const out: Footprint[] = []
  const poses = eyePoses(face.gaze, R, face.split)
  for (let i = 0; i < 2; i++) {
    const e = poses[i]!
    if (e.depth <= 0.02) continue
    const cfg = face.eyes[i]!
    const phi = ((cfg.tilt ?? 0) * Math.PI) / 180
    const cp = Math.cos(phi)
    const sp = Math.sin(phi)
    const ax = e.a * cp + e.c * sp
    const ay = e.b * cp + e.d * sp
    const cx = -e.a * sp + e.c * cp
    const cy = -e.b * sp + e.d * cp

    const hw = Math.max(cfg.w * R, 0.01) / 2
    const hh = Math.max(cfg.h * R, 0.01) / 2
    const r = Math.min(hw, hh)
    const long = hh > hw
    const halfLen = long ? hh - r : hw - r
    const fit = radiusAtAngle(radii, Math.atan2(e.y, e.x) - sil.rot)
    out.push({
      x: e.x * fit,
      y: e.y * fit,
      ax: (long ? cx : ax) * halfLen,
      ay: (long ? cy : ay) * halfLen,
      r,
      m: [ax, ay, cx, cy]
    })
  }
  return out
}

function closestApproach(pts: Point[], x0: number, y0: number, x1: number, y1: number) {
  const sx = x1 - x0
  const sy = y1 - y0
  const len2 = sx * sx + sy * sy
  let best = Infinity
  let vx = 0
  let vy = 0
  for (let i = 0; i < pts.length; i++) {
    const p = pts[i]!
    let t = len2 > 0 ? ((p.x - x0) * sx + (p.y - y0) * sy) / len2 : 0
    t = t < 0 ? 0 : t > 1 ? 1 : t
    const ex = x0 + t * sx - p.x
    const ey = y0 + t * sy - p.y
    const d2 = ex * ex + ey * ey
    if (d2 < best) {
      best = d2
      vx = ex
      vy = ey
    }
  }
  const d = Math.sqrt(best)
  return { d, ux: d > 1e-9 ? vx / d : 0, uy: d > 1e-9 ? vy / d : 0 }
}

interface Trial {
  footprints: Footprint[]
  reference: Footprint[]
  contour: Point[]
  calContour: Point[]
}

const FLOAT = Math.hypot(DRIFT_X, DRIFT_Y) * R

function worst(pts: Point[], prints: Footprint[], tx: number, ty: number) {
  let margin = Infinity
  let ux = 0
  let uy = 0
  for (const e of prints) {
    const x = e.x + tx
    const y = e.y + ty
    const a = closestApproach(pts, x - e.ax, y - e.ay, x + e.ax, y + e.ay)
    const [m0, m1, m2, m3] = e.m
    const radius =
      e.r * Math.hypot(m0 * a.ux + m1 * a.uy, m2 * a.ux + m3 * a.uy) + FLOAT
    if (a.d - radius < margin) {
      margin = a.d - radius
      ux = a.ux
      uy = a.uy
    }
  }
  return { margin, ux, uy }
}

const DIRECTIONS = 12
const BISECTION_STEPS = 8

function solve(trials: Trial[]): { x: number; y: number } {
  if (!trials.length) return { x: 0, y: 0 }

  const margin = (tx: number, ty: number) => {
    let m = Infinity
    for (const ep of trials) m = Math.min(m, worst(ep.contour, ep.footprints, tx, ty).margin)
    return m
  }

  let required = Infinity
  for (const ep of trials) {
    required = Math.min(required, worst(ep.calContour, ep.reference, 0, 0).margin)
  }
  let mx = 0
  let my = 0
  const prints = trials[0]!.footprints
  for (const e of prints) {
    mx -= e.x / prints.length
    my -= e.y / prints.length
  }
  const travel = Math.max(0.35 * R, Math.hypot(mx, my) * 1.25)

  required = Math.min(required, margin(mx, my))

  const start = margin(0, 0)
  if (start >= required && start >= 0) return { x: 0, y: 0 }
  const target = Math.max(required, 0)

  let bestX = 0
  let bestY = 0
  let bestNorm = Infinity
  let fallbackX = 0
  let fallbackY = 0
  let fallback = start

  for (let d = 0; d < DIRECTIONS; d++) {
    const a = (d / DIRECTIONS) * Math.PI * 2
    const ux = Math.cos(a)
    const uy = Math.sin(a)
    if (margin(ux * travel, uy * travel) < target) {
      for (const k of [0.3, 0.6, 1]) {
        const m = margin(ux * travel * k, uy * travel * k)
        if (m > fallback) {
          fallback = m
          fallbackX = ux * travel * k
          fallbackY = uy * travel * k
        }
      }
      continue
    }
    let lo = 0
    let hi = travel
    for (let i = 0; i < BISECTION_STEPS; i++) {
      const mid = (lo + hi) / 2
      if (margin(ux * mid, uy * mid) >= target) hi = mid
      else lo = mid
    }
    if (hi < bestNorm) {
      bestNorm = hi
      bestX = ux * hi
      bestY = uy * hi
    }
  }

  const x = bestNorm === Infinity ? fallbackX : bestX
  const y = bestNorm === Infinity ? fallbackY : bestY
  return { x: +(x / R).toFixed(6), y: +(y / R).toFixed(6) }
}

function faceOf(def: StateDef, pose: Pose, expr: BotExpression | null): Face {
  if (def.baseFace && expr) return { gaze: expr.gaze, split: expr.split, eyes: expr.eyes }
  return { gaze: pose.gaze, split: pose.split, eyes: pose.eyes }
}

function sampleTimes(def: StateDef): number[] {
  const signature = (p: Pose) =>
    JSON.stringify([p.gaze, p.split, p.eyes, p.sil.rot, p.sil.cx, p.sil.cy, p.sil.sx, p.sil.sy])
  if (signature(def.pose(0)) === signature(def.pose(def.duration))) return [0]
  const n = 3
  return Array.from({ length: n }, (_, i) => (i / (n - 1)) * def.duration)
}

function offsetFor(
  def: StateDef,
  radii: number[],
  expr: BotExpression | null
): { x: number; y: number } {
  const trials: Trial[] = []
  for (const t of sampleTimes(def)) {
    const pose = def.pose(t)
    const contour = toPoints({ ...pose.sil, radii }, R)
    const calContour = toPoints(pose.sil, R)
    const v = faceOf(def, pose, expr)
    const corners: Face[] = []
    for (const dy of [-DRIFT_YAW, DRIFT_YAW]) {
      for (const dp of [-DRIFT_PITCH, DRIFT_PITCH]) {
        corners.push({
          ...v,
          gaze: { yaw: v.gaze.yaw + dy, pitch: v.gaze.pitch + dp, roll: v.gaze.roll }
        })
      }
    }
    for (const c of corners) {
      trials.push({
        footprints: footprints(c, pose.sil, radii),
        reference: footprints(c, pose.sil, pose.sil.radii),
        contour,
        calContour
      })
    }
  }
  return solve(trials)
}

const ZERO = { x: 0, y: 0 } as const

const key = (state: StateId, expr: string | null) => `${state}|${expr ?? ''}`

function build(): Map<number[], Map<string, { x: number; y: number }>> {
  return new Map(
  SHAPES.map((shape) => {
    const byKey = new Map<string, { x: number; y: number }>()
    for (const def of STATES) {
      if (!def.baseBody) continue
      const expressions = def.baseFace ? [null, ...EXPRESSIONS] : [null]
      for (const expr of expressions) {
        byKey.set(key(def.id, expr?.id ?? null), offsetFor(def, shape.radii, expr))
      }
    }
    return [shape.radii, byKey]
  })
  )
}

const OFFSETS = build()

export function eyeOffset(
  radii: number[] | null,
  state: StateId,
  expr: string | null
): { x: number; y: number } {
  if (!radii) return ZERO
  const byKey = OFFSETS.get(radii)
  if (!byKey) return ZERO
  return byKey.get(key(state, expr)) ?? byKey.get(key(state, null)) ?? ZERO
}
