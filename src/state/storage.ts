import type { CharacterSkin, Difficulty } from "@/game/types";
import { DEFAULT_SKIN } from "@/game/skins";
import type { QuestionCategory } from "@/questions/questionBank";
import { CATEGORIES } from "@/questions/questionBank";

const SAVE_KEY = "skyclimb.save.v1";
const SETTINGS_KEY = "skyclimb.settings.v1";
const LEADERBOARD_KEY = "skyclimb.leaderboard.v1";

export interface SaveData {
  playerName: string;
  highScore: number;
  bestHeight: number;
  bestAccuracy: number;
  bestStreak: number;
  completedLevels: number[];
  skin: CharacterSkin;
}

export interface GameSettings {
  sound: boolean;
  music: boolean;
  sfx: boolean;
  difficulty: Difficulty;
  controls: "keyboard" | "touch";
  categories: QuestionCategory[];
}

export interface LeaderboardEntry {
  userId?: string;
  name: string;
  score: number;
  height: number;
  accuracy: number;
  timeMs: number;
  demo?: boolean;
}

export const DEFAULT_SAVE: SaveData = {
  playerName: "",
  highScore: 0,
  bestHeight: 0,
  bestAccuracy: 0,
  bestStreak: 0,
  completedLevels: [],
  skin: DEFAULT_SKIN,
};

export const DEFAULT_SETTINGS: GameSettings = {
  sound: true,
  music: true,
  sfx: true,
  difficulty: "normal",
  controls: "keyboard",
  categories: [...CATEGORIES],
};

const DEMO_BOARD: LeaderboardEntry[] = [
  { name: "Alex", score: 12450, height: 1000, accuracy: 91, timeMs: 402_000, demo: true },
  { name: "Sam", score: 11920, height: 1000, accuracy: 88, timeMs: 438_000, demo: true },
  { name: "Ryan", score: 10880, height: 940, accuracy: 84, timeMs: 465_000, demo: true },
  { name: "Jordan", score: 9750, height: 880, accuracy: 79, timeMs: 501_000, demo: true },
  { name: "Mina", score: 8430, height: 810, accuracy: 76, timeMs: 522_000, demo: true },
];

function read<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return { ...(fallback as object), ...(JSON.parse(raw) as object) } as T;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage unavailable — play on without saving */
  }
}

export const loadSave = () => {
  const stored = read<SaveData>(SAVE_KEY, DEFAULT_SAVE);
  const validLooks = new Set(["normal", "medieval", "fire", "desert"]);
  return validLooks.has(stored.skin?.look) ? stored : { ...stored, skin: DEFAULT_SKIN };
};
export const saveSave = (s: SaveData) => write(SAVE_KEY, s);

export const loadSettings = () => read<GameSettings>(SETTINGS_KEY, DEFAULT_SETTINGS);
export const saveSettings = (s: GameSettings) => write(SETTINGS_KEY, s);

export function loadLeaderboard(): LeaderboardEntry[] {
  if (typeof window === "undefined") return DEMO_BOARD;
  try {
    const raw = window.localStorage.getItem(LEADERBOARD_KEY);
    const stored = raw ? (JSON.parse(raw) as LeaderboardEntry[]) : [];
    return [...DEMO_BOARD, ...stored].sort((a, b) => a.timeMs - b.timeMs || b.score - a.score).slice(0, 20);
  } catch {
    return DEMO_BOARD;
  }
}

export function submitScore(entry: LeaderboardEntry): LeaderboardEntry[] {
  if (typeof window === "undefined") return loadLeaderboard();
  try {
    const raw = window.localStorage.getItem(LEADERBOARD_KEY);
    const stored = raw ? (JSON.parse(raw) as LeaderboardEntry[]) : [];
    stored.push(entry);
    write(LEADERBOARD_KEY, stored.sort((a, b) => a.timeMs - b.timeMs || b.score - a.score).slice(0, 50));
  } catch {
    /* ignore */
  }
  return loadLeaderboard();
}

export function resetProgress() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(SAVE_KEY);
    window.localStorage.removeItem(LEADERBOARD_KEY);
  } catch {
    /* ignore */
  }
}

export function formatTime(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}
