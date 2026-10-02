import { lerp } from "./physics";

export class Camera {
  y = 0;
  constructor(
    private viewH: number,
    private worldH: number,
  ) {}

  snapTo(targetY: number) {
    this.y = this.clampY(targetY - this.viewH * 0.58);
  }

  follow(targetY: number, dt: number) {
    const desired = this.clampY(targetY - this.viewH * 0.58);
    this.y = lerp(this.y, desired, Math.min(1, dt * 7));
  }

  private clampY(y: number) {
    // endless upward: only clamp at the bottom of the world
    return Math.min(y, Math.max(0, this.worldH - this.viewH));
  }
}
