/** Tuned platformer constants — responsive, not slippery. */
export const PHYSICS = {
  gravity: 2100,
  fallGravity: 2600,
  moveAccel: 3000,
  airAccel: 2200,
  maxSpeed: 275,
  groundFriction: 2600,
  iceFriction: 260,
  iceAccel: 1400,
  jumpVelocity: -660,
  bounceVelocity: -1020,
  maxFallSpeed: 1150,
  coyoteTime: 0.1,
  jumpBufferTime: 0.12,
  /** cost in energy per jump */
  jumpCost: 100,
  /** mid-air second jump */
  doubleJumpVelocity: -600,
  doubleJumpCost: 200,
};

export const FIXED_DT = 1 / 120;

export function aabb(
  ax: number,
  ay: number,
  aw: number,
  ah: number,
  bx: number,
  by: number,
  bw: number,
  bh: number,
): boolean {
  return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
}

export function clamp(v: number, min: number, max: number): number {
  return v < min ? min : v > max ? max : v;
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}
