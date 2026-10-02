import { audio } from "./audio";
import { Camera } from "./camera";
import { resolveCollisions } from "./collision";
import { buildLevel, metersFor, MILESTONE_M, pruneLevel } from "./levels";
import { ParticleSystem } from "./particles";
import { FIXED_DT, PHYSICS } from "./physics";
import { createPlayer, integratePlayer } from "./player";
import {
  drawClouds,
  drawDesertAtmosphere,
  drawDesertBackground,
  drawFinish,
  drawHeightMarkers,
  drawNeonAtmosphere,
  drawNeonBackground,
  drawOpeningBackground,
  drawParticles,
  drawPlatform,
  drawPlayer,
  drawPortalAtmosphere,
  drawPortalBackground,
  drawSky,
  drawSparkles,
  drawSnowAtmosphere,
  drawSnowBackground,
  makeClouds,
  makeSparkles,
  setViewHeight,
  VIEW_H,
  VIEW_W,
} from "./render";
import type {
  Difficulty,
  EngineEvent,
  EngineStatus,
  HudSnapshot,
  InputState,
  Level,
  Platform,
  PlayerState,
  CharacterSkin,
} from "./types";

const DIFF = {
  easy: { time: 10 * 60_000, energy: 500, start: 1000 },
  normal: { time: 10 * 60_000, energy: 500, start: 1000 },
  hard: { time: 10 * 60_000, energy: 500, start: 1000 },
} as const;

export interface AnswerOutcome {
  energyGained: number;
  scoreGained: number;
  streak: number;
  milestone: number | null;
}

export interface EngineConfig {
  canvas: HTMLCanvasElement;
  level: number;
  difficulty: Difficulty;
  playerName: string;
  skin?: CharacterSkin;
  /** Multiplayer: breakable platforms regrow after breaking. */
  multiplayer?: boolean;
  onHud: (h: HudSnapshot) => void;
  onEvent: (e: EngineEvent) => void;
}

export class GameEngine {
  private ctx: CanvasRenderingContext2D;
  private level: Level;
  private player: PlayerState;
  private camera: Camera;
  private particles = new ParticleSystem();
  private clouds: ReturnType<typeof makeClouds>;
  private sparkles: ReturnType<typeof makeSparkles>;
  private input: InputState = { left: false, right: false, jump: false };
  private touch: InputState = { left: false, right: false, jump: false };
  private raf = 0;
  private last = 0;
  private acc = 0;
  private time = 0;
  private hudClock = 0;
  private respawn: { x: number; y: number };
  private warned = false;
  private fallTimer = 0;
  private lastSafe: { x: number; y: number } | null = null;
  private victoryTimer = 0;

  status: EngineStatus = "playing";
  energy = 0;
  energyEarned = 0;
  scoreBase = 0;
  streak = 0;
  bestStreak = 0;
  correct = 0;
  answered = 0;
  maxMeters = 0;
  checkpoint = 0;
  timeLeftMs: number;
  elapsedMs = 0;

  constructor(private cfg: EngineConfig) {
    const ctx = cfg.canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas 2D context unavailable");
    this.ctx = ctx;
    this.level = buildLevel(cfg.level);
    this.player = createPlayer(this.level.spawn.x, this.level.spawn.y);
    this.camera = new Camera(VIEW_H, this.level.worldHeight);
    this.camera.snapTo(this.player.y);
    this.clouds = makeClouds(this.level.worldHeight);
    this.sparkles = makeSparkles(this.level.worldHeight);
    this.respawn = { ...this.level.spawn };
    this.timeLeftMs = DIFF[cfg.difficulty].time;
    this.energy = DIFF[cfg.difficulty].start; // starter energy so the first climb is possible
    this.attachKeys();
  }

  // ---------- public API ----------

  start() {
    this.last = performance.now();
    const loop = (now: number) => {
      this.raf = requestAnimationFrame(loop);
      const dt = Math.min(0.05, (now - this.last) / 1000);
      this.last = now;
      this.update(dt);
      this.render(dt);
    };
    this.raf = requestAnimationFrame(loop);
    this.publish();
  }

  destroy() {
    cancelAnimationFrame(this.raf);
    this.detachKeys();
  }

  setStatus(s: EngineStatus) {
    if (this.status === "victory" || this.status === "gameover") return;
    this.status = s;
    this.publish();
  }

  private ghostTargets = new Map<string, { x: number; y: number; vx: number; vy: number; at: number }>();
  private camXSmooth: number | null = null;
  private ghosts: { uid: string; name: string; look: CharacterSkin["look"]; x: number; y: number; f: number }[] = [];

  /** Other racers in multiplayer (drawn only, no collision). */
  setGhosts(g: { uid: string; name: string; look: CharacterSkin["look"]; x: number; y: number; f: number; vx: number; vy: number; at: number }[]) {
    // Preserve racers by account id and use a short glide only to hide network jitter.
    const prev = new Map(this.ghosts.map((o) => [o.uid, o]));
    this.ghostTargets = new Map(g.map((target) => [target.uid, {
      x: target.x,
      y: target.y,
      vx: target.vx,
      vy: target.vy,
      at: target.at,
    }]));
    this.ghosts = g.map((t) => {
      const o = prev.get(t.uid);
      return o && Math.hypot(o.x - t.x, o.y - t.y) < 400 ? { ...t, x: o.x, y: o.y } : { ...t };
    });
  }

  get position() {
    return { x: this.player.x, y: this.player.y, f: this.player.facing, m: Math.round(this.maxMeters) };
  }

  setTouchInput(next: Partial<InputState>) {
    if (next.jump) this.pendingJump = true;
    this.touch = { ...this.touch, ...next };
  }

  get finishMeters() {
    return Number.isFinite(this.level.finishY)
      ? Math.floor(metersFor(this.level, this.level.finishY))
      : 2110;
  }

  get score() {
    return this.scoreBase + Math.floor(this.maxMeters);
  }

  get snapshot(): HudSnapshot {
    return {
      energy: this.energy,
      score: this.score,
      streak: this.streak,
      bestStreak: this.bestStreak,
      timeLeftMs: this.timeLeftMs,
      meters: Math.floor(metersFor(this.level, this.player.y)),
      maxMeters: Math.floor(this.maxMeters),
      finishMeters: this.finishMeters,
      checkpoint: this.checkpoint,
      totalCheckpoints: this.level.totalCheckpoints,
      correct: this.correct,
      answered: this.answered,
      energyEarned: this.energyEarned,
      level: this.level.index,
      status: this.status,
    };
  }

  recordAnswer(isCorrect: boolean, answerMs: number): AnswerOutcome {
    this.answered++;
    const base = DIFF[this.cfg.difficulty].energy;
    if (!isCorrect) {
      this.streak = 0;
      audio.play("wrong");
      this.publish();
      return { energyGained: 0, scoreGained: 0, streak: 0, milestone: null };
    }
    const fast = answerMs <= 6000;
    let energyGained = base;
    let scoreGained = 100 + (fast ? 50 : 0) + this.streak * 25;
    this.correct++;
    this.streak++;
    this.bestStreak = Math.max(this.bestStreak, this.streak);

    let milestone: number | null = null;
    if (this.streak === 3) milestone = 3;
    if (this.streak === 5) milestone = 5;
    if (this.streak >= 10 && this.streak % 10 === 0) milestone = 10;
    if (milestone === 3) {
      scoreGained += 150;
    } else if (milestone === 5) {
      scoreGained += 300;
    } else if (milestone === 10) {
      scoreGained += 1000;
    }

    this.energy += energyGained;
    this.energyEarned += energyGained;
    this.scoreBase += scoreGained;
    audio.play("correct");
    if (milestone) audio.play("streak");
    this.particles.burst(
      this.player.x + this.player.w / 2,
      this.player.y + 10,
      22,
      ["#ffd447", "#4ade80", "#ffffff"],
      { speed: 220 },
    );
    this.publish();
    return { energyGained, scoreGained, streak: this.streak, milestone };
  }

  restart(level = this.level.index) {
    this.level = buildLevel(level);
    this.player = createPlayer(this.level.spawn.x, this.level.spawn.y);
    this.camera = new Camera(VIEW_H, this.level.worldHeight);
    this.camera.snapTo(this.player.y);
    this.particles.clear();
    this.respawn = { ...this.level.spawn };
    this.energy = DIFF[this.cfg.difficulty].start;
    this.energyEarned = 0;
    this.scoreBase = 0;
    this.streak = 0;
    this.bestStreak = 0;
    this.correct = 0;
    this.answered = 0;
    this.maxMeters = 0;
    this.checkpoint = 0;
    this.elapsedMs = 0;
    this.warned = false;
    this.fallTimer = 0;
    this.lastSafe = null;
    this.victoryTimer = 0;
    this.timeLeftMs = DIFF[this.cfg.difficulty].time;
    this.status = "playing";
    this.publish();
  }

  /** Second chance after the clock runs out: keep score, resume at checkpoint. */
  continueFromCheckpoint(extraMs = 120_000) {
    this.timeLeftMs = extraMs;
    this.warned = false;
    this.status = "playing";
    this.doRespawn();
  }

  // ---------- internals ----------

  private publish() {
    this.cfg.onHud(this.snapshot);
  }

  private keyDown = (e: KeyboardEvent) => {
    const k = e.key.toLowerCase();
    if (["arrowleft", "a"].includes(k)) this.input.left = true;
    else if (["arrowright", "d"].includes(k)) this.input.right = true;
    else if ([" ", "arrowup", "w", "spacebar"].includes(k)) {
      this.input.jump = true;
      this.pendingJump = true;
      e.preventDefault();
    } else return;
    audio.unlock();
  };

  private keyUp = (e: KeyboardEvent) => {
    const k = e.key.toLowerCase();
    if (["arrowleft", "a"].includes(k)) this.input.left = false;
    else if (["arrowright", "d"].includes(k)) this.input.right = false;
    else if ([" ", "arrowup", "w", "spacebar"].includes(k)) this.input.jump = false;
  };

  private attachKeys() {
    window.addEventListener("keydown", this.keyDown);
    window.addEventListener("keyup", this.keyUp);
  }

  private detachKeys() {
    window.removeEventListener("keydown", this.keyDown);
    window.removeEventListener("keyup", this.keyUp);
  }

  private pendingJump = false;

  private combinedInput(): InputState {
    const edge = this.pendingJump;
    this.pendingJump = false;
    return {
      left: this.input.left || this.touch.left,
      right: this.input.right || this.touch.right,
      jump: this.input.jump || this.touch.jump || edge,
    };
  }

  private update(dt: number) {
    this.time += dt;
    this.particles.update(dt);

    const live = this.status === "playing" || this.status === "falling";
    if (!live) return;

    if (this.status === "playing") {
      this.timeLeftMs -= dt * 1000;
      this.elapsedMs += dt * 1000;
      if (this.timeLeftMs <= 30_000 && !this.warned) {
        this.warned = true;
        audio.play("warning");
      }
      if (this.timeLeftMs <= 0) {
        this.timeLeftMs = 0;
        this.status = "gameover";
        this.cfg.onEvent({ type: "timeup" });
        this.publish();
        return;
      }
    }

    if (this.status === "falling") {
      this.fallTimer -= dt;
      this.camera.follow(this.player.y, dt);
      if (this.fallTimer <= 0) this.doRespawn();
      this.tickHud(dt);
      return;
    }

    this.acc += dt;
    let steps = 0;
    while (this.acc >= FIXED_DT && steps < 8) {
      this.step(FIXED_DT);
      this.acc -= FIXED_DT;
      steps++;
    }
    this.camera.follow(this.player.y, dt);
    this.tickHud(dt);
  }

  private tickHud(dt: number) {
    this.hudClock += dt;
    if (this.hudClock > 0.1) {
      this.hudClock = 0;
      this.publish();
    }
  }

  private step(dt: number) {
    // A breakable platform starts its one-shot countdown on first contact and
    // keeps counting even after the player jumps away.
    for (const p of this.level.platforms) {
      if (p.type !== "breakable" || p.breakTimer === undefined || p.gone) continue;
      p.breakTimer += dt;
      p.cracked = Math.min(1, p.breakTimer / 0.3);
      if (p.breakTimer >= 0.3 && !p.gone) {
        p.gone = true;
        if (this.cfg.multiplayer) {
          const bp = p;
          window.setTimeout(() => { bp.gone = false; delete bp.breakTimer; bp.cracked = 0; }, 2500);
        }
        this.particles.burst(p.x + p.w / 2, p.y, 20, ["#625b57", "#a69b8f", "#d8c597"], {
          speed: 170,
        });
      }
    }

    // Moving platforms and neon laser hazards share the same horizontal
    // oscillator. Hazards remain non-solid and are handled below on contact.
    for (const p of this.level.platforms) {
      if ((p.type !== "moving" && p.type !== "hazard") || p.baseX === undefined) continue;
      const prev = p.x;
      p.x =
        p.baseX + Math.sin(this.time * (p.speed ?? 1) + (p.phase ?? 0)) * (p.range ?? 100);
      p.dx = p.x - prev;
    }

    const standingOn = this.platformUnder();
    const onIce = standingOn?.type === "ice";

    integratePlayer(this.player, this.combinedInput(), dt, {
      onIce,
      tryJump: (double) => {
        const cost = double ? PHYSICS.doubleJumpCost : PHYSICS.jumpCost;
        if (this.energy < cost) {
          this.cfg.onEvent({ type: "noEnergy" });
          return false;
        }
        this.energy -= cost;
        if (double) {
          this.particles.burst(
            this.player.x + this.player.w / 2,
            this.player.y + this.player.h / 2,
            14,
            ["#ffffff", "#ffe066", "#a8e6ff"],
            { speed: 170, gravity: 200, size: 3.5 },
          );
          this.cfg.onEvent({ type: "doubleJump" });
        }
        audio.play("jump");
        this.particles.burst(
          this.player.x + this.player.w / 2,
          this.player.y + this.player.h,
          6,
          ["#ffffff", "#d8f3ff"],
          { speed: 90, gravity: 300, size: 3 },
        );
        this.cfg.onEvent({ type: "jump" });
        return true;
      },
    });

    // carry along moving platform
    if (standingOn?.type === "moving" && this.player.onGround) {
      this.player.x += standingOn.dx ?? 0;
    }

    const res = resolveCollisions(this.player, this.level.platforms, dt);

    const laserHit = this.level.platforms.some((p) =>
      p.type === "hazard" &&
      p.visual === "neonLaser" &&
      this.player.x + this.player.w > p.x + 5 &&
      this.player.x < p.x + p.w - 5 &&
      this.player.y + this.player.h > p.y &&
      this.player.y < p.y + p.h
    );
    if (laserHit && this.status === "playing") {
      this.cfg.onEvent({ type: "fell" });
      this.lastSafe = null; // lasers send you back to the checkpoint
      this.doRespawn();
      return;
    }

    if (res.bounced) {
      this.player.vy = PHYSICS.bounceVelocity;
      this.player.squash = -0.4;
      audio.play("jump");
      this.cfg.onEvent({ type: "bounce" });
      this.particles.burst(
        this.player.x + this.player.w / 2,
        this.player.y + this.player.h,
        14,
        ["#ffd447", "#f7a52b"],
        { speed: 180 },
      );
    }

    if (res.landedOn) {
      const p = res.landedOn;
      if (this.player.landTimer > 0.15) {
        audio.play("land");
        this.cfg.onEvent({ type: "land" });
        this.particles.burst(
          this.player.x + this.player.w / 2,
          this.player.y + this.player.h,
          8,
          ["#ffffff", "#cfe6f5"],
          { speed: 110, gravity: 420, size: 3 },
        );
      }
      if (p.type === "breakable") {
        if (p.breakTimer === undefined) p.breakTimer = 0;
      } else if (p.type !== "moving" && p.type !== "hazard") {
        // respawn right where the player last stood safely
        const cx = Math.min(Math.max(this.player.x, p.x + 4), p.x + p.w - this.player.w - 4);
        this.lastSafe = { x: cx, y: p.y - this.player.h - 2 };
      }
      if (p.type === "checkpoint" && (p.cpIndex ?? 0) > this.checkpoint) {
        this.checkpoint = p.cpIndex!;
        this.respawn = { x: p.x + p.w / 2 - 17, y: p.y - 40 };
        this.scoreBase += 250;
        this.energy += 500;
        this.energyEarned += 500;
        audio.play("checkpoint");
        this.particles.burst(p.x + p.w / 2, p.y - 20, 30, ["#3ed37b", "#b9f6cd", "#ffffff"], {
          speed: 230,
        });
        this.cfg.onEvent({ type: "checkpoint", index: p.cpIndex! });
        this.publish();
      }
      if (p.type === "finish" && this.status === "playing") {
        this.checkpoint = p.cpIndex ?? 10;
        this.respawn = { x: p.x + p.w / 2 - 17, y: p.y - 40 };
        this.status = "victory";
        this.player.anim = "win";
        this.victoryTimer = 0;
        audio.play("finish");
        this.particles.confetti(p.x + p.w / 2, p.y, p.w + 200);
        this.cfg.onEvent({ type: "victory" });
        this.publish();
      }
    }

    // clamp inside world horizontally
    if (this.player.x < 0) {
      this.player.x = 0;
      this.player.vx = 0;
    }
    if (this.player.x + this.player.w > this.level.worldWidth) {
      this.player.x = this.level.worldWidth - this.player.w;
      this.player.vx = 0;
    }

    const meters = metersFor(this.level, this.player.y);
    if (meters > this.maxMeters) {
      const prevMs = Math.floor(this.maxMeters / MILESTONE_M);
      this.maxMeters = meters;
      const nowMs = Math.floor(meters / MILESTONE_M);
      if (nowMs > prevMs) {
        this.scoreBase += 500;
        audio.play("checkpoint");
        this.cfg.onEvent({ type: "milestone", meters: nowMs * MILESTONE_M });
      }
    }

    // Generate only until the final checkpoint, then retain nearby platforms.
    this.level.extend(this.player.y - 1800);
    pruneLevel(this.level, Math.max(this.player.y, this.respawn.y) + 1400);

    // falling detection
    const safeY = this.lastSafe ? this.lastSafe.y : this.respawn.y;
    if (this.player.y > safeY + 420 && this.status === "playing") {
      // Falling never costs energy or time: resume from the last safe spot.
      this.cfg.onEvent({ type: "fell" });
      this.doRespawn();
    }
  }

  private platformUnder(): Platform | null {
    const feet = this.player.y + this.player.h;
    for (const p of this.level.platforms) {
      if (p.gone) continue;
      if (
        feet >= p.y - 3 &&
        feet <= p.y + 8 &&
        this.player.x + this.player.w > p.x + 2 &&
        this.player.x < p.x + p.w - 2
      ) {
        return p;
      }
    }
    return null;
  }

  private doRespawn() {
    const at = this.lastSafe ?? this.respawn;
    this.player.x = at.x;
    this.player.y = at.y;
    this.player.vx = 0;
    this.player.vy = 0;
    this.player.anim = "idle";
    this.camera.snapTo(this.player.y);
    this.particles.burst(
      this.player.x + this.player.w / 2,
      this.player.y + this.player.h,
      18,
      ["#ffffff", "#a8e6ff"],
      { speed: 160 },
    );
    this.status = "playing";
    this.cfg.onEvent({ type: "respawn" });
    this.publish();
  }

  private render(dt: number) {
    const ctx = this.ctx;
    const canvas = this.cfg.canvas;
    const cssW = canvas.clientWidth || VIEW_W;
    const cssH = canvas.clientHeight || VIEW_H;
    // A phone's 3x screen otherwise makes the canvas render millions of pixels
    // every frame. Native CSS size remains unchanged; only internal resolution
    // is capped for stable touch gameplay.
    const compact = cssW < 600 || window.matchMedia("(pointer: coarse)").matches;
    // Phones keep sharp (2x) art; culling + skipped atmosphere keep it fast.
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    if (canvas.width !== Math.round(cssW * dpr) || canvas.height !== Math.round(cssH * dpr)) {
      canvas.width = Math.round(cssW * dpr);
      canvas.height = Math.round(cssH * dpr);
    }
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";

    // Fit width, reveal extra world vertically (no letterbox bars).
    // Phones: show at least ~700 world units across so platforms stay on screen.
    const scale = Math.max(cssW / VIEW_W, Math.min(cssH / (VIEW_H * 1.55), cssW / 700));
    const viewWorldW = cssW / scale;
    const viewWorldH = cssH / scale;
    setViewHeight(viewWorldH);

    const playerCenter = this.player.x + this.player.w / 2;
    const targetX =
      viewWorldW >= VIEW_W
        ? -(viewWorldW - VIEW_W) / 2
        : Math.max(0, Math.min(VIEW_W - viewWorldW, playerCenter - viewWorldW / 2));
    this.camXSmooth = this.camXSmooth === null ? targetX : this.camXSmooth + (targetX - this.camXSmooth) * 0.15;
    const camX = this.camXSmooth;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = "#8ed8fb";
    ctx.fillRect(0, 0, cssW, cssH);
    ctx.save();
    ctx.scale(scale, scale);
    ctx.translate(-camX, 0);

    const camY = this.camera.y - (viewWorldH - VIEW_H) / 2;
    drawSky(ctx, camY, this.level.worldHeight, {
      x: camX - 4,
      y: -4,
      w: viewWorldW + 8,
      h: viewWorldH + 8,
    });
    drawOpeningBackground(ctx, metersFor(this.level, this.player.y), {
      x: camX - 4,
      y: -4,
      w: viewWorldW + 8,
      h: viewWorldH + 8,
    });
    const currentMeters = metersFor(this.level, this.player.y);
    drawDesertBackground(ctx, currentMeters, {
      x: camX - 4,
      y: -4,
      w: viewWorldW + 8,
      h: viewWorldH + 8,
    });
    drawSnowBackground(ctx, currentMeters, {
      x: camX - 4,
      y: -4,
      w: viewWorldW + 8,
      h: viewWorldH + 8,
    });
    drawNeonBackground(ctx, currentMeters, {
      x: camX - 4,
      y: -4,
      w: viewWorldW + 8,
      h: viewWorldH + 8,
    });
    drawPortalBackground(ctx, currentMeters, {
      x: camX - 4,
      y: -4,
      w: viewWorldW + 8,
      h: viewWorldH + 8,
    });
    if (!compact && (currentMeters < 540 || currentMeters >= 2070)) {
      drawClouds(ctx, this.clouds, camY, this.time);
      drawSparkles(ctx, this.sparkles, camY, this.time);
    } else if (!compact && currentMeters < 1000) {
      drawDesertAtmosphere(ctx, currentMeters, this.time, {
        x: camX - 4,
        y: -4,
        w: viewWorldW + 8,
        h: viewWorldH + 8,
      });
    } else if (!compact && currentMeters < 1436) {
      drawSnowAtmosphere(ctx, currentMeters, this.time, {
        x: camX - 4,
        y: -4,
        w: viewWorldW + 8,
        h: viewWorldH + 8,
      });
    } else if (!compact && currentMeters < 1630) {
      drawNeonAtmosphere(ctx, currentMeters, this.time, {
        x: camX - 4,
        y: -4,
        w: viewWorldW + 8,
        h: viewWorldH + 8,
      });
    } else if (!compact) {
      drawPortalAtmosphere(ctx, currentMeters, this.time, {
        x: camX - 4,
        y: -4,
        w: viewWorldW + 8,
        h: viewWorldH + 8,
      });
    }
    drawHeightMarkers(ctx, this.level, camY);

    // Only paint platforms inside the current camera window. Collision data is
    // untouched, but phones no longer draw the entire vertical course.
    const viewTop = camY - 180;
    const viewBottom = camY + viewWorldH + 220;
    for (const p of this.level.platforms) {
      if (p.y + Math.max(p.h, 160) < viewTop || p.y > viewBottom) continue;
      if (p.x + p.w < camX - 180 || p.x > camX + viewWorldW + 180) continue;
      if (p.type === "finish") drawFinish(ctx, p, camY, this.time);
      drawPlatform(ctx, p, camY, this.time);
    }

    this.ghosts.forEach((g) => {
      const target = this.ghostTargets.get(g.uid);
      if (target) {
        // Predict just beyond the latest packet, then converge by elapsed time.
        // This removes visible phone-to-PC trailing without amplifying jitter.
        const age = Math.min(0.12, Math.max(0, (Date.now() - target.at) / 1000));
        const predictedX = target.x + target.vx * age;
        const predictedY = target.y + target.vy * age;
        const blend = 1 - Math.exp(-dt / 0.028);
        g.x += (predictedX - g.x) * blend;
        g.y += (predictedY - g.y) * blend;
      }
    });
    for (const g of this.ghosts) {
      if (g.y + this.player.h < viewTop || g.y > viewBottom) continue;
      const ghost = { ...this.player, x: g.x, y: g.y, facing: g.f, squash: 0, anim: "idle", t: this.time } as PlayerState;
      drawPlayer(ctx, ghost, camY, g.name, { look: g.look });
    }
    drawPlayer(ctx, this.player, camY, this.cfg.playerName, this.cfg.skin);
    drawParticles(ctx, this.particles, camY);

    if (this.status === "victory") {
      this.victoryTimer += 1 / 60;
      if (this.victoryTimer % 1 < 0.02) {
        this.particles.confetti(VIEW_W / 2, camY + 60, VIEW_W);
      }
    }
    ctx.restore();
  }
}
