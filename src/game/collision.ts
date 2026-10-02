import type { Platform, PlayerState } from "./types";

export interface CollisionResult {
  landedOn: Platform | null;
  bonked: boolean;
  bounced: Platform | null;
}

function solid(p: Platform): boolean {
  return !p.gone && p.type !== "hazard";
}

export function collisionBox(p: Platform) {
  if (p.visual === "barrel") {
    const visibleWidth = Math.min(92, p.w - 16);
    return { x: p.x + (p.w - visibleWidth) / 2, y: p.y, w: visibleWidth, h: 80 };
  }
  if (p.visual === "openingCrate") {
    return { x: p.x, y: p.y, w: p.w, h: p.w * (398 / 1432) };
  }
  if (p.visual === "desertBoxes") {
    return { x: p.x, y: p.y, w: p.w, h: p.w * (608 / 1785) };
  }
  if (p.visual === "desertCheckpoint") {
    return { x: p.x, y: p.y, w: p.w, h: Math.max(p.h, p.w * (280 / 1160)) };
  }
  if (p.visual === "desertPlatform") {
    return { x: p.x, y: p.y, w: p.w, h: Math.max(p.h, p.w * (223 / 1625)) };
  }
  if (p.visual === "desertSmall") {
    return { x: p.x, y: p.y, w: p.w, h: Math.max(p.h, p.w * (378 / 1216)) };
  }
  if (p.visual === "snowPlatform" || p.visual === "snowBreakable") {
    return { x: p.x, y: p.y, w: p.w, h: Math.max(p.h, p.w * (286 / 1690)) };
  }
  if (p.visual === "snowBlockSingle") {
    return { x: p.x, y: p.y, w: p.w, h: Math.max(p.h, p.w * (438 / 510)) };
  }
  if (p.visual === "snowBlocks") {
    return { x: p.x, y: p.y, w: p.w, h: Math.max(p.h, p.w * (431 / 1529)) };
  }
  if (p.visual === "snowTower") {
    return { x: p.x, y: p.y, w: p.w, h: Math.max(p.h, p.w * (955 / 804)) };
  }
  if (p.visual === "snowCheckpoint") {
    return { x: p.x, y: p.y, w: p.w, h: Math.max(p.h, p.w * (276 / 1183)) };
  }
  if (p.visual === "neonPlatform") {
    return { x: p.x, y: p.y, w: p.w, h: Math.max(p.h, p.w * (323 / 1678)) };
  }
  if (p.visual === "neonShort") {
    return { x: p.x, y: p.y, w: p.w, h: Math.max(p.h, p.w * (400 / 1344)) };
  }
  if (p.visual === "neonShortTall") {
    return { x: p.x, y: p.y, w: p.w, h: Math.max(p.h, p.w * (757 / 1007)) };
  }
  if (p.visual === "neonCheckpoint") {
    // Only the glowing top deck is structural. The machinery hanging below
    // stays visible but must not form a ceiling that blocks the approach jump.
    return { x: p.x, y: p.y, w: p.w, h: Math.max(p.h, 30) };
  }
  if (p.visual === "portalPlatform") {
    return { x: p.x, y: p.y, w: p.w, h: Math.max(p.h, p.w * (368 / 1620)) };
  }
  if (p.visual === "portalCheckpoint") {
    // The portal arch is visual; only its broad stone-and-grass deck is solid.
    return { x: p.x, y: p.y, w: p.w, h: Math.max(p.h, 30) };
  }
  if (p.visual === "portalFinishProp") {
    return { x: p.x, y: p.y, w: p.w, h: Math.max(p.h, 30) };
  }
  if (
    p.visual === "portalDeck" ||
    p.visual === "portalFinal" ||
    p.visual === "portalFinishLower" ||
    p.visual === "portalFinishUpper"
  ) {
    // Uploaded portal artwork is landable on its aligned top edge; decorative
    // transparent pixels and the tall visual body never enlarge the physics box.
    return { x: p.x, y: p.y, w: p.w, h: Math.max(p.h, 30) };
  }
  if (p.visual === "portalGateway") {
    // The full tower below its roof is solid; its roof is aligned to p.y.
    return { x: p.x, y: p.y, w: p.w, h: Math.max(p.h, p.w * (1106 / 726)) };
  }
  if (p.visual === "portalIsland") {
    // The waterfall and floating rock hang below the grass landing and stay
    // decorative; racers land only on the clearly visible upper grass edge.
    return { x: p.x, y: p.y, w: p.w, h: Math.max(p.h, 30) };
  }
  if (p.visual === "portalMonument") {
    return { x: p.x, y: p.y, w: p.w, h: Math.max(p.h, p.w * (1106 / 726)) };
  }
  return { x: p.x, y: p.y, w: p.w, h: p.h };
}


export function resolveCollisions(
  player: PlayerState,
  platforms: Platform[],
  dt: number,
): CollisionResult {
  const res: CollisionResult = { landedOn: null, bonked: false, bounced: null };

  // Sweep horizontal edges so solid platforms cannot be crossed at low FPS.
  const previousX = player.x;
  player.x += player.vx * dt;
  for (const p of platforms) {
    if (!solid(p)) continue;
    const box = collisionBox(p);
    const overlapsY = player.y < box.y + box.h && player.y + player.h > box.y;
    if (!overlapsY) continue;
    const previousRight = previousX + player.w;
    const boxRight = box.x + box.w;
    if (player.vx > 0 && previousRight <= box.x + 1 && player.x + player.w >= box.x) {
      player.x = box.x - player.w;
      player.vx = 0;
    } else if (player.vx < 0 && previousX >= boxRight - 1 && player.x <= boxRight) {
      player.x = boxRight;
      player.vx = 0;
    }
  }

  // Resolve the nearest crossed top or underside instead of passing through.
  const wasOnGround = player.onGround;
  player.onGround = false;
  const previousBottom = player.y + player.h;
  const previousTop = player.y;
  player.y += player.vy * dt;
  let landing: { platform: Platform; y: number } | null = null;
  let ceiling: number | null = null;
  for (const p of platforms) {
    if (!solid(p)) continue;
    const box = collisionBox(p);
    const overlapsX = player.x < box.x + box.w && player.x + player.w > box.x;
    if (!overlapsX) continue;
    const crossedTop = previousBottom <= box.y + 3 && player.y + player.h >= box.y;
    if (player.vy > 0 && crossedTop && (!landing || box.y < landing.y)) {
      landing = { platform: p, y: box.y };
      continue;
    }
    const boxBottom = box.y + box.h;
    const crossedBottom = previousTop >= boxBottom - 1 && player.y <= boxBottom;
    if (player.vy < 0 && crossedBottom && (ceiling === null || boxBottom > ceiling)) {
      ceiling = boxBottom;
    }
  }

  if (landing) {
    player.y = landing.y - player.h;
    if (landing.platform.type === "bounce") res.bounced = landing.platform;
    else {
      player.vy = 0;
      player.onGround = true;
      res.landedOn = landing.platform;
    }
  } else if (ceiling !== null) {
    player.y = ceiling;
    player.vy = 0;
    res.bonked = true;
  }

  if (!wasOnGround && player.onGround) player.landTimer = 0.18;
  return res;
}
