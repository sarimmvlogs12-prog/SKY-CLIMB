import type { ParticleSystem } from "./particles";
import type { CharacterSkin, Level, Platform, PlayerState } from "./types";
import { characterChoice, DEFAULT_SKIN } from "./skins";
import stoneAsset from "@/assets/sky-climb-stone.png.asset.json";
import openingBackgroundAsset from "@/assets/sky-climb-opening-background.png.asset.json";
import barrelAsset from "../assets/sky-climb-barrel.png.asset.json";
import checkpointAsset from "../assets/sky-climb-checkpoint.png.asset.json";
import openingStoneAsset from "../assets/sky-climb-early-platform.png.asset.json";
import mainGroundAsset from "../assets/sky-climb-main-platform-hq.png.asset.json";
import openingCrateAsset from "../assets/sky-climb-opening-crate.png.asset.json";
import breakablePlatformAsset from "../assets/sky-climb-breakable-platform.png.asset.json";
import desertBackgroundAsset from "../assets/sky-climb-desert-background.png.asset.json";
import desertCheckpointAsset from "../assets/sky-climb-desert-checkpoint.png.asset.json";
import desertPlatformAsset from "../assets/sky-climb-desert-platform.png.asset.json";
import desertSmallAsset from "../assets/sky-climb-desert-small-platform.png.asset.json";
import desertBoxesAsset from "../assets/sky-climb-desert-boxes.png.asset.json";
import snowBackgroundAsset from "../assets/sky-climb-snow-background.png.asset.json";
import snowPlatformAsset from "../assets/sky-climb-snow-platform.png.asset.json";
import snowBlocksAsset from "../assets/sky-climb-snow-blocks.png.asset.json";
import snowTowerAsset from "../assets/sky-climb-snow-tower.png.asset.json";
import snowCheckpointAsset from "../assets/sky-climb-snow-checkpoint.png.asset.json";
import snowBreakableAsset from "../assets/sky-climb-snow-breakable.png.asset.json";
import neonBackgroundAsset from "../assets/sky-climb-neon-background.png.asset.json";
import neonCheckpointAsset from "../assets/sky-climb-neon-checkpoint.png.asset.json";
import neonShortAsset from "../assets/sky-climb-neon-short.png.asset.json";
import neonPlatformAsset from "../assets/sky-climb-neon-platform.png.asset.json";
import neonLaserAsset from "../assets/sky-climb-neon-laser.png.asset.json";
import neonShortTallAsset from "../assets/sky-climb-neon-short-tall.png.asset.json";
import portalBackgroundAsset from "../assets/sky-climb-portal-background-bright.webp.asset.json";
import portalCheckpointAsset from "../assets/sky-climb-portal-checkpoint.png.asset.json";
import portalMonumentAsset from "../assets/sky-climb-portal-monument.png.asset.json";
import portalFinishPropAsset from "../assets/sky-climb-finish-prop.png.asset.json";
import portalDeckAsset from "../assets/sky-climb-portal-deck.png.asset.json";
import portalGatewayAsset from "../assets/sky-climb-portal-gateway.png.asset.json";
import portalFinalAsset from "../assets/sky-climb-final-checkpoint.png.asset.json";
import portalIslandOriginalAsset from "../assets/sky-climb-portal-island-original.png.asset.json";
import finishLowerAsset from "../assets/sky-climb-finish-lower-platform.png.asset.json";
import finishUpperAsset from "../assets/sky-climb-finish-upper-platform.png.asset.json";

export const VIEW_W = 960;
export const VIEW_H = 540;

/** Actual visible world height in the current viewport (set each frame). */
let CUR_H = VIEW_H;
export function setViewHeight(h: number) {
  CUR_H = h;
}

interface Cloud {
  x: number;
  y: number;
  s: number;
  speed: number;
  depth: number;
}

export function makeClouds(worldHeight: number): Cloud[] {
  const clouds: Cloud[] = [];
  for (let i = 0; i < 46; i++) {
    clouds.push({
      x: Math.random() * (VIEW_W + 800) - 400,
      y: Math.random() * worldHeight,
      s: 0.5 + Math.random() * 1.2,
      speed: 6 + Math.random() * 16,
      depth: 0.5 + Math.random() * 0.4,
    });
  }
  return clouds;
}

interface Sparkle {
  x: number;
  y: number;
  t: number;
  s: number;
}

export function makeSparkles(worldHeight: number): Sparkle[] {
  const out: Sparkle[] = [];
  for (let i = 0; i < 90; i++) {
    out.push({
      x: Math.random() * VIEW_W,
      y: Math.random() * worldHeight,
      t: Math.random() * Math.PI * 2,
      s: 1 + Math.random() * 2,
    });
  }
  return out;
}

const OUTLINE = "#20304a";

let barrelImage: HTMLImageElement | null = null;
let barrelImageRequested = false;
let stoneImage: HTMLImageElement | null = null;
let stoneImageRequested = false;
let openingStoneImage: HTMLImageElement | null = null;
let openingStoneImageRequested = false;
let mainGroundImage: HTMLImageElement | null = null;
let mainGroundImageRequested = false;
let openingCrateImage: HTMLImageElement | null = null;
let openingCrateImageRequested = false;
let breakablePlatformImage: HTMLImageElement | null = null;
let breakablePlatformImageRequested = false;
const desertImages: Record<string, HTMLImageElement | null> = {
  background: null,
  checkpoint: null,
  platform: null,
  small: null,
  boxes: null,
};
const desertRequested = new Set<string>();
const snowImages: Record<string, HTMLImageElement | null> = {
  background: null, platform: null, blocks: null, tower: null, checkpoint: null, breakable: null,
};
const snowRequested = new Set<string>();
const neonImages: Record<string, HTMLImageElement | null> = {
  background: null, checkpoint: null, short: null, platform: null, laser: null, shortTall: null,
};
const neonRequested = new Set<string>();
const portalImages: Record<string, HTMLImageElement | null> = {
  background: null, checkpoint: null, platform: null, island: null, monument: null,
  islandOriginal: null, finishLower: null, finishUpper: null,
};
const portalRequested = new Set<string>();
const characterImages = new Map<string, HTMLImageElement>();

function getCharacterImage(src: string): HTMLImageElement | null {
  const current = characterImages.get(src);
  if (current?.complete && current.naturalWidth > 0) return current;
  if (!current && typeof Image !== "undefined") {
    const image = new Image();
    image.src = src;
    characterImages.set(src, image);
  }
  return null;
}

function getDesertImage(key: keyof typeof desertImages, src: string): HTMLImageElement | null {
  const current = desertImages[key];
  if (current?.complete && current.naturalWidth > 0) return current;
  if (!desertRequested.has(key) && typeof Image !== "undefined") {
    desertRequested.add(key);
    const image = new Image();
    image.src = src;
    desertImages[key] = image;
  }
  return null;
}
function getSnowImage(key: keyof typeof snowImages, src: string): HTMLImageElement | null {
  const current = snowImages[key];
  if (current?.complete && current.naturalWidth > 0) return current;
  if (!snowRequested.has(key) && typeof Image !== "undefined") {
    snowRequested.add(key);
    const image = new Image();
    image.src = src;
    snowImages[key] = image;
  }
  return null;
}
function getNeonImage(key: keyof typeof neonImages, src: string): HTMLImageElement | null {
  const current = neonImages[key];
  if (current?.complete && current.naturalWidth > 0) return current;
  if (!neonRequested.has(key) && typeof Image !== "undefined") {
    neonRequested.add(key);
    const image = new Image();
    image.src = src;
    neonImages[key] = image;
  }
  return null;
}
function getPortalImage(key: keyof typeof portalImages, src: string): HTMLImageElement | null {
  const current = portalImages[key];
  if (current?.complete && current.naturalWidth > 0) return current;
  if (!portalRequested.has(key) && typeof Image !== "undefined") {
    portalRequested.add(key);
    const image = new Image();
    image.src = src;
    portalImages[key] = image;
  }
  return null;
}
function getStoneImage(): HTMLImageElement | null {
  if (stoneImage?.complete && stoneImage.naturalWidth > 0) return stoneImage;
  if (!stoneImageRequested && typeof Image !== "undefined") {
    stoneImageRequested = true;
    stoneImage = new Image();
    stoneImage.src = stoneAsset.url;
  }
  return null;
}

function getOpeningStoneImage(): HTMLImageElement | null {
  if (openingStoneImage?.complete && openingStoneImage.naturalWidth > 0) return openingStoneImage;
  if (!openingStoneImageRequested && typeof Image !== "undefined") {
    openingStoneImageRequested = true;
    openingStoneImage = new Image();
    openingStoneImage.src = openingStoneAsset.url;
  }
  return null;
}

function getMainGroundImage(): HTMLImageElement | null {
  if (mainGroundImage?.complete && mainGroundImage.naturalWidth > 0) return mainGroundImage;
  if (!mainGroundImageRequested && typeof Image !== "undefined") {
    mainGroundImageRequested = true;
    mainGroundImage = new Image();
    mainGroundImage.src = mainGroundAsset.url;
  }
  return null;
}

function getOpeningCrateImage(): HTMLImageElement | null {
  if (openingCrateImage?.complete && openingCrateImage.naturalWidth > 0) return openingCrateImage;
  if (!openingCrateImageRequested && typeof Image !== "undefined") {
    openingCrateImageRequested = true;
    openingCrateImage = new Image();
    openingCrateImage.src = openingCrateAsset.url;
  }
  return null;
}

function getBreakablePlatformImage(): HTMLImageElement | null {
  if (breakablePlatformImage?.complete && breakablePlatformImage.naturalWidth > 0) {
    return breakablePlatformImage;
  }
  if (!breakablePlatformImageRequested && typeof Image !== "undefined") {
    breakablePlatformImageRequested = true;
    breakablePlatformImage = new Image();
    breakablePlatformImage.src = breakablePlatformAsset.url;
  }
  return null;
}
let checkpointImage: HTMLImageElement | null = null;
let checkpointImageRequested = false;
let openingBackgroundImage: HTMLImageElement | null = null;
let openingBackgroundImageRequested = false;

function getOpeningBackgroundImage(): HTMLImageElement | null {
  if (openingBackgroundImage?.complete && openingBackgroundImage.naturalWidth > 0) {
    return openingBackgroundImage;
  }
  if (!openingBackgroundImageRequested && typeof Image !== "undefined") {
    openingBackgroundImageRequested = true;
    openingBackgroundImage = new Image();
    openingBackgroundImage.src = openingBackgroundAsset.url;
  }
  return null;
}

function getBarrelImage(): HTMLImageElement | null {
  if (barrelImage?.complete && barrelImage.naturalWidth > 0) return barrelImage;
  if (!barrelImageRequested && typeof Image !== "undefined") {
    barrelImageRequested = true;
    barrelImage = new Image();
    barrelImage.src = barrelAsset.url;
  }
  return null;
}

function getCheckpointImage(): HTMLImageElement | null {
  if (checkpointImage?.complete && checkpointImage.naturalWidth > 0) return checkpointImage;
  if (!checkpointImageRequested && typeof Image !== "undefined") {
    checkpointImageRequested = true;
    checkpointImage = new Image();
    checkpointImage.src = checkpointAsset.url;
  }
  return null;
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

export function drawSky(
  ctx: CanvasRenderingContext2D,
  camY: number,
  worldH: number,
  rect: { x: number; y: number; w: number; h: number },
) {
  const meters = Math.max(0, (worldH - 70 - camY) / 4);
  const g = ctx.createLinearGradient(0, rect.y, 0, rect.y + rect.h);
  // Each height band changes mood, making the rising difficulty visible.
  if (meters < 180) {
    g.addColorStop(0, "#72cdf8");
    g.addColorStop(1, "#b7ecff");
  } else if (meters < 450) {
    g.addColorStop(0, "#52b5ee");
    g.addColorStop(1, "#94dcfa");
  } else if (meters < 800) {
    g.addColorStop(0, "#638bd9");
    g.addColorStop(1, "#83caf2");
  } else {
    g.addColorStop(0, "#675fae");
    g.addColorStop(1, "#6fb4e4");
  }
  ctx.fillStyle = g;
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
}

/** Keeps the custom opening landscape behind the climb through 550 meters. */
export function drawOpeningBackground(
  ctx: CanvasRenderingContext2D,
  meters: number,
  rect: { x: number; y: number; w: number; h: number },
) {
  if (meters >= 550) return;
  const image = getOpeningBackgroundImage();
  if (!image) return;

  const imageRatio = image.naturalWidth / image.naturalHeight;
  const rectRatio = rect.w / rect.h;
  let sourceX = 0;
  let sourceY = 0;
  let sourceW = image.naturalWidth;
  let sourceH = image.naturalHeight;

  // Cover the full game view without stretching the artwork.
  if (imageRatio > rectRatio) {
    sourceW = image.naturalHeight * rectRatio;
    sourceX = (image.naturalWidth - sourceW) / 2;
  } else {
    sourceH = image.naturalWidth / rectRatio;
    sourceY = (image.naturalHeight - sourceH) / 2;
  }

  ctx.save();
  ctx.globalAlpha = meters > 520 ? (550 - meters) / 30 : 1;
  ctx.drawImage(image, sourceX, sourceY, sourceW, sourceH, rect.x, rect.y, rect.w, rect.h);
  ctx.restore();
}

/** Desert chapter shown only after checkpoint two and through checkpoint four. */
export function drawDesertBackground(
  ctx: CanvasRenderingContext2D,
  meters: number,
  rect: { x: number; y: number; w: number; h: number },
) {
  if (meters < 540 || meters >= 1000) return;
  const image = getDesertImage("background", desertBackgroundAsset.url);
  if (!image) return;
  const imageRatio = image.naturalWidth / image.naturalHeight;
  const rectRatio = rect.w / rect.h;
  let sx = 0;
  let sy = 0;
  let sw = image.naturalWidth;
  let sh = image.naturalHeight;
  if (imageRatio > rectRatio) {
    sw = image.naturalHeight * rectRatio;
    sx = (image.naturalWidth - sw) / 2;
  } else {
    sh = image.naturalWidth / rectRatio;
    sy = (image.naturalHeight - sh) / 2;
  }
  const fadeIn = Math.min(1, (meters - 540) / 18);
  const fadeOut = Math.min(1, (1000 - meters) / 24);
  ctx.save();
  ctx.globalAlpha = Math.max(0, Math.min(fadeIn, fadeOut));
  ctx.drawImage(image, sx, sy, sw, sh, rect.x, rect.y, rect.w, rect.h);
  ctx.restore();
}

/** Frozen fortress chapter between checkpoints four and six. */
export function drawSnowBackground(
  ctx: CanvasRenderingContext2D,
  meters: number,
  rect: { x: number; y: number; w: number; h: number },
) {
  if (meters < 1000 || meters >= 1443) return;
  const image = getSnowImage("background", snowBackgroundAsset.url);
  if (!image) return;
  const imageRatio = image.naturalWidth / image.naturalHeight;
  const rectRatio = rect.w / rect.h;
  let sx = 0, sy = 0, sw = image.naturalWidth, sh = image.naturalHeight;
  if (imageRatio > rectRatio) {
    sw = image.naturalHeight * rectRatio;
    sx = (image.naturalWidth - sw) / 2;
  } else {
    sh = image.naturalWidth / rectRatio;
    sy = (image.naturalHeight - sh) / 2;
  }
  const fadeIn = Math.min(1, (meters - 1000) / 20);
  const fadeOut = Math.min(1, (1443 - meters) / 24);
  ctx.save();
  ctx.globalAlpha = Math.max(0, Math.min(fadeIn, fadeOut));
  ctx.drawImage(image, sx, sy, sw, sh, rect.x, rect.y, rect.w, rect.h);
  ctx.restore();
}

/** Neon skyline chapter from checkpoint six through checkpoint eight. */
export function drawNeonBackground(
  ctx: CanvasRenderingContext2D,
  meters: number,
  rect: { x: number; y: number; w: number; h: number },
) {
  if (meters < 1436 || meters >= 1630) return;
  const image = getNeonImage("background", neonBackgroundAsset.url);
  if (!image) return;
  const imageRatio = image.naturalWidth / image.naturalHeight;
  const rectRatio = rect.w / rect.h;
  let sx = 0, sy = 0, sw = image.naturalWidth, sh = image.naturalHeight;
  if (imageRatio > rectRatio) {
    sw = image.naturalHeight * rectRatio;
    sx = (image.naturalWidth - sw) / 2;
  } else {
    sh = image.naturalWidth / rectRatio;
    sy = (image.naturalHeight - sh) / 2;
  }
  const fadeIn = Math.min(1, (meters - 1436) / 12);
  const fadeOut = Math.min(1, (1630 - meters) / 18);
  ctx.save();
  ctx.globalAlpha = Math.max(0, Math.min(fadeIn, fadeOut));
  ctx.drawImage(image, sx, sy, sw, sh, rect.x, rect.y, rect.w, rect.h);
  ctx.restore();
}

/** Bright floating-island chapter immediately after checkpoint eight. */
export function drawPortalBackground(
  ctx: CanvasRenderingContext2D,
  meters: number,
  rect: { x: number; y: number; w: number; h: number },
) {
  if (meters < 1630) return;
  const image = getPortalImage("background", portalBackgroundAsset.url);
  if (!image) return;
  const imageRatio = image.naturalWidth / image.naturalHeight;
  const rectRatio = rect.w / rect.h;
  let sx = 0, sy = 0, sw = image.naturalWidth, sh = image.naturalHeight;
  if (imageRatio > rectRatio) {
    sw = image.naturalHeight * rectRatio;
    sx = (image.naturalWidth - sw) / 2;
  } else {
    sh = image.naturalWidth / rectRatio;
    sy = (image.naturalHeight - sh) / 2;
  }
  const fadeIn = Math.min(1, (meters - 1630) / 14);
  ctx.save();
  ctx.globalAlpha = Math.max(0, fadeIn);
  ctx.drawImage(image, sx, sy, sw, sh, rect.x, rect.y, rect.w, rect.h);
  ctx.restore();
}

export function drawClouds(
  ctx: CanvasRenderingContext2D,
  clouds: Cloud[],
  camY: number,
  time: number,
) {
  ctx.save();
  for (const c of clouds) {
    const sy = c.y - camY * c.depth;
    const span = CUR_H + 600;
    const wrapped = (((sy % span) + span) % span) - 300;
    if (wrapped < -220 || wrapped > CUR_H + 220) continue;
    const x = (((c.x + time * c.speed) % (VIEW_W + 900)) + VIEW_W + 900) % (VIEW_W + 900) - 450;
    ctx.globalAlpha = 0.35 + c.depth * 0.45;
    ctx.fillStyle = "#ffffff";
    const s = c.s;
    ctx.beginPath();
    ctx.arc(x, wrapped, 26 * s, 0, Math.PI * 2);
    ctx.arc(x + 30 * s, wrapped - 12 * s, 32 * s, 0, Math.PI * 2);
    ctx.arc(x + 66 * s, wrapped + 2 * s, 24 * s, 0, Math.PI * 2);
    ctx.arc(x + 32 * s, wrapped + 14 * s, 26 * s, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

/** Warm drifting sand and subtle heat shimmer used instead of clouds in the desert. */
export function drawDesertAtmosphere(
  ctx: CanvasRenderingContext2D,
  meters: number,
  time: number,
  rect: { x: number; y: number; w: number; h: number },
) {
  if (meters < 540 || meters >= 1000) return;
  const fade = Math.min(1, (meters - 540) / 22, (1000 - meters) / 28);
  ctx.save();
  ctx.globalAlpha = Math.max(0, fade) * 0.42;
  ctx.strokeStyle = "#ffe1a3";
  ctx.lineWidth = 2;
  for (let i = 0; i < 9; i++) {
    const y = rect.y + ((i * 83 + time * (12 + i)) % (rect.h + 80)) - 40;
    const x = rect.x + ((i * 137 + time * (30 + i * 2)) % (rect.w + 180)) - 90;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.quadraticCurveTo(x + 34, y - 7, x + 72, y + 1);
    ctx.stroke();
  }
  ctx.fillStyle = "#f6c86f";
  for (let i = 0; i < 30; i++) {
    const x = rect.x + ((i * 71 + time * (18 + (i % 4) * 5)) % rect.w);
    const y = rect.y + ((i * 47 + Math.sin(time * 1.4 + i) * 18) % rect.h + rect.h) % rect.h;
    const size = 1 + (i % 3) * 0.7;
    ctx.fillRect(x, y, size, size);
  }
  ctx.restore();
}

/** Wind-blown snow and flakes replace clouds inside the frozen chapter. */
export function drawSnowAtmosphere(
  ctx: CanvasRenderingContext2D,
  meters: number,
  time: number,
  rect: { x: number; y: number; w: number; h: number },
) {
  if (meters < 1000 || meters >= 1443) return;
  const fade = Math.max(0, Math.min(1, (meters - 1000) / 20, (1443 - meters) / 24));
  ctx.save();
  ctx.globalAlpha = fade * 0.78;
  ctx.fillStyle = "#ffffff";
  for (let i = 0; i < 58; i++) {
    const drift = time * (34 + (i % 7) * 7);
    const x = rect.x + ((i * 89 + drift) % (rect.w + 120)) - 60;
    const y = rect.y + ((i * 53 + time * (22 + (i % 5) * 5)) % rect.h);
    const size = 1.2 + (i % 4) * 0.65;
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = fade * 0.3;
  ctx.strokeStyle = "#d8f5ff";
  ctx.lineWidth = 2;
  for (let i = 0; i < 7; i++) {
    const y = rect.y + ((i * 91 + time * 18) % (rect.h + 70)) - 35;
    const x = rect.x + ((i * 173 + time * 48) % (rect.w + 180)) - 90;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.quadraticCurveTo(x + 38, y - 8, x + 82, y);
    ctx.stroke();
  }
  ctx.restore();
}

/** Restrained neon motes and light trails replace weather in the city chapter. */
export function drawNeonAtmosphere(
  ctx: CanvasRenderingContext2D,
  meters: number,
  time: number,
  rect: { x: number; y: number; w: number; h: number },
) {
  if (meters < 1436 || meters >= 1630) return;
  const fade = Math.max(0, Math.min(1, (meters - 1436) / 14, (1630 - meters) / 18));
  ctx.save();
  ctx.globalAlpha = fade * 0.5;
  for (let i = 0; i < 22; i++) {
    const x = rect.x + ((i * 127 + time * (18 + i % 4)) % rect.w);
    const y = rect.y + ((i * 61 + time * (8 + i % 3)) % rect.h);
    ctx.fillStyle = i % 2 === 0 ? "#5deaff" : "#ff54dd";
    ctx.fillRect(x, y, 2 + (i % 2), 5 + (i % 3) * 2);
  }
  ctx.globalAlpha = fade * 0.22;
  ctx.strokeStyle = "#78edff";
  ctx.lineWidth = 2;
  for (let i = 0; i < 5; i++) {
    const y = rect.y + ((i * 113 + time * 20) % rect.h);
    const x = rect.x + ((i * 181 + time * 46) % (rect.w + 160)) - 80;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + 74, y);
    ctx.stroke();
  }
  ctx.restore();
}

export function drawPortalAtmosphere(
  ctx: CanvasRenderingContext2D,
  meters: number,
  time: number,
  rect: { x: number; y: number; w: number; h: number },
) {
  if (meters < 1630 || meters >= 2110) return;
  const fade = Math.max(0, Math.min(1, (meters - 1630) / 16, (2110 - meters) / 20));
  ctx.save();
  ctx.globalAlpha = fade * 0.55;
  ctx.fillStyle = "#dffcff";
  for (let i = 0; i < 26; i++) {
    const x = rect.x + ((i * 149 + time * (10 + i % 5)) % rect.w);
    const y = rect.y + ((i * 73 - time * (16 + i % 4) + rect.h * 2) % rect.h);
    const size = 1 + (i % 3);
    ctx.fillRect(x, y, size, size);
  }
  ctx.restore();
}

export function drawSparkles(
  ctx: CanvasRenderingContext2D,
  sparkles: Sparkle[],
  camY: number,
  time: number,
) {
  ctx.save();
  ctx.fillStyle = "#ffffff";
  for (const s of sparkles) {
    const sy = s.y - camY * 0.85;
    const wrapped = ((sy % CUR_H) + CUR_H) % CUR_H;
    ctx.globalAlpha = 0.25 + 0.55 * (0.5 + 0.5 * Math.sin(time * 2 + s.t));
    ctx.fillRect(s.x, wrapped, s.s, s.s);
  }
  ctx.restore();
}

function platformColors(
  type: Platform["type"],
  tier = 0,
): { top: string; body: string; detail: string } {
  switch (type) {
    case "ice":
      return { top: "#d8f3ff", body: "#9bd8f5", detail: "#bce9ff" };
    case "bounce":
      return { top: "#ffe066", body: "#f7a52b", detail: "#ffd166" };
    case "breakable":
      return { top: "#e9c79a", body: "#c99a63", detail: "#dcb184" };
    case "moving":
      return { top: "#c7b6f7", body: "#8b7ad6", detail: "#b3a2ee" };
    case "checkpoint":
      return { top: "#b9f6cd", body: "#63c98a", detail: "#9bebb6" };
    case "finish":
      return { top: "#ffd6e7", body: "#f4779f", detail: "#ffc0d8" };
    default:
      if (tier === 1) return { top: "#b4d5ca", body: "#729c91", detail: "#98bdb2" };
      if (tier === 2) return { top: "#d7b9dd", body: "#9874a5", detail: "#bd98c6" };
      if (tier >= 3) return { top: "#e8b4c0", body: "#aa687b", detail: "#cf8fa0" };
      return { top: "#b9c3d1", body: "#7f8b9e", detail: "#a3aebe" };
  }
}

function drawStonePlatform(ctx: CanvasRenderingContext2D, p: Platform, x: number, y: number) {
  const tier = p.tier ?? 0;
  const stones = ["#6f7e96", "#70988f", "#9879a5", "#a96d80"];
  ctx.fillStyle = stones[tier] ?? "#6f7e96";
  ctx.fillRect(x, y, p.w, p.h);
  ctx.strokeRect(x, y, p.w, p.h);
  ctx.fillStyle = "#9da9ba";
  ctx.fillRect(x + 2, y + 2, p.w - 4, 7);
  const block = Math.max(28, p.w / Math.max(2, Math.floor(p.w / 40)));
  ctx.beginPath();
  for (let px = x + block; px < x + p.w; px += block) {
    ctx.moveTo(px, y);
    ctx.lineTo(px, y + p.h);
  }
  ctx.moveTo(x, y + 11);
  ctx.lineTo(x + p.w, y + 11);
  ctx.stroke();
}

function drawCratePlatform(ctx: CanvasRenderingContext2D, p: Platform, x: number, y: number) {
  const count = Math.max(1, Math.round(p.w / 62));
  const cell = p.w / count;
  for (let i = 0; i < count; i++) {
    const cx = x + i * cell;
    ctx.fillStyle = "#9b6d3f";
    ctx.fillRect(cx, y, cell, p.h + 22);
    ctx.strokeRect(cx, y, cell, p.h + 22);
    ctx.strokeStyle = "#68472d";
    ctx.beginPath();
    ctx.moveTo(cx + 6, y + 5);
    ctx.lineTo(cx + cell - 6, y + p.h + 17);
    ctx.moveTo(cx + cell - 6, y + 5);
    ctx.lineTo(cx + 6, y + p.h + 17);
    ctx.stroke();
    ctx.strokeStyle = OUTLINE;
  }
}

function drawOpeningCratePlatform(
  ctx: CanvasRenderingContext2D,
  p: Platform,
  x: number,
  y: number,
): boolean {
  const image = getOpeningCrateImage();
  if (!image) return false;
  // Crop all transparent padding so the visible box exactly matches collision.
  const sourceX = 150;
  const sourceY = 94;
  const sourceW = 1432;
  const sourceH = 398;
  const drawH = p.w * (sourceH / sourceW);
  ctx.drawImage(image, sourceX, sourceY, sourceW, sourceH, x, y, p.w, drawH);
  return true;
}

function drawBreakablePlatform(
  ctx: CanvasRenderingContext2D,
  p: Platform,
  x: number,
  y: number,
): boolean {
  const image = getBreakablePlatformImage();
  if (!image) return false;
  const sourceX = 11;
  const sourceY = 191;
  const sourceW = 1711;
  const sourceH = 197;
  const drawH = Math.max(p.h, p.w * (sourceH / sourceW));
  const progress = p.cracked ?? 0;
  const shake = progress > 0.45 ? Math.sin(progress * 90) * Math.min(3, progress * 3) : 0;
  ctx.drawImage(image, sourceX, sourceY, sourceW, sourceH, x + shake, y, p.w, drawH);
  return true;
}

function drawBarrelPlatform(ctx: CanvasRenderingContext2D, p: Platform, x: number, y: number) {
  const image = getBarrelImage();
  if (image) {
    const drawSize = Math.min(108, p.w - 4);
    const bx = x + (p.w - drawSize) / 2;
    // The PNG has transparent space above the rim. Align its first solid
    // barrel row with the physics surface, exactly like the checkpoint art.
    ctx.drawImage(image, bx, y - drawSize * 0.128, drawSize, drawSize);
    return;
  }
  const count = Math.max(1, Math.round(p.w / 82));
  const barrelW = p.w / count;
  for (let i = 0; i < count; i++) {
    const bx = x + i * barrelW + 2;
    ctx.fillStyle = "#8a613b";
    roundRect(ctx, bx, y, barrelW - 4, 38, 13);
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = "#c3cad4";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(bx + 8, y + 3);
    ctx.lineTo(bx + 8, y + 35);
    ctx.moveTo(bx + barrelW - 12, y + 3);
    ctx.lineTo(bx + barrelW - 12, y + 35);
    ctx.stroke();
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 3.5;
  }
}

function drawCheckpointPlatform(
  ctx: CanvasRenderingContext2D,
  p: Platform,
  x: number,
  y: number,
): boolean {
  const image = getCheckpointImage();
  if (!image) return false;
  const drawW = p.w;
  const drawH = drawW * (image.naturalHeight / image.naturalWidth);
  // The source PNG's playable red edge begins 60.5% down the artwork.
  // Pin that exact pixel row to the physics platform so the feet touch it.
  ctx.drawImage(image, x, y - drawH * 0.605, drawW, drawH);
  return true;
}

function drawDesertArtwork(
  ctx: CanvasRenderingContext2D,
  p: Platform,
  x: number,
  y: number,
): boolean {
  if (p.visual === "desertCheckpoint") {
    const image = getDesertImage("checkpoint", desertCheckpointAsset.url);
    if (!image) return false;
    const sx = 32, sy = 22, sw = 1160, sh = 750;
    const drawH = p.w * (sh / sw);
    ctx.drawImage(image, sx, sy, sw, sh, x, y - drawH * ((492 - sy) / sh), p.w, drawH);
    return true;
  }
  if (p.visual === "desertPlatform") {
    const image = getDesertImage("platform", desertPlatformAsset.url);
    if (!image) return false;
    const sx = 53, sy = 180, sw = 1625, sh = 238;
    const drawH = p.w * (sh / sw);
    ctx.drawImage(image, sx, sy, sw, sh, x, y - drawH * ((195 - sy) / sh), p.w, drawH);
    return true;
  }
  if (p.visual === "desertSmall") {
    const image = getDesertImage("small", desertSmallAsset.url);
    if (!image) return false;
    const sx = 99, sy = 169, sw = 1216, sh = 425;
    const drawH = p.w * (sh / sw);
    ctx.drawImage(image, sx, sy, sw, sh, x, y - drawH * ((216 - sy) / sh), p.w, drawH);
    return true;
  }
  if (p.visual === "desertBoxes") {
    const image = getDesertImage("boxes", desertBoxesAsset.url);
    if (!image) return false;
    const sx = 66, sy = 32, sw = 1785, sh = 608;
    const drawH = p.w * (sh / sw);
    ctx.drawImage(image, sx, sy, sw, sh, x, y - drawH * ((107 - sy) / sh), p.w, drawH);
    return true;
  }
  return false;
}

function drawSnowArtwork(
  ctx: CanvasRenderingContext2D,
  p: Platform,
  x: number,
  y: number,
): boolean {
  let image: HTMLImageElement | null = null;
  let sx = 0, sy = 0, sw = 1, sh = 1, landingRow = 0;
  if (p.visual === "snowPlatform") {
    image = getSnowImage("platform", snowPlatformAsset.url);
    sx = 20; sy = 143; sw = 1690; sh = 303; landingRow = 160;
  } else if (p.visual === "snowBlockSingle") {
    image = getSnowImage("blocks", snowBlocksAsset.url);
    sx = 102; sy = 50; sw = 510; sh = 438; landingRow = 57;
  } else if (p.visual === "snowBlocks") {
    image = getSnowImage("blocks", snowBlocksAsset.url);
    sx = 102; sy = 50; sw = 1529; sh = 438; landingRow = 57;
  } else if (p.visual === "snowTower") {
    image = getSnowImage("tower", snowTowerAsset.url);
    sx = 98; sy = 9; sw = 804; sh = 973; landingRow = 27;
  } else if (p.visual === "snowCheckpoint") {
    image = getSnowImage("checkpoint", snowCheckpointAsset.url);
    sx = 20; sy = 122; sw = 1183; sh = 654; landingRow = 500;
  } else if (p.visual === "snowBreakable") {
    image = getSnowImage("breakable", snowBreakableAsset.url);
    sx = 22; sy = 150; sw = 1688; sh = 347; landingRow = 165;
  }
  if (!image) return false;
  const drawH = p.w * (sh / sw);
  const progress = p.cracked ?? 0;
  const shake = p.visual === "snowBreakable" && progress > 0.45
    ? Math.sin(progress * 90) * Math.min(3, progress * 3)
    : 0;
  ctx.drawImage(image, sx, sy, sw, sh, x + shake, y - drawH * ((landingRow - sy) / sh), p.w, drawH);
  return true;
}

function drawNeonArtwork(
  ctx: CanvasRenderingContext2D,
  p: Platform,
  x: number,
  y: number,
): boolean {
  let image: HTMLImageElement | null = null;
  let sx = 0, sy = 0, sw = 1, sh = 1, landingRow = 0;
  if (p.visual === "neonPlatform") {
    image = getNeonImage("platform", neonPlatformAsset.url);
    sx = 26; sy = 137; sw = 1678; sh = 325; landingRow = 139;
  } else if (p.visual === "neonShort") {
    image = getNeonImage("short", neonShortAsset.url);
    sx = 37; sy = 180; sw = 1344; sh = 401; landingRow = 181;
  } else if (p.visual === "neonShortTall") {
    image = getNeonImage("shortTall", neonShortTallAsset.url);
    sx = 29; sy = 114; sw = 1007; sh = 760; landingRow = 116;
  } else if (p.visual === "neonCheckpoint") {
    image = getNeonImage("checkpoint", neonCheckpointAsset.url);
    // The character's feet sit on the glowing pad/front-deck seam. Using the
    // old row left a visible air gap of roughly six rendered pixels.
    sx = 31; sy = 36; sw = 1161; sh = 720; landingRow = 535;
  } else if (p.visual === "neonLaser") {
    image = getNeonImage("laser", neonLaserAsset.url);
    sx = 56; sy = 152; sw = 1618; sh = 303; landingRow = 180;
  }
  if (!image) return false;
  const drawH = p.w * (sh / sw);
  ctx.drawImage(image, sx, sy, sw, sh, x, y - drawH * ((landingRow - sy) / sh), p.w, drawH);
  return true;
}

function drawPortalArtwork(
  ctx: CanvasRenderingContext2D,
  p: Platform,
  x: number,
  y: number,
): boolean {
  let image: HTMLImageElement | null = null;
  let sx = 0, sy = 0, sw = 1, sh = 1, landingRow = 0;
  if (p.visual === "portalPlatform") {
    // Full island artwork keeps every regular portal landing visible on phones.
    image = getPortalImage("islandOriginal", portalIslandOriginalAsset.url);
    sx = 99; sy = 38; sw = 770; sh = 966; landingRow = 247;
  } else if (p.visual === "portalCheckpoint") {
    image = getPortalImage("checkpoint", portalCheckpointAsset.url);
    sx = 46; sy = 5; sw = 1132; sh = 778; landingRow = 590;
  } else if (p.visual === "portalIsland") {
    image = getPortalImage("islandOriginal", portalIslandOriginalAsset.url);
    sx = 99; sy = 38; sw = 770; sh = 966; landingRow = 247;
  } else if (p.visual === "portalMonument") {
    image = getPortalImage("monument", portalMonumentAsset.url);
    sx = 38; sy = 34; sw = 726; sh = 1140; landingRow = 68;
  } else if (p.visual === "portalFinishProp") {
    image = getPortalImage("finishProp", portalFinishPropAsset.url);
    sx = 38; sy = 34; sw = 726; sh = 1140; landingRow = 1080;
  } else if (p.visual === "portalDeck") {
    image = getPortalImage("deck", portalDeckAsset.url);
    sx = 177; sy = 38; sw = 591; sh = 221; landingRow = 218;
  } else if (p.visual === "portalGateway") {
    image = getPortalImage("gateway", portalGatewayAsset.url);
    // Align the physics surface to the tower's upper stone cap.
    sx = 38; sy = 34; sw = 726; sh = 1140; landingRow = 68;
  } else if (p.visual === "portalFinal") {
    image = getPortalImage("final", portalFinalAsset.url);
    sx = 565; sy = 5; sw = 111; sh = 92; landingRow = 88;
  } else if (p.visual === "portalFinishLower") {
    image = getPortalImage("finishLower", finishLowerAsset.url);
    sx = 52; sy = 70; sw = 1620; sh = 450; landingRow = 151;
  } else if (p.visual === "portalFinishUpper") {
    image = getPortalImage("finishUpper", finishUpperAsset.url);
    sx = 46; sy = 5; sw = 1132; sh = 778; landingRow = 590;
  }
  if (!image) return false;
  const drawH = p.w * (sh / sw);
  ctx.drawImage(image, sx, sy, sw, sh, x, y - drawH * ((landingRow - sy) / sh), p.w, drawH);
  return true;
}

function drawMarketPlatform(ctx: CanvasRenderingContext2D, p: Platform, x: number, y: number) {
  ctx.fillStyle = "#8e6039";
  ctx.fillRect(x + 8, y, p.w - 16, 46);
  ctx.strokeRect(x + 8, y, p.w - 16, 46);
  const stripeW = (p.w - 16) / 6;
  for (let i = 0; i < 6; i++) {
    ctx.fillStyle = i % 2 === 0 ? "#e85d58" : "#f6e4d0";
    ctx.fillRect(x + 8 + i * stripeW, y, stripeW, 16);
  }
  ctx.strokeRect(x + 8, y, p.w - 16, 16);
  ctx.fillStyle = "#78d59b";
  for (let i = 0; i < 5; i++) {
    ctx.beginPath();
    ctx.arc(x + 28 + i * 30, y + 29, 7, 0, Math.PI * 2);
    ctx.fill();
  }
}

export function drawPlatform(
  ctx: CanvasRenderingContext2D,
  p: Platform,
  camY: number,
  time: number,
) {
  if (p.gone) return;
  const y = p.y - camY;
  if (y > CUR_H + 160 || y + p.h < -160) return;
  const x = p.type === "moving" ? p.x : p.x;
  const c = platformColors(p.type, p.tier);

  ctx.save();
  if (p.type === "breakable" && (p.cracked ?? 0) > 0) {
    ctx.globalAlpha = 1 - (p.cracked ?? 0) * 0.45;
  }
  ctx.lineWidth = 3.5;
  ctx.strokeStyle = OUTLINE;

  if (p.type === "breakable") {
    const hasCustomBreakable = p.visual === "snowBreakable"
      ? drawSnowArtwork(ctx, p, x, y)
      : drawBreakablePlatform(ctx, p, x, y);
    if (!hasCustomBreakable) drawStonePlatform(ctx, p, x, y);
    ctx.restore();
    return;
  }

  if (
    p.visual === "portalPlatform" ||
    p.visual === "portalCheckpoint" ||
    p.visual === "portalIsland" ||
    p.visual === "portalMonument" ||
    p.visual === "portalFinishProp" ||
    p.visual === "portalDeck" ||
    p.visual === "portalGateway" ||
    p.visual === "portalFinal" ||
    p.visual === "portalFinishLower" ||
    p.visual === "portalFinishUpper"
  ) {
    const hasArtwork = drawPortalArtwork(ctx, p, x, y);
    if (!hasArtwork) drawStonePlatform(ctx, p, x, y);
    ctx.restore();
    return;
  }

  if (
    p.visual === "neonPlatform" ||
    p.visual === "neonShort" ||
    p.visual === "neonShortTall" ||
    p.visual === "neonCheckpoint" ||
    p.visual === "neonLaser"
  ) {
    const hasArtwork = drawNeonArtwork(ctx, p, x, y);
    if (!hasArtwork && p.type !== "hazard") drawStonePlatform(ctx, p, x, y);
    ctx.restore();
    return;
  }

  if (
    p.visual === "snowPlatform" ||
    p.visual === "snowBlockSingle" ||
    p.visual === "snowBlocks" ||
    p.visual === "snowTower" ||
    p.visual === "snowCheckpoint"
  ) {
    const hasArtwork = drawSnowArtwork(ctx, p, x, y);
    if (!hasArtwork) drawStonePlatform(ctx, p, x, y);
    ctx.restore();
    return;
  }

  if (
    p.visual === "desertCheckpoint" ||
    p.visual === "desertPlatform" ||
    p.visual === "desertSmall" ||
    p.visual === "desertBoxes"
  ) {
    const hasArtwork = drawDesertArtwork(ctx, p, x, y);
    if (!hasArtwork) drawStonePlatform(ctx, p, x, y);
    ctx.restore();
    return;
  }

  if (p.visual === "crate") {
    drawCratePlatform(ctx, p, x, y);
    ctx.restore();
    return;
  }
  if (p.visual === "openingCrate") {
    const hasCustomCrate = drawOpeningCratePlatform(ctx, p, x, y);
    if (!hasCustomCrate) drawCratePlatform(ctx, p, x, y);
    ctx.restore();
    return;
  }
  if (p.visual === "barrel") {
    drawBarrelPlatform(ctx, p, x, y);
    ctx.restore();
    return;
  }
  if (p.visual === "market") {
    const hasCustomCheckpoint = drawCheckpointPlatform(ctx, p, x, y);
    if (!hasCustomCheckpoint) drawMarketPlatform(ctx, p, x, y);
    ctx.restore();
    if (p.type === "checkpoint" && !hasCustomCheckpoint) {
      drawFlag(ctx, x + p.w / 2, y, time, p.cpIndex ?? 0);
    }
    return;
  }
  if (p.visual === "mainGround") {
    const mainGround = getMainGroundImage();
    if (mainGround) {
      // Crop the transparent border from the high-resolution artwork and pin
      // its first continuous stone row to the physics ground surface.
      const sourceX = 21;
      const sourceY = 230;
      const sourceW = 1878;
      const sourceH = 231;
      const drawH = p.w * (sourceH / sourceW);
      const landingInset = drawH * (15 / sourceH);
      ctx.drawImage(mainGround, sourceX, sourceY, sourceW, sourceH, x, y - landingInset, p.w, drawH);
      ctx.restore();
      return;
    }
    drawStonePlatform(ctx, p, x, y);
    ctx.restore();
    return;
  }
  if (p.visual === "openingStone") {
    const openingStone = getOpeningStoneImage();
    if (openingStone) {
      // Crop the transparent border from the uploaded PNG. The flat pale
      // stone edge lands exactly on p.y; leaves may extend slightly above it.
      const sourceX = 51;
      const sourceY = 81;
      const sourceW = 765;
      const sourceH = 142;
      const drawH = Math.max(p.h, p.w * (sourceH / sourceW));
      const landingInset = drawH * (16 / sourceH);
      ctx.drawImage(
        openingStone,
        sourceX,
        sourceY,
        sourceW,
        sourceH,
        x,
        y - landingInset,
        p.w,
        drawH,
      );
      ctx.restore();
      return;
    }
    drawStonePlatform(ctx, p, x, y);
    ctx.restore();
    return;
  }
  if (p.visual === "stone") {
    const stone = p.type !== "ground" ? getStoneImage() : null;
    if (stone) {
      const drawH = Math.max(p.h + 4, (p.w * stone.naturalHeight) / stone.naturalWidth);
      ctx.drawImage(stone, x, y - 1, p.w, drawH);
      ctx.restore();
      return;
    }
    drawStonePlatform(ctx, p, x, y);
    ctx.restore();
    return;
  }

  // body
  ctx.fillStyle = c.body;
  roundRect(ctx, x, y, p.w, p.h, 7);
  ctx.fill();
  ctx.stroke();

  // top cap
  ctx.fillStyle = c.top;
  roundRect(ctx, x + 2, y + 2, p.w - 4, Math.min(9, p.h - 6), 5);
  ctx.fill();

  // stone detail
  ctx.fillStyle = c.detail;
  const cells = Math.max(1, Math.floor(p.w / 34));
  for (let i = 0; i < cells; i++) {
    const cw = (p.w - 10) / cells;
    ctx.globalAlpha *= 1;
    roundRect(ctx, x + 5 + i * cw + 2, y + 13, cw - 5, Math.max(4, p.h - 18), 3);
    ctx.fill();
  }
  ctx.restore();

  if (p.type === "bounce") {
    ctx.save();
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 3;
    ctx.beginPath();
    const bob = Math.sin(time * 6) * 2;
    ctx.moveTo(x + p.w * 0.3, y - 6 + bob);
    ctx.lineTo(x + p.w * 0.5, y - 14 + bob);
    ctx.lineTo(x + p.w * 0.7, y - 6 + bob);
    ctx.stroke();
    ctx.restore();
  }

  if (p.type === "checkpoint") drawFlag(ctx, x + p.w / 2, y, time, p.cpIndex ?? 0);
}

function drawFlag(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  time: number,
  idx: number,
) {
  const h = 58;
  ctx.save();
  ctx.lineWidth = 3.5;
  ctx.strokeStyle = OUTLINE;
  ctx.fillStyle = "#e9eef6";
  roundRect(ctx, x - 2.5, y - h, 5, h, 2);
  ctx.fill();
  ctx.stroke();

  const wave = Math.sin(time * 4 + idx) * 5;
  ctx.fillStyle = "#3ed37b";
  ctx.beginPath();
  ctx.moveTo(x + 2, y - h + 2);
  ctx.quadraticCurveTo(x + 34 + wave, y - h + 12, x + 2, y - h + 30);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = OUTLINE;
  ctx.font = "bold 9px system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("CHECKPOINT", x, y - h - 8);
  ctx.restore();
}

export function drawFinish(
  ctx: CanvasRenderingContext2D,
  p: Platform,
  camY: number,
  time: number,
) {
  const y = p.y - camY;
  if (y > CUR_H + 300 || y < -420) return;
  ctx.save();
  // sign
  ctx.lineWidth = 4;
  ctx.strokeStyle = OUTLINE;
  const sx = p.x + p.w / 2 - 130;
  const sy = y - 300 + Math.sin(time * 2) * 3;
  ctx.fillStyle = "#ffd447";
  roundRect(ctx, sx, sy, 260, 68, 14);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = OUTLINE;
  ctx.font = "bold 28px system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("GAME FINISHED!", sx + 130, sy + 31);
  ctx.font = "bold 15px system-ui, sans-serif";
  ctx.fillText("LEVEL COMPLETE!", sx + 130, sy + 53);
  ctx.restore();
}

export function drawPlayer(
  ctx: CanvasRenderingContext2D,
  p: PlayerState,
  camY: number,
  name: string,
  skin: CharacterSkin = DEFAULT_SKIN,
) {
  const character = characterChoice(skin.look);
  const image = getCharacterImage(character.src);
  const cx = p.x + p.w / 2;
  const baseY = p.y + p.h - camY;
  const breathe = p.anim === "idle" ? Math.sin(p.t * 3.4) * 0.035 : 0;
  let sx = 1 + p.squash + breathe;
  let sy = 1 - p.squash - breathe;
  if (p.anim === "win") {
    sx = 1 + Math.sin(p.t * 10) * 0.12;
    sy = 1 - Math.sin(p.t * 10) * 0.12;
  }
  const spriteW = (skin.look === "fire" ? 62 : skin.look === "desert" ? 59 : 55) * sx;
  const spriteRatio = character.crop.h / character.crop.w;
  const spriteH = spriteW * spriteRatio * sy / sx;

  ctx.save();
  ctx.translate(cx, baseY);

  // shadow
  ctx.globalAlpha = 0.18;
  ctx.fillStyle = "#0b1a2e";
  ctx.beginPath();
  ctx.ellipse(0, 2, p.w * 0.58, 5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;
  if (image) {
    // The uploaded artwork faces left by default, so mirror opposite to the
    // physics direction: right input shows the front, left input the back.
    ctx.scale(-p.facing, 1);
    const crop = character.crop;
    ctx.drawImage(image, crop.x, crop.y, crop.w, crop.h, -spriteW / 2, -spriteH, spriteW, spriteH);
  } else {
    ctx.fillStyle = "#2450cb";
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.ellipse(0, -24, 27, 24, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }
  ctx.restore();

  // name label
  ctx.save();
  ctx.font = "bold 11px system-ui, sans-serif";
  const label = name || "You";
  const tw = ctx.measureText(label).width + 14;
  ctx.fillStyle = "rgba(32,48,74,0.85)";
  const labelY = baseY - spriteH - 8;
  roundRect(ctx, cx - tw / 2, labelY - 13, tw, 17, 8);
  ctx.fill();
  ctx.fillStyle = "#fff";
  ctx.textAlign = "center";
  ctx.fillText(label, cx, labelY);
  ctx.restore();
}

export function drawParticles(
  ctx: CanvasRenderingContext2D,
  ps: ParticleSystem,
  camY: number,
) {
  ctx.save();
  for (const p of ps.parts) {
    const y = p.y - camY;
    if (y < -80 || y > CUR_H + 80) continue;
    ctx.globalAlpha = Math.max(0, Math.min(1, p.life / 0.6));
    ctx.fillStyle = p.color;
    if (p.shape === "rect") {
      ctx.save();
      ctx.translate(p.x, y);
      ctx.rotate(p.rot);
      ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
      ctx.restore();
    } else {
      ctx.beginPath();
      ctx.arc(p.x, y, p.size / 2, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
}

export function drawHeightMarkers(
  ctx: CanvasRenderingContext2D,
  level: Level,
  camY: number,
) {
  ctx.save();
  ctx.font = "bold 11px system-ui, sans-serif";
  ctx.textAlign = "left";
  const mTop = Math.ceil((level.groundY - camY + 40) / 4 / 50) * 50;
  const mLow = Math.max(50, Math.floor((level.groundY - camY - CUR_H - 40) / 4 / 50) * 50);
  for (let m = mLow; m <= mTop; m += 50) {
    const worldY = level.groundY - m * 4;
    const y = worldY - camY;
    if (y < -20 || y > CUR_H + 20) continue;
    ctx.strokeStyle = "rgba(255,255,255,0.35)";
    ctx.lineWidth = 2;
    ctx.setLineDash([8, 10]);
    ctx.beginPath();
    ctx.moveTo(-460, y);
    ctx.lineTo(VIEW_W + 460, y);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = "rgba(255,255,255,0.85)";
    ctx.fillText(`${m}m`, 8, y - 5);
  }
  ctx.restore();
}
