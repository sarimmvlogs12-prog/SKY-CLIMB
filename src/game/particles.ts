export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
  gravity: number;
  spin: number;
  rot: number;
  shape: "circle" | "rect";
}

export class ParticleSystem {
  parts: Particle[] = [];

  private push(p: Particle) {
    if (this.parts.length > 600) this.parts.shift();
    this.parts.push(p);
  }

  burst(
    x: number,
    y: number,
    count: number,
    colors: string[],
    opts: { speed?: number; gravity?: number; size?: number; shape?: "circle" | "rect" } = {},
  ) {
    const speed = opts.speed ?? 180;
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2;
      const s = speed * (0.35 + Math.random() * 0.8);
      this.push({
        x,
        y,
        vx: Math.cos(a) * s,
        vy: Math.sin(a) * s - 40,
        life: 0.5 + Math.random() * 0.6,
        maxLife: 1.1,
        size: opts.size ?? 3 + Math.random() * 4,
        color: colors[(Math.random() * colors.length) | 0]!,
        gravity: opts.gravity ?? 620,
        spin: (Math.random() - 0.5) * 12,
        rot: Math.random() * Math.PI,
        shape: opts.shape ?? "circle",
      });
    }
  }

  confetti(x: number, y: number, width: number) {
    const colors = ["#ff5f8f", "#ffd447", "#4ade80", "#38bdf8", "#c084fc"];
    for (let i = 0; i < 70; i++) {
      this.push({
        x: x + (Math.random() - 0.5) * width,
        y: y - Math.random() * 200,
        vx: (Math.random() - 0.5) * 140,
        vy: 60 + Math.random() * 180,
        life: 1.6 + Math.random(),
        maxLife: 2.6,
        size: 5 + Math.random() * 6,
        color: colors[(Math.random() * colors.length) | 0]!,
        gravity: 90,
        spin: (Math.random() - 0.5) * 16,
        rot: Math.random() * Math.PI,
        shape: "rect",
      });
    }
  }

  update(dt: number) {
    for (let i = this.parts.length - 1; i >= 0; i--) {
      const p = this.parts[i]!;
      p.life -= dt;
      if (p.life <= 0) {
        this.parts.splice(i, 1);
        continue;
      }
      p.vy += p.gravity * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.rot += p.spin * dt;
    }
  }

  clear() {
    this.parts.length = 0;
  }
}
