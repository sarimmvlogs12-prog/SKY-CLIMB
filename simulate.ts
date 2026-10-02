const WORLD_WIDTH = 960;
const PIXELS_PER_METER = 4;
const DESERT_START_M = 540;
const DESERT_END_M = 1000;
const SNOW_START_M = 1000;
const SNOW_END_M = 1443;
const NEON_START_M = 1436;
const NEON_END_M = 1940;

const COURSE_BANDS = [
  { startMeters: 0, gap: [78, 84], width: [158, 184], maxShift: 112, moving: 0, small: 0, bounce: 0.06, ice: 0, breakable: 0 },
  { startMeters: 180, gap: [78, 86], width: [142, 170], maxShift: 132, moving: 0.08, small: 0.05, bounce: 0.07, ice: 0, breakable: 0 },
  { startMeters: 450, gap: [72, 82], width: [124, 154], maxShift: 150, moving: 0.11, small: 0.08, bounce: 0.07, ice: 0.07, breakable: 0 },
  { startMeters: 800, gap: [76, 88], width: [112, 142], maxShift: 166, moving: 0.14, small: 0.11, bounce: 0.07, ice: 0.1, breakable: 0 },
];

function bandFor(meters) {
  let tier = 0;
  for (let i = 1; i < COURSE_BANDS.length; i++) {
    if (meters >= COURSE_BANDS[i].startMeters) tier = i;
  }
  return { band: COURSE_BANDS[tier], tier };
}

function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const index = 0;
const rnd = mulberry32(1337 + index * 7919);
const groundY = 4300 - 70;
const platforms = [];

platforms.push({ x: 0, y: groundY, w: WORLD_WIDTH, h: 70, type: "ground" });
platforms.push({ x: 270, y: groundY - 96, w: 180, h: 26, type: "normal" });
platforms.push({ x: 423, y: groundY - 180, w: 174, h: 26, type: "normal" });

let y = groundY - 264;
let previousCenter = 517;
let step = 0;
let zigzagDirection = 1;
let stepsBeforeTurn = 2;
let desertStep = 0;
let snowStep = 0;
let neonStep = 0;
let totalCheckpoints = 0;

for (let i = 0; i < 200; i++) {
  const climbed = groundY - y;
  const meters = climbed / PIXELS_PER_METER;
  const displayedMeters = (climbed - 34) / PIXELS_PER_METER;
  const { band, tier } = bandFor(meters);
  const inDesert = displayedMeters >= DESERT_START_M && displayedMeters < DESERT_END_M;
  const inSnow = displayedMeters >= SNOW_START_M && displayedMeters < SNOW_END_M;
  const inNeon = displayedMeters >= NEON_START_M && displayedMeters < NEON_END_M;
  const snowMotif = snowStep % 12;
  const neonMotif = neonStep % 14;

  let type = "normal";
  const roll = rnd();
  let cursor = band.moving;
  if (step > 0 && step % 10 === 0) type = "checkpoint";
  else if (meters < 550 && step >= 4 && step % 7 === 4) type = "breakable";
  else if (inSnow && (snowMotif === 4 || snowMotif === 10)) type = "breakable";
  else if (inSnow && (snowMotif === 2 || snowMotif === 8)) type = "small";
  else if (inSnow && roll < 0.08) type = "ice";
  else if (inSnow && roll < 0.13) type = "moving";
  else if (inDesert && roll < 0.14) type = "small";
  else if (inDesert && roll < 0.19) type = "bounce";
  else if (!inDesert && !inSnow && !inNeon && roll < cursor) type = "moving";
  else if (!inDesert && !inSnow && !inNeon && roll < (cursor += band.small)) type = "small";
  else if (!inDesert && !inSnow && !inNeon && roll < (cursor += band.bounce)) type = "bounce";
  else if (!inDesert && !inSnow && !inNeon && roll < (cursor += band.ice)) type = "ice";
  else if (meters < 550 && roll < cursor + band.breakable) type = "breakable";

  let w = inDesert ? 150 + rnd() * 30 : inSnow ? 142 + rnd() * 24 : inNeon ? 152 + rnd() * 24 : band.width[0] + rnd() * (band.width[1] - band.width[0]);
  if (type === "small") w = tier < 3 ? 88 : 78;
  if (type === "checkpoint") w = inSnow ? 190 : inNeon ? 194 : 184;
  if (type === "bounce") w = 124;
  if (type === "breakable") w = Math.min(w, 150);

  const minCenter = 30 + w / 2;
  const maxCenter = WORLD_WIDTH - 30 - w / 2;
  const minShift = inDesert ? 68 : inSnow ? 80 : inNeon ? 76 : 72 + tier * 7;
  const maxShift = inDesert ? 124 : inSnow ? 132 : inNeon ? 138 : band.maxShift;
  const shift = minShift + rnd() * Math.max(0, maxShift - minShift);
  let center = previousCenter + zigzagDirection * shift;

  if (inNeon) {
    const firstHalf = [250, 390, 530, 670, 550, 410, 270, 420, 570, 710];
    const secondHalf = [710, 560, 410, 260, 390, 540, 690, 550, 400, 250];
    const targets = displayedMeters < 1690 ? firstHalf : secondHalf;
    center = (targets[neonStep % targets.length] || 480) + (rnd() - 0.5) * 8;
    neonStep++;
  } else if (inSnow) {
    const snowCenters = [240, 360, 480, 600, 720, 790, 670, 550, 430, 310, 220, 340];
    center = (snowCenters[snowStep % snowCenters.length] || 480) + (rnd() - 0.5) * 10;
    snowStep++;
  } else if (inDesert) {
    const desertCenters = [650, 780, 660, 530, 400, 270, 390, 520];
    center = (desertCenters[desertStep % desertCenters.length] || 520) + (rnd() - 0.5) * 10;
    desertStep++;
  } else {
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

  if (center - previousCenter > 150) center = previousCenter + 150;
  else if (previousCenter - center > 150) center = previousCenter - 150;
  center = Math.max(minCenter, Math.min(maxCenter, center));
  let x = center - w / 2;

  let visual = meters < 550 ? "openingStone" : "stone";
  if (type === "checkpoint") {
    const nextCheckpoint = totalCheckpoints + 1;
    visual = (nextCheckpoint === 3 || nextCheckpoint === 4) ? "desertCheckpoint" : (nextCheckpoint === 5 || nextCheckpoint === 6) ? "snowCheckpoint" : (inNeon || nextCheckpoint === 7 || nextCheckpoint === 8) ? "neonCheckpoint" : "market";
  } else if (inNeon) {
    visual = (neonMotif === 2 || neonMotif === 9) ? "neonShort" : (neonMotif === 5 || neonMotif === 12) ? "neonShortTall" : "neonPlatform";
  } else if (inSnow) {
    visual = type === "breakable" ? "snowBreakable" : (snowMotif === 1 || snowMotif === 7) ? "snowBlockSingle" : (snowMotif === 3 || snowMotif === 9) ? "snowBlocks" : (snowMotif === 5) ? "snowTower" : "snowPlatform";
  } else if (inDesert) {
    const motif = desertStep % 8;
    visual = (motif === 2 || motif === 7) ? "desertBoxes" : (type === "small" || motif === 4 || motif === 6) ? "desertSmall" : "desertPlatform";
  } else if (type === "normal" || type === "small") {
    if (step % 6 === 1) visual = meters < 550 ? "openingCrate" : "crate";
    else if (tier > 0 && step % 7 === 3) visual = "barrel";
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

  const finalMinCenter = 30 + w / 2;
  const finalMaxCenter = WORLD_WIDTH - 30 - w / 2;
  center = Math.max(previousCenter - 150, Math.min(previousCenter + 150, center));
  center = Math.max(finalMinCenter, Math.min(finalMaxCenter, center));

  const previousPlatform = platforms[platforms.length - 1];
  if (previousPlatform && visual === "neonCheckpoint") {
    const checkpointShift = 112;
    const right = Math.min(finalMaxCenter, previousCenter + checkpointShift);
    const left = Math.max(finalMinCenter, previousCenter - checkpointShift);
    center = right - previousCenter >= previousCenter - left ? right : left;
  }
  if (previousPlatform && (visual === "snowTower" || visual === "snowBlockSingle" || visual === "snowBlocks" || visual === "neonShortTall")) {
    const clearance = 48;
    const separation = previousPlatform.w / 2 + w / 2 + clearance;
    const left = Math.max(finalMinCenter, previousCenter - separation);
    const right = Math.min(finalMaxCenter, previousCenter + separation);
    const leftClearance = previousPlatform.x - (left + w / 2);
    const rightClearance = right - w / 2 - (previousPlatform.x + previousPlatform.w);
    center = rightClearance >= leftClearance ? right : left;
  }

  x = center - w / 2;
  x = Math.max(30, Math.min(WORLD_WIDTH - 30 - w, x));

  const visualGap = visual === "market" ? 92 : visual === "desertCheckpoint" ? 86 : visual === "desertBoxes" ? 88 : visual === "snowCheckpoint" ? 76 : visual === "neonCheckpoint" ? 82 : visual === "neonShortTall" ? 72 : visual === "snowTower" ? 68 : visual === "snowBlockSingle" ? 64 : visual === "snowBlocks" ? 64 : visual === "barrel" ? 92 : visual === "openingCrate" ? 88 : 0;
  if (previousPlatform && visualGap > 0 && previousPlatform.y - y < visualGap) {
    y = previousPlatform.y - visualGap;
  }

  const p = { x, y, w, h: 24, type, tier, visual };
  if (type === "checkpoint") {
    p.cpIndex = ++totalCheckpoints;
    if (p.cpIndex >= 8 && p.cpIndex <= 10) {
      console.log(`Checkpoint ${p.cpIndex}: step=${step}, y=${p.y}, meters=${meters.toFixed(2)}, displayedMeters=${displayedMeters.toFixed(2)}`);
    }
  }

  platforms.push(p);
  previousCenter = x + w / 2;
  step++;
  const doubleJumpGap = inNeon && (neonMotif === 6 || neonMotif === 11);
  const randomGap = inDesert ? 76 + rnd() * 8 : inSnow ? 58 + rnd() * 6 : inNeon ? (doubleJumpGap ? 116 : 78 + rnd() * 8) : band.gap[0] + rnd() * (band.gap[1] - band.gap[0]);
  y -= Math.max(randomGap, visualGap);
}
