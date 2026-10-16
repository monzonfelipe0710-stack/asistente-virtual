/**
 * The frame of reference for everything the engine renders.
 *
 * `engine.sample()` outputs coordinates in viewBox units, and these two numbers are
 * their definition: without them, an engine output means nothing.
 */

/**
 * Radius of the ball at rest, in viewBox units. It is the `scale` the component
 * passes to `BotEngine`.
 *
 * Chosen, not measured: it is the working unit. Everything else in the folder is
 * expressed in fractions of this radius, which makes the measurements taken from the
 * video independent of the display size.
 */
export const RADIUS = 100
