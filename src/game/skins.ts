import normalAsset from "@/assets/sky-climb-character-normal.png.asset.json";
import medievalAsset from "@/assets/sky-climb-character-medieval.png.asset.json";
import fireAsset from "@/assets/sky-climb-character-fire.png.asset.json";
import desertAsset from "@/assets/sky-climb-character-desert.png.asset.json";
import type { CharacterLook, CharacterSkin } from "./types";

export interface CharacterChoice {
  id: CharacterLook;
  name: string;
  src: string;
  crop: { x: number; y: number; w: number; h: number };
}

export const CHARACTERS: CharacterChoice[] = [
  { id: "normal", name: "Normal", src: normalAsset.url, crop: { x: 211, y: 163, w: 1171, h: 1180 } },
  { id: "medieval", name: "Medieval", src: medievalAsset.url, crop: { x: 337, y: 16, w: 1246, h: 1246 } },
  { id: "fire", name: "Fire", src: fireAsset.url, crop: { x: 322, y: 64, w: 1393, h: 1159 } },
  { id: "desert", name: "Desert", src: desertAsset.url, crop: { x: 346, y: 25, w: 1372, h: 1219 } },
];

export const DEFAULT_SKIN: CharacterSkin = { look: "normal" };

export function characterChoice(look: CharacterLook): CharacterChoice {
  return CHARACTERS.find((character) => character.id === look) ?? CHARACTERS[0] as CharacterChoice;
}
