import { PROFILE_SAMPLES } from './profiles'

type ShapeId = 'circle'

interface BotShape {
  id: ShapeId
  radii: number[]
}

export const SHAPES: BotShape[] = [
  { id: 'circle', radii: new Array(PROFILE_SAMPLES).fill(1) }
]

export const SHAPE_BY_ID = new Map<string, BotShape>(SHAPES.map((s) => [s.id, s]))
export const DEFAULT_SHAPE = 'circle'
