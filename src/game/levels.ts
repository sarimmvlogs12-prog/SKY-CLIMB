import type { Level, Platform, PlatformType } from "./types";
import { collisionBox } from "./collision";

export const WORLD_WIDTH = 960;
/** 4 world pixels = 1 meter */
export const PIXELS_PER_METER = 4;
/** Distance between score/energy milestones (meters). */
export const MILESTONE_M = 250;
export const DESERT_START_M = 540;
export const DESERT_END_M = 1000;
export const SNOW_START_M = 1000;
export const SNOW_END_M = 1443;
export const NEON_START_M = 1436;
export const NEON_END_M = 1630;
export const PORTAL_START_M = 1630;
export const PORTAL_END_M = 2110;

/** Drawn artwork crop per visual: [sy, sw, sh, landingRow] — mirrors render.ts. */
const ART_EXTENT: Partial<Record<NonNullable<Platform["visual"]>, [number, number, number, number]>> = {
  portalPlatform: [38, 770, 966, 247],
  portalCheckpoint: [5, 1132, 778, 590],
  portalDeck: [38, 591, 221, 218],
  portalGateway: [34, 726, 1140, 68],
  portalFinishLower: [70, 1620, 450, 151],
  portalFinishUpper: [5, 1132, 778, 590],
  neonCheckpoint: [36, 1161, 720, 535],
};
/** Minimum clear air between two drawn props in the sky-portal chapter. */
const ART_MARGIN = 14;

type CourseBand = {
  startMeters: number;
  gap: [number, number];
  width: [number, number];
  maxShift: number;
  moving: number;
  small: number;
  bounce: number;
  ice: number;
  breakable: number;
};

/** Deliberate difficulty steps: learn first, then introduce one challenge at a time. */
const COURSE_BANDS: CourseBand[] = [
  {
    startMeters: 0,
    gap: [78, 84],
    width: [158, 184],
    maxShift: 112,
    moving: 0,
    small: 0,
    bounce: 0.06,
    ice: 0,
    breakable: 0,
  },
  {
    startMeters: 180,
    gap: [78, 86],
    width: [142, 170],
    maxShift: 132,
    moving: 0.08,
    small: 0.05,
    bounce: 0.07,
    ice: 0,
    breakable: 0,
  },
  {
    startMeters: 450,
    gap: [72, 82],
    width: [124, 154],
    maxShift: 150,
    moving: 0.11,
    small: 0.08,
    bounce: 0.07,
    ice: 0.07,
    breakable: 0.06,
  },
  {
    startMeters: 800,
    gap: [76, 88],
    width: [112, 142],
    maxShift: 166,
    moving: 0.14,
    small: 0.11,
    bounce: 0.07,
    ice: 0.1,
    breakable: 0.09,
  },
];

function bandFor(meters: number): { band: CourseBand; tier: 0 | 1 | 2 | 3 } {
  let tier: 0 | 1 | 2 | 3 = 0;
  for (let i = 1; i < COURSE_BANDS.length; i++) {
    const candidate = COURSE_BANDS[i];
    if (candidate && meters >= candidate.startMeters) tier = i as 1 | 2 | 3;
  }
  const band = COURSE_BANDS[tier];
  if (!band) return { band: COURSE_BANDS[0] as CourseBand, tier: 0 };
  return { band, tier };
}

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Builds the vertical course. Checkpoint ten is the final landing and stops
 * generation, so the summit is visually clear with nothing above it.
 */
export function buildLevel(index: number): Level {
  const rnd = mulberry32(1337 + index * 7919);
  const worldHeight = 4300;
  const groundY = worldHeight - 70;
  const platforms: Platform[] = [];

  platforms.push({ x: 0, y: groundY, w: WORLD_WIDTH, h: 70, type: "ground", tier: 0, visual: "mainGround" });
  platforms.push({ x: 270, y: groundY - 96, w: 180, h: 26, type: "normal", tier: 0, visual: "openingCrate" });
  platforms.push({ x: 423, y: groundY - 180, w: 174, h: 26, type: "normal", tier: 0, visual: "openingStone" });

  let y = groundY - 264;
  let previousCenter = 517;
  let step = 0;
  let zigzagDirection: -1 | 1 = 1;
  let stepsBeforeTurn = 2;
  let desertStep = 0;
  let snowStep = 0;
  let neonStep = 0;
  let portalStep = 0;
  let finalGenerated = false;
  let lastGapDouble = false;
  let deferredVisual: "snowTower" | "portalGateway" | null = null;

  type Span = { x0: number; x1: number; top: number; bottom: number };
  const spanOf = (q: Platform, reach = q.type === "moving" ? (q.range ?? 0) : 0): Span => {
    const box = collisionBox(q);
    return { x0: box.x - reach, x1: box.x + box.w + reach, top: box.y, bottom: box.y + box.h };
  };
  const overlapsX = (a: Span, x0: number, x1: number, margin: number) =>
    a.x0 < x1 + margin && a.x1 > x0 - margin;
  /** Full drawn artwork rectangle (matches render.ts crops), used so props never visually collide. */
  const artOf = (q: Pick<Platform, "x" | "y" | "w" | "visual">): Span | null => {
    const a = q.visual ? ART_EXTENT[q.visual] : undefined;
    if (!a) return null;
    const [sy, sw, sh, landingRow] = a;
    const drawH = q.w * (sh / sw);
    const top = q.y - drawH * ((landingRow - sy) / sh);
    return { x0: q.x, x1: q.x + q.w, top, bottom: top + drawH };
  };

  /**
   * Every platform is solid, so a new platform must never sit over the jump
   * lane the player needs below it. Rules checked against the recent route:
   * 1. no horizontal overlap with the platform the player jumps from;
   * 2. no body overlap with any recent platform;
   * 3. anything above an earlier jump (from Q to its successor S) must leave
   *    full head room: its underside stays 48px above S's landing top;
   * 4. the horizontal edge gap from the takeoff platform stays jumpable.
   * 5. (sky-portal chapter) the full drawn artwork never overlaps another
   *    platform's artwork, so every island stays completely visible.
   * The closest valid position to the designed zig-zag target is chosen.
   */
  const placeClear = (
    targetCenter: number,
    targetY: number,
    w: number,
    visual: NonNullable<Platform["visual"]>,
    reach: number,
    doubleGap: boolean,
    spaced = false,
  ): { center: number; y: number; ok: boolean } => {
    const route: Platform[] = [];
    for (let i = platforms.length - 1; i >= 0 && route.length < 8; i--) {
      const q = platforms[i];
      if (q && q.type !== "hazard") route.unshift(q);
    }
    const takeoff = route[route.length - 1];
    if (!takeoff) return { center: targetCenter, y: targetY, ok: true };
    const a = spanOf(takeoff);
    const minC = 30 + w / 2;
    const maxC = WORLD_WIDTH - 30 - w / 2;
    const fits = (c: number, py: number) => {
      const n = spanOf({ x: c - w / 2, y: py, w, h: 24, type: "normal", tier: 0, visual }, reach);
      if (overlapsX(a, n.x0, n.x1, 6)) return false;
      const edgeGap = n.x0 >= a.x1 ? n.x0 - a.x1 : a.x0 - n.x1;
      const rise = takeoff.y - py;
      // Higher-than-single-jump rises need a double jump, so keep them short sideways.
      const maxEdge = spaced && rise > 124 ? 56 : spaced && rise > 96 && !doubleGap ? 72 : doubleGap ? 96 : 84;
      if (edgeGap > maxEdge) return false;
      if (spaced) {
        const art = artOf({ x: c - w / 2, y: py, w, visual }) ?? n;
        for (const q of route) {
          const qa = artOf(q) ?? spanOf(q);
          if (
            qa.x0 < art.x1 + ART_MARGIN && qa.x1 > art.x0 - ART_MARGIN &&
            qa.top < art.bottom + ART_MARGIN && qa.bottom > art.top - ART_MARGIN
          ) return false;
        }
      }
      for (let i = 0; i < route.length; i++) {
        const q = route[i] as Platform;
        const s = spanOf(q);
        if (overlapsX(s, n.x0, n.x1, 4) && s.top < n.bottom + 4 && s.bottom > n.top - 4) return false;
        const next = route[i + 1];
        if (!next) continue;
        const sn = spanOf(next);
        // The player only needs the takeoff edge nearest the next landing,
        // plus the whole landing itself, to stay free of overhead bodies.
        let laneX0 = Math.min(s.x0, sn.x0);
        let laneX1 = Math.max(s.x1, sn.x1);
        if (sn.x0 >= s.x1) laneX0 = Math.max(s.x0, s.x1 - 72);
        else if (sn.x1 <= s.x0) laneX1 = Math.min(s.x1, s.x0 + 72);
        if (overlapsX({ x0: laneX0, x1: laneX1, top: 0, bottom: 0 }, n.x0, n.x1, 18) && n.bottom > sn.top - 48) {
          return false;
        }
      }
      return true;
    };
    const clampC = (c: number) => Math.max(minC, Math.min(maxC, c));
    const preferred = targetCenter >= (a.x0 + a.x1) / 2 ? 1 : -1;
    const candidates: number[] = [clampC(targetCenter)];
    for (const g of [12, 26, 40, 56, 72]) {
      for (const side of [preferred, -preferred]) {
        candidates.push(clampC(side > 0 ? a.x1 + g + w / 2 : a.x0 - g - w / 2));
      }
    }
    const rise = takeoff.y - targetY;
    const maxRise = spaced ? 150 : doubleGap ? 124 : 92;
    const maxLift = spaced ? 10 : 4;
    for (let lift = 0; lift <= maxLift; lift++) {
      const py = targetY - lift * 8;
      if (lift > 0 && rise + lift * 8 > maxRise) break;
      for (const c of candidates) if (fits(c, py)) return { center: c, y: py, ok: true };
    }
    return { center: clampC(targetCenter), y: targetY, ok: false };
  };

  const level: Level = {
    index,
    worldWidth: WORLD_WIDTH,
    worldHeight,
    groundY,
    platforms,
    spawn: { x: 120, y: groundY - 40 },
    finishY: -Infinity,
    totalCheckpoints: 0,
    extend: () => {},
  };

  level.extend = (minY: number) => {
    if (finalGenerated) return;
    while (y > minY && !finalGenerated) {
      const climbed = groundY - y;
      const meters = climbed / PIXELS_PER_METER;
      const displayedMeters = (climbed - 34) / PIXELS_PER_METER;
      const { band, tier } = bandFor(meters);
      const inDesert = displayedMeters >= DESERT_START_M && displayedMeters < DESERT_END_M;
      const inSnow = displayedMeters >= SNOW_START_M && displayedMeters < SNOW_END_M;
      const inNeon = displayedMeters >= NEON_START_M && displayedMeters < NEON_END_M;
      const inPortal = displayedMeters >= PORTAL_START_M; // runs until checkpoint ten ends generation
      const snowMotif = snowStep % 12;
      const neonMotif = neonStep % 14;
      const portalMotif = portalStep % 16;

      let type: PlatformType = "normal";
      const roll = rnd();
      let cursor = band.moving;
      if (step > 0 && step % 10 === 0) type = "checkpoint";
      // Breakable platforms stay in the opening section only — never above
      // the 2nd checkpoint (550m), where the later bands take over.
      else if (meters < 550 && step >= 4 && step % 7 === 4) type = "breakable";
      else if (inSnow && (snowMotif === 4 || snowMotif === 10)) type = "breakable";
      else if (inSnow && (snowMotif === 2 || snowMotif === 8)) type = "small";
      else if (inSnow && roll < 0.08) type = "ice";
      else if (inSnow && roll < 0.13) type = "moving";
      else if (inDesert && roll < 0.14) type = "small";
      else if (inDesert && roll < 0.19) type = "bounce";
      else if (!inDesert && !inSnow && !inNeon && !inPortal && roll < cursor) type = "moving";
      else if (!inDesert && !inSnow && !inNeon && !inPortal && roll < (cursor += band.small)) type = "small";
      else if (!inDesert && !inSnow && !inNeon && !inPortal && roll < (cursor += band.bounce)) type = "bounce";
      else if (!inDesert && !inSnow && !inNeon && !inPortal && roll < (cursor += band.ice)) type = "ice";
      else if (meters < 550 && roll < cursor + band.breakable) type = "breakable";

      let w = inDesert
        ? 150 + rnd() * 30
        : inSnow
          ? 142 + rnd() * 24
          : inNeon
            ? 152 + rnd() * 24
          : inPortal
            ? 142 + rnd() * 16
          : band.width[0] + rnd() * (band.width[1] - band.width[0]);
      if (type === "small") w = tier < 3 ? 88 : 78;
      if (type === "checkpoint") w = inSnow ? 190 : inNeon ? 194 : inPortal ? 204 : 184;
      if (type === "bounce") type = "normal"; // high-jump pads removed
      if (type === "breakable") w = Math.min(w, 150);

      const minCenter = 30 + w / 2;
      const maxCenter = WORLD_WIDTH - 30 - w / 2;
      const minShift = inDesert ? 68 : inSnow ? 80 : inNeon ? 76 : inPortal ? 96 : 72 + tier * 7;
      const maxShift = inDesert ? 124 : inSnow ? 132 : inNeon ? 138 : inPortal ? 148 : band.maxShift;
      const shift = minShift + rnd() * Math.max(0, maxShift - minShift);
      let center = previousCenter + zigzagDirection * shift;

      if (inPortal) {
        // Clean hard-mode terraces: three readable landings travel across one
        // level, then the route rises and reverses. The second half mirrors the
        // rhythm with different turn points so it feels designed, not stacked.
        const firstHalf = [195, 345, 495, 645, 790, 640, 490, 340, 190, 340, 490, 640, 790, 640, 490, 340];
        const secondHalf = [765, 615, 465, 315, 170, 320, 470, 620, 770, 620, 470, 320, 170, 320, 470, 620];
        const targets = displayedMeters < 1845 ? firstHalf : secondHalf;
        const target = targets[portalStep % targets.length] ?? 480;
        center = Math.max(minCenter, Math.min(maxCenter, target + (rnd() - 0.5) * 6));
        portalStep++;
      } else if (inNeon) {
        // Alternate decisively across the arena rather than drifting along one
        // side. Both halves use different switchback rhythms.
        const firstHalf = [250, 390, 530, 670, 550, 410, 270, 420, 570, 710];
        const secondHalf = [710, 560, 410, 260, 390, 540, 690, 550, 400, 250];
        const targets = displayedMeters < 1690 ? firstHalf : secondHalf;
        const target = targets[neonStep % targets.length] ?? 480;
        center = Math.max(minCenter, Math.min(maxCenter, target + (rnd() - 0.5) * 8));
        neonStep++;
      } else if (inSnow) {
        // The ice fortress sweeps across the screen, but every step stays
        // close enough to the previous platform for a normal jump.
        const snowCenters = [240, 360, 480, 600, 720, 790, 670, 550, 430, 310, 220, 340];
        const target = snowCenters[snowStep % snowCenters.length] ?? 480;
        center = Math.max(minCenter, Math.min(maxCenter, target + (rnd() - 0.5) * 10));
        snowStep++;
      } else if (inDesert) {
        // Desert follows broad screen-wide terraces rather than stacking near
        // the centre. Adjacent targets remain close enough for a normal jump.
        const desertCenters = [650, 780, 660, 530, 400, 270, 390, 520];
        const target = desertCenters[desertStep % desertCenters.length] ?? 520;
        center = Math.max(minCenter, Math.min(maxCenter, target + (rnd() - 0.5) * 10));
        desertStep++;
      } else {
        // Sweep across the whole course for a few jumps, then turn back.
        // Reverse early at an edge so no platform is clipped or unreachable.
        stepsBeforeTurn--;
        if (center <= minCenter || center >= maxCenter) {
          center = Math.max(minCenter, Math.min(maxCenter, center));
          zigzagDirection = zigzagDirection === 1 ? -1 : 1;
          stepsBeforeTurn = 3 + Math.floor(rnd() * 2);
        } else if (stepsBeforeTurn <= 0) {
          zigzagDirection = zigzagDirection === 1 ? -1 : 1;
          stepsBeforeTurn = 3 + Math.floor(rnd() * 2);
        }
      }
      // Hard cap everywhere: a normal jump can cross ~150px sideways, so no
      // platform may ever be further than that from the previous one.
      if (center - previousCenter > 150) center = previousCenter + 150;
      else if (previousCenter - center > 150) center = previousCenter - 150;
      center = Math.max(minCenter, Math.min(maxCenter, center));
      let x = center - w / 2;
      x = Math.max(30, Math.min(WORLD_WIDTH - 30 - w, x));

      let visual: NonNullable<Platform["visual"]> = meters < 550 ? "openingStone" : "stone";
      if (type === "checkpoint") {
        const nextCheckpoint = level.totalCheckpoints + 1;
        visual = nextCheckpoint === 3 || nextCheckpoint === 4
          ? "desertCheckpoint"
          : nextCheckpoint === 5 || nextCheckpoint === 6
            ? "snowCheckpoint"
            : inPortal || nextCheckpoint === 9 || nextCheckpoint === 10
              ? "portalCheckpoint"
            : inNeon || nextCheckpoint === 7 || nextCheckpoint === 8
              ? "neonCheckpoint"
            : "market";
      } else if (inPortal) {
        // Two tower climbs remain; waterfall islands use regular platforms.
        if (portalStep === 7 || portalStep === 14) visual = "portalGateway";
        else if (portalStep === 4 || portalStep === 11 || portalStep === 18) visual = "portalPlatform";
        // The cropped deck artwork showed no ground under the racer, so every
        // regular landing uses the full waterfall-island PNG.
        else visual = "portalPlatform";
      } else if (inNeon) {
        if (neonMotif === 2 || neonMotif === 9) visual = "neonShort";
        else if (neonMotif === 5 || neonMotif === 12) visual = "neonShortTall";
        else visual = "neonPlatform";
      } else if (inSnow) {
        if (type === "breakable") visual = "snowBreakable";
        else if (snowMotif === 1 || snowMotif === 7) visual = "snowBlockSingle";
        else if (snowMotif === 3 || snowMotif === 9) visual = "snowBlocks";
        // Reuse checkpoint four's tower exactly three times in this chapter.
        else if (snowStep === 6 || snowStep === 15 || snowStep === 24) visual = "snowTower";
        else visual = "snowPlatform";
      } else if (inDesert) {
        const motif = desertStep % 8;
        if (motif === 2 || motif === 7) visual = "desertBoxes";
        else visual = type === "small" || motif === 4 || motif === 6 ? "desertSmall" : "desertPlatform";
      }
      else if (type === "normal" || type === "small") {
        if (step % 6 === 1) visual = meters < 550 ? "openingCrate" : "crate";
        else if (tier > 0 && step % 7 === 3) visual = "barrel";
      }

      // A tall prop that could not fit cleanly last step is retried here.
      if (
        deferredVisual &&
        type !== "checkpoint" &&
        ((deferredVisual === "snowTower" && inSnow) || (deferredVisual === "portalGateway" && inPortal))
      ) {
        visual = deferredVisual;
        deferredVisual = null;
      }
      if (visual === "barrel") w = 108;
      if (visual === "desertBoxes") w = 148;
      if (visual === "desertSmall") w = 96;
      if (visual === "snowBlockSingle") w = 82;
      if (visual === "snowBlocks") w = 154;
      if (visual === "snowTower") w = 82;
      if (visual === "snowBreakable") w = 138;
      if (visual === "neonShort") w = 112;
      if (visual === "neonShortTall") w = 92;
      if (visual === "portalGateway") w = 132;

      // Visual-specific widths are chosen after the route target. Re-apply
      // the jump cap using the final artwork width so edge clamping cannot
      // accidentally widen a neon jump.
      const finalMinCenter = 30 + w / 2;
      const finalMaxCenter = WORLD_WIDTH - 30 - w / 2;
      center = Math.max(previousCenter - 150, Math.min(previousCenter + 150, center));
      center = Math.max(finalMinCenter, Math.min(finalMaxCenter, center));

      // Tall snow props cannot overlap the platform below: their solid body
      // would close the only upward jump lane. Put the complete collision box
      // beside the previous landing, leaving a player-width corridor between
      // the two. Horizontal reach is measured edge-to-edge for these props,
      // rather than centre-to-centre, so the route remains jumpable.
      const previousPlatform = [...platforms].reverse().find((platform) => platform.type !== "hazard");
      if (previousPlatform && (visual === "neonCheckpoint" || visual === "portalCheckpoint")) {
        // Approach checkpoints diagonally instead of stacking the large portal
        // directly overhead. This leaves an obvious open jump lane on every
        // generated route while staying inside normal horizontal reach.
        const checkpointShift = 112;
        const right = Math.min(finalMaxCenter, previousCenter + checkpointShift);
        const left = Math.max(finalMinCenter, previousCenter - checkpointShift);
        center = right - previousCenter >= previousCenter - left ? right : left;
      }
      if (
        previousPlatform &&
        (
          visual === "snowTower" ||
          visual === "snowBlockSingle" ||
          visual === "snowBlocks" ||
           visual === "neonShortTall" ||
           visual === "portalGateway"
        )
      ) {
        const clearance = 36;
        const separation = previousPlatform.w / 2 + w / 2 + clearance;
        const left = Math.max(finalMinCenter, previousCenter - separation);
        const right = Math.min(finalMaxCenter, previousCenter + separation);
        const leftClearance = previousPlatform.x - (left + w / 2);
        const rightClearance = right - w / 2 - (previousPlatform.x + previousPlatform.w);
        center = rightClearance >= leftClearance ? right : left;
      }

      // Artwork overrides changed the width after x was computed — re-anchor
      // the platform on the same center so jump distances stay as planned.
      x = center - w / 2;
      x = Math.max(30, Math.min(WORLD_WIDTH - 30 - w, x));

      // Tall custom artwork needs clear air above and below. Keep the landing
      // rectangle at the artwork's visible top while preserving a safe jump.
      // Tall artwork is solid, so it also needs enough vertical clearance for
      // the player to pass beneath its visible body before landing on top.
      // A normal jump reaches ~100px up, so every vertical gap must stay
      // comfortably below that. Tall artwork gets clearance, never more.
      const visualGap =
        visual === "market"
          ? 92
          : visual === "desertCheckpoint"
            ? 86
            : visual === "desertBoxes"
              ? 88
          : visual === "snowCheckpoint"
            ? 76
            : visual === "neonCheckpoint"
              ? 82
            : visual === "portalCheckpoint"
              ? 88
            : visual === "portalGateway"
                 ? 86
              : visual === "neonShortTall"
                ? 72
            : visual === "snowTower"
              ? 68
              : visual === "snowBlockSingle"
                ? 64
                : visual === "snowBlocks"
                  ? 64
          : visual === "barrel"
            ? 92
            : visual === "openingCrate"
              ? 88
              : 0;
      if (previousPlatform && visualGap > 0 && previousPlatform.y - y < visualGap) {
        y = previousPlatform.y - visualGap;
      }

      const isFinalCheckpoint = type === "checkpoint" && level.totalCheckpoints + 1 === 10;
      const movingReach = type === "moving" ? 48 + tier * 16 + 34 : 0;
      if (isFinalCheckpoint) {
        // The long lower platform is the final approach; the portal platform
        // above it is the victory landing. Move the pair as one unit so the
        // lower deck never sits over the previous platform's jump lane.
        const pair = placeClear(center, y, 360, "portalFinishLower", 0, false, true);
        center = pair.center;
        y = pair.y;
        platforms.push({
          x: center - 180,
          y,
          w: 360,
          h: 30,
          type: "normal",
          tier,
          visual: "portalFinishLower",
        });
        type = "finish";
        visual = "portalFinishUpper";
        w = 260;
        x = center - w / 2;
        y -= 92;
      } else {
        let placed = placeClear(center, y, w, visual, movingReach, lastGapDouble, inPortal);
        if (!placed.ok && type === "checkpoint") {
          w = 156;
          placed = placeClear(center, y, w, visual, movingReach, lastGapDouble, inPortal);
        }
        if (!placed.ok && type !== "checkpoint") {
          // No clean spot for this artwork: use the chapter's regular slab
          // instead of blocking the route. Tall props try again next step.
          if (visual === "snowTower" || visual === "portalGateway") deferredVisual = visual;
          const regular = regularVisual(inDesert, inSnow, inNeon, inPortal, meters);
          if (visual !== regular) {
            visual = regular;
            if (type !== "small") w = 148;
            placed = placeClear(center, y, w, visual, movingReach, lastGapDouble, inPortal);
          }
          if (!placed.ok) {
            w = Math.min(w, 112);
            placed = placeClear(center, y, w, visual, movingReach, lastGapDouble, inPortal);
          }
        }
        center = placed.center;
        y = placed.y;
        x = center - w / 2;
      }
      const p: Platform = { x, y, w, h: isFinalCheckpoint ? 34 : 24, type, tier, visual };
      if (type === "checkpoint") {
        p.cpIndex = ++level.totalCheckpoints;
        p.flagWave = rnd() * Math.PI * 2;
      } else if (isFinalCheckpoint) {
        p.cpIndex = ++level.totalCheckpoints;
        p.flagWave = rnd() * Math.PI * 2;
        level.finishY = y;
        finalGenerated = true;
      }
      if (type === "moving") {
        p.baseX = x;
        p.range = 48 + tier * 16 + rnd() * 34;
        p.speed = 0.45 + rnd() * 0.35 + tier * 0.08;
        p.phase = rnd() * Math.PI * 2;
        p.dx = 0;
      }
      if (type === "breakable") p.cracked = 0;

      platforms.push(p);
      // Lasers are separate, non-solid hazards attached to wide platforms.
      // They are spaced several jumps apart; the middle group moves across
      // part of its platform while always leaving a safe landing edge.
      if (
        inNeon &&
        type !== "checkpoint" &&
        visual === "neonPlatform" &&
        (neonMotif === 3 || neonMotif === 8 || neonMotif === 13)
      ) {
        // Keep the fixed laser after the moving group compact enough to leave
        // a full player-width landing/takeoff lane on the wide platform.
        const laserW = neonMotif === 13 ? 68 : 76;
        const onRight = neonStep % 2 === 0;
        const laserX = onRight ? x + w - laserW - 10 : x + 10;
        const movingLaser = neonMotif === 8;
        const laser: Platform = {
          x: laserX,
          y: y - 25,
          w: laserW,
          h: 18,
          type: "hazard",
          tier,
          visual: "neonLaser",
        };
        if (movingLaser) {
          laser.baseX = laserX;
          laser.range = Math.min(28, Math.max(12, (w - laserW) / 2 - 12));
          laser.speed = 1.15;
          laser.phase = onRight ? Math.PI : 0;
        }
        platforms.push(laser);
      }
      previousCenter = x + w / 2;
      step++;
      // Every generated step remains reachable with a normal jump.
      // Never put the extra-high gap immediately before the fixed laser at
      // motif 13. That combination looked possible but removed its safe
      // landing lane. The laser itself remains a deliberate double-jump test.
      const doubleJumpGap = inNeon && (neonMotif === 6 || neonMotif === 11);
       const portalDoubleJumpGap = inPortal && (
         portalMotif === 3 || portalMotif === 7 || portalMotif === 11 || portalMotif === 15
       );
      // Every landing has clear air around it. Most jumps are near the upper
      // edge of single-jump reach; two marked beats require a double jump.
       const portalTerraceGap = portalMotif % 4 === 0 ? 96 : 90 + rnd() * 7;
      const randomGap = inDesert
        ? 76 + rnd() * 8
        : inSnow
          ? 58 + rnd() * 6
          : inNeon
            // Medium-hard spacing: visibly more air than earlier chapters,
            // with occasional clearly spaced jumps requiring the second jump.
            ? doubleJumpGap ? 116 : 78 + rnd() * 8
          : inPortal
             ? portalDoubleJumpGap ? 116 : portalTerraceGap
        : band.gap[0] + rnd() * (band.gap[1] - band.gap[0]);
      lastGapDouble = doubleJumpGap || portalDoubleJumpGap;
      if (!finalGenerated) y -= Math.max(randomGap, visualGap);
    }
  };

  level.extend(groundY - 2000);
  return level;
}

function regularVisual(
  inDesert: boolean,
  inSnow: boolean,
  inNeon: boolean,
  inPortal: boolean,
  meters: number,
): NonNullable<Platform["visual"]> {
  if (inPortal) return "portalPlatform";
  if (inNeon) return "neonPlatform";
  if (inSnow) return "snowPlatform";
  if (inDesert) return "desertPlatform";
  return meters < 550 ? "openingStone" : "stone";
}

/** Drops platforms far below the player/respawn point to keep things fast. */
export function pruneLevel(level: Level, belowY: number) {
  if (level.platforms.length < 120) return;
  // Keep the original array reference: the endless generator appends to this
  // same array. Replacing it would make newly generated platforms invisible.
  for (let i = level.platforms.length - 1; i >= 0; i--) {
    const platform = level.platforms[i];
    if (platform && platform.type !== "ground" && platform.y >= belowY) {
      level.platforms.splice(i, 1);
    }
  }
}

export function metersFor(level: Level, y: number): number {
  return Math.max(0, (level.groundY - (y + 34)) / PIXELS_PER_METER);
}
