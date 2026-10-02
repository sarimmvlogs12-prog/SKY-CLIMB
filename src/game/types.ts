export type PlatformType =
  | "normal"
  | "moving"
  | "small"
  | "bounce"
  | "ice"
  | "breakable"
  | "checkpoint"
  | "hazard"
  | "finish"
  | "ground";

export interface Platform {
  x: number;
  y: number;
  w: number;
  h: number;
  type: PlatformType;
  /** moving platforms */
  baseX?: number;
  range?: number;
  speed?: number;
  phase?: number;
  dx?: number;
  /** breakable */
  cracked?: number;
  breakTimer?: number;
  gone?: boolean;
  /** checkpoint ordering */
  cpIndex?: number;
  flagWave?: number;
  /** Visual/difficulty band: 0 easy, 1 rising, 2 challenging, 3 expert. */
  tier?: 0 | 1 | 2 | 3;
  /** Scenery skin; collision always remains the safe platform rectangle. */
  visual?:
    | "stone"
    | "openingStone"
    | "mainGround"
    | "crate"
    | "openingCrate"
    | "desertPlatform"
    | "desertSmall"
    | "desertBoxes"
    | "desertCheckpoint"
    | "snowPlatform"
    | "snowBlockSingle"
    | "snowBlocks"
    | "snowTower"
    | "snowCheckpoint"
    | "snowBreakable"
    | "neonPlatform"
    | "neonShort"
    | "neonShortTall"
    | "neonCheckpoint"
    | "neonLaser"
     | "portalPlatform"
     | "portalCheckpoint"
     | "portalIsland"
     | "portalMonument"
     | "portalFinishProp"
     | "portalDeck"
     | "portalGateway"
     | "portalFinal"
     | "portalFinishLower"
     | "portalFinishUpper"
    | "barrel"
    | "market";
}

export interface Level {
  index: number;
  worldWidth: number;
  worldHeight: number;
  groundY: number;
  platforms: Platform[];
  spawn: { x: number; y: number };
  finishY: number;
  totalCheckpoints: number;
  /** generate more platforms up to world y = minY */
  extend: (minY: number) => void;
}

export interface PlayerState {
  x: number;
  y: number;
  w: number;
  h: number;
  vx: number;
  vy: number;
  onGround: boolean;
  coyote: number;
  jumpBuffer: number;
  facing: 1 | -1;
  squash: number;
  anim: "idle" | "jump" | "fall" | "land" | "win";
  t: number;
  landTimer: number;
  blink: number;
  jumpHeld: boolean;
  airJumps: number;
}

export interface InputState {
  left: boolean;
  right: boolean;
  jump: boolean;
}

export type Difficulty = "easy" | "normal" | "hard";

export interface HudSnapshot {
  energy: number;
  score: number;
  streak: number;
  bestStreak: number;
  timeLeftMs: number;
  meters: number;
  maxMeters: number;
  finishMeters: number;
  checkpoint: number;
  totalCheckpoints: number;
  correct: number;
  answered: number;
  energyEarned: number;
  level: number;
  status: EngineStatus;
}

export type EngineStatus =
  | "playing"
  | "paused"
  | "question"
  | "falling"
  | "victory"
  | "gameover";

export type EngineEvent =
  | { type: "fell" }
  | { type: "respawn" }
  | { type: "checkpoint"; index: number }
  | { type: "victory" }
  | { type: "timeup" }
  | { type: "jump" }
  | { type: "doubleJump" }
  | { type: "milestone"; meters: number }
  | { type: "land" }
  | { type: "bounce" }
  | { type: "noEnergy" };

export type CharacterLook = "normal" | "medieval" | "fire" | "desert";

export interface CharacterSkin {
  look: CharacterLook;
}
