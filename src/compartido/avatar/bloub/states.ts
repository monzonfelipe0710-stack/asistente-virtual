import { DOT_PEAK, DOT_R, DOT_X, type DotRender } from './decor'
import { EYE_H, EYE_SPLIT, EYE_W, REST_GAZE, type HeadGaze } from './face'
import { TAU, clamp, easings } from './math'
import { circle, hullOfCircles, profileFromPolygon, type Silhouette } from './shape'

export interface EyeCfg {
  w: number
  h: number
  open: number
  tilt?: number
}

export interface Pose {
  sil: Silhouette
  offX: number
  offY: number
  gaze: HeadGaze
  split: number
  eyes: [EyeCfg, EyeCfg]
  eyeAlpha: number
  bodyAlpha: number
  dots: DotRender[]
}

const pair = (w: number, h: number): [EyeCfg, EyeCfg] => [
  { w, h, open: 1 },
  { w, h, open: 1 }
]

function base(over: Partial<Pose> = {}): Pose {
  return {
    sil: circle(1),
    offX: 0,
    offY: 0,
    gaze: { ...REST_GAZE },
    split: EYE_SPLIT,
    eyes: pair(EYE_W, EYE_H),
    eyeAlpha: 1,
    bodyAlpha: 1,
    dots: [],
    ...over
  }
}

const BAR_UPRIGHT_CY = -0.1875
const BAR_UPRIGHT = profileFromPolygon(
  hullOfCircles(0, -0.505, 0.132, 0, 0.13, 0.075),
  0,
  BAR_UPRIGHT_CY
)

const barUpright = (pose: Partial<Silhouette> = {}): Silhouette => ({
  radii: [...BAR_UPRIGHT],
  rot: 0,
  cx: 0,
  cy: BAR_UPRIGHT_CY,
  sx: 1,
  sy: 1,
  ...pose
})

export type StateId = 'idle' | 'thinking' | 'wink' | 'wide' | 'exclaim'

export interface StateDef {
  id: StateId
  duration: number
  morph: number
  blinkIn: boolean
  baseBody: boolean
  baseFace: boolean
  pose(local: number): Pose
}

function dotPulse(t: number, index: number): number {
  const p = ((((t - index * 0.5) / 1.5) % 1) + 1) % 1
  const k = p < 0.5 ? 0.5 - 0.5 * Math.cos(p * TAU) : 0
  return clamp(k * 2)
}

export const STATES: StateDef[] = [
  {
    id: 'idle',
    duration: 2.4,
    morph: 0.45,
    blinkIn: false,
    baseFace: true,
    baseBody: true,
    pose: () => base()
  },

  {
    id: 'thinking',
    duration: 2.6,
    morph: 0.4,
    baseFace: false,
    baseBody: false,
    blinkIn: true,
    pose: (t) => {
      const mid = dotPulse(t, 1)
      const emerge = 0.3 + 0.7 * easings.easeOutCubic(clamp(t / 0.3))
      return base({
        sil: circle(DOT_R * (1 + (DOT_PEAK - 1) * mid), { cx: DOT_X[1]! }),
        eyeAlpha: 0,
        dots: [0, 2].map((i) => {
          const k = dotPulse(t, i)
          return {
            x: DOT_X[i]! * emerge,
            y: 0,
            r: DOT_R * (1 + (DOT_PEAK - 1) * k),
            opacity: 0.55 + 0.45 * k
          }
        })
      })
    }
  },

  {
    id: 'wink',
    duration: 1.6,
    morph: 0.3,
    blinkIn: true,
    baseFace: false,
    baseBody: true,
    pose: () =>
      base({
        gaze: { yaw: -5.37, pitch: 4.55, roll: 6.7 },
        split: 16.25,
        eyes: [
          { w: 0.236, h: 0.464, open: 1 },
          { w: 0.447, h: 0.089, open: 1 }
        ]
      })
  },

  {
    id: 'wide',
    duration: 1.8,
    morph: 0.55,
    blinkIn: true,
    baseFace: false,
    baseBody: true,
    pose: () =>
      base({
        gaze: { yaw: 6.92, pitch: -21.96, roll: 11.6 },
        split: 18.43,
        eyes: pair(0.356, 0.875)
      })
  },

  {
    id: 'exclaim',
    duration: 2,
    morph: 0.45,
    baseFace: false,
    baseBody: false,
    blinkIn: false,
    pose: () =>
      base({
        sil: barUpright(),
        eyeAlpha: 0,
        dots: [{ x: -0.012, y: 0.526, r: 0.113, opacity: 1 }]
      })
  }
]

export const STATE_BY_ID = new Map(STATES.map((s) => [s.id, s]))

export const POSES: Record<StateId, number> = {
  idle: 1,
  thinking: 1.1,
  wink: 0.8,
  wide: 0.8,
  exclaim: 0.8
}
