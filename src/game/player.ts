import { clamp, PHYSICS } from "./physics";
import type { InputState, PlayerState } from "./types";

export function createPlayer(x: number, y: number): PlayerState {
  return {
    x,
    y,
    w: 34,
    h: 34,
    vx: 0,
    vy: 0,
    onGround: true,
    coyote: 0,
    jumpBuffer: 0,
    facing: 1,
    squash: 0,
    anim: "idle",
    t: 0,
    landTimer: 0,
    blink: 2 + Math.random() * 3,
    jumpHeld: false,
    airJumps: 1,
  };
}

/** Applies input + gravity. Collision is resolved separately. */
export function integratePlayer(
  p: PlayerState,
  input: InputState,
  dt: number,
  opts: { onIce: boolean; tryJump: (double: boolean) => boolean },
): void {
  p.t += dt;
  p.blink -= dt;
  if (p.blink < -0.12) p.blink = 2.4 + Math.random() * 3.2;
  if (p.landTimer > 0) p.landTimer -= dt;

  const dir = (input.right ? 1 : 0) - (input.left ? 1 : 0);
  const accel = p.onGround
    ? opts.onIce
      ? PHYSICS.iceAccel
      : PHYSICS.moveAccel
    : PHYSICS.airAccel;

  if (dir !== 0) {
    p.vx += dir * accel * dt;
    p.facing = dir > 0 ? 1 : -1;
  } else if (p.onGround) {
    const fric = (opts.onIce ? PHYSICS.iceFriction : PHYSICS.groundFriction) * dt;
    if (Math.abs(p.vx) <= fric) p.vx = 0;
    else p.vx -= Math.sign(p.vx) * fric;
  } else {
    p.vx -= Math.sign(p.vx) * 320 * dt;
  }
  p.vx = clamp(p.vx, -PHYSICS.maxSpeed, PHYSICS.maxSpeed);

  // jump buffering + coyote time (buffer only on a fresh press)
  const pressed = input.jump && !p.jumpHeld;
  p.jumpHeld = input.jump;
  p.jumpBuffer -= dt;
  if (pressed) p.jumpBuffer = PHYSICS.jumpBufferTime;
  if (p.onGround) {
    p.coyote = PHYSICS.coyoteTime;
    p.airJumps = 1;
  } else p.coyote -= dt;

  if (p.jumpBuffer > 0 && p.coyote > 0) {
    if (opts.tryJump(false)) {
      p.vy = PHYSICS.jumpVelocity;
      p.onGround = false;
      p.jumpBuffer = 0;
      p.coyote = 0;
      p.squash = -0.35;
      p.anim = "jump";
    } else {
      p.jumpBuffer = 0;
    }
  } else if (pressed && !p.onGround && p.coyote <= 0 && p.airJumps > 0) {
    // double jump
    p.jumpBuffer = 0;
    if (opts.tryJump(true)) {
      p.airJumps--;
      p.vy = PHYSICS.doubleJumpVelocity;
      p.squash = -0.45;
      p.anim = "jump";
    }
  }

  const g = p.vy > 0 ? PHYSICS.fallGravity : PHYSICS.gravity;
  p.vy = Math.min(p.vy + g * dt, PHYSICS.maxFallSpeed);

  // squash/stretch easing
  p.squash += (0 - p.squash) * Math.min(1, dt * 9);
  if (p.landTimer > 0) p.squash = 0.3 * (p.landTimer / 0.18);

  if (p.anim !== "win") {
    if (p.onGround) p.anim = p.landTimer > 0 ? "land" : "idle";
    else p.anim = p.vy < 0 ? "jump" : "fall";
  }
}
