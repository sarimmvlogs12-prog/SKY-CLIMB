import { supabase } from "@/integrations/supabase/client";
import type { CharacterLook } from "@/game/types";
import type { LeaderboardEntry, SaveData } from "./storage";

export async function loadCloudProfile(userId: string): Promise<Partial<SaveData> | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("display_name, selected_character, high_score, highest_height, best_accuracy, best_streak")
    .eq("id", userId)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return {
    playerName: data.display_name,
    skin: { look: data.selected_character as CharacterLook },
    highScore: data.high_score,
    bestHeight: data.highest_height,
    bestAccuracy: data.best_accuracy,
    bestStreak: data.best_streak,
  };
}

export async function saveCloudProfile(userId: string, save: SaveData) {
  const { error } = await supabase.from("profiles").upsert({
    id: userId,
    display_name: save.playerName || "Climber",
    selected_character: save.skin.look,
    high_score: save.highScore,
    highest_height: save.bestHeight,
    best_accuracy: save.bestAccuracy,
    best_streak: save.bestStreak,
  });
  if (error) throw error;
}

export async function loadCloudLeaderboard(): Promise<LeaderboardEntry[]> {
  const { data, error } = await supabase
    .from("game_results")
    .select("user_id, player_name, completion_time_ms, score, accuracy")
    .order("completion_time_ms", { ascending: true })
    .order("score", { ascending: false })
    .limit(300);
  if (error) throw error;
  // keep each player's fastest run only, so ranks shift as records are beaten
  const seen = new Set<string>();
  const best = (data ?? []).filter((r) => (seen.has(r.user_id) ? false : (seen.add(r.user_id), true)));
  return best.slice(0, 50).map((row) => ({
    userId: row.user_id,
    name: row.player_name,
    score: row.score,
    height: 2110,
    accuracy: row.accuracy,
    timeMs: row.completion_time_ms,
  }));
}

export async function submitCloudResult(
  userId: string,
  entry: LeaderboardEntry & { bestStreak: number },
) {
  const { error } = await supabase.from("game_results").insert({
    user_id: userId,
    player_name: entry.name,
    completion_time_ms: Math.max(1, Math.round(entry.timeMs)),
    score: entry.score,
    accuracy: entry.accuracy,
    best_streak: entry.bestStreak,
  });
  if (error) throw error;
}