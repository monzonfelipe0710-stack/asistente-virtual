import { PROFILE_SAMPLES } from './profiles'
import {
  hullOfCircles,
  profileFromPolygon,
  regularPolygonProfile,
  superellipseProfile,
  unionOfCirclesProfile
} from './shape'

/**
 * Shapes offered by the bot customizer.
 *
 * Unlike the animation silhouettes (`profiles.ts`), these are NOT measured on
 * the video: they are built analytically from the grid of the original
 * customizer. Two distinct sources, then, and that is deliberate — the animated
 * states must stay faithful to the video, the base shapes are a user choice.
 */

type ShapeId =
  | 'circle'
  | 'pebble'
  | 'squircle'
  | 'capsule'
  | 'triangle'
  | 'hexagon'
  | 'cloud'
  | 'droplet'

interface BotShape {
  id: ShapeId
  radii: number[]
}

/** Brings the maximum radius down to `max` so all shapes weigh the same to the eye. */
function normalize(radii: number[], max = 1): number[] {
  const peak = Math.max(...radii)
  if (peak <= 0) return radii
  const k = max / peak
  return radii.map((r) => r * k)
}

const ANGLES = Array.from({ length: PROFILE_SAMPLES }, (_, i) => (i / PROFILE_SAMPLES) * Math.PI * 2)

/** Pebble: circle deformed by two low harmonics, so irregular but smooth. */
const pebble = normalize(
  ANGLES.map((a) => 1 + 0.075 * Math.cos(2 * a + 0.5) + 0.035 * Math.cos(3 * a + 2.1)),
  1.02
)

/** Cloud: union of bumps, wide at the bottom, two lobes on top. */
const cloud = normalize(
  unionOfCirclesProfile([
    { x: -0.44, y: 0.2, r: 0.54 },
    { x: 0.46, y: 0.2, r: 0.5 },
    { x: 0.02, y: 0.3, r: 0.6 },
    { x: -0.24, y: -0.3, r: 0.48 },
    { x: 0.3, y: -0.24, r: 0.44 }
  ]),
  1.02
)

/** Droplet: big disc at the bottom, tapered tip on top. */
const droplet = normalize(
  profileFromPolygon(hullOfCircles(0, 0.28, 0.66, 0, -0.96, 0.05), 0, 0),
  1.04
)

/** Lying capsule: hull of two discs side by side. */
const capsule = profileFromPolygon(hullOfCircles(-0.42, 0, 0.62, 0.42, 0, 0.62), 0, 0)

export const SHAPES: BotShape[] = [
  { id: 'circle', radii: new Array(PROFILE_SAMPLES).fill(1) },
  { id: 'pebble', radii: pebble },
  // 1.15 and not 1.02: on a superellipse the maximum radius is the diagonal,
  // so normalizing on it gives a shape that looks smaller than the circle.
  { id: 'squircle', radii: normalize(superellipseProfile(4.2), 1.15) },
  { id: 'capsule', radii: capsule },
  // -90deg: one vertex towards the top of the screen (y points down)
  { id: 'triangle', radii: regularPolygonProfile(3, 1.12, 0.34, -90) },
  // 0deg: vertices on the left and right, so the top and bottom edges are flat
  { id: 'hexagon', radii: regularPolygonProfile(6, 1.04, 0.26, 0) },
  { id: 'cloud', radii: cloud },
  { id: 'droplet', radii: droplet }
]

export const SHAPE_BY_ID = new Map<string, BotShape>(SHAPES.map((s) => [s.id, s]))
export const DEFAULT_SHAPE = 'circle'
