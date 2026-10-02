import { supabase } from "@/integrations/supabase/client";
import type { CharacterLook } from "@/game/types";

export interface Room {
  id: string;
  code: string;
  host_id: string;
  status: "lobby" | "playing" | "finished";
  course_seed: number;
  max_players: number;
  started_at: string | null;
  winner_id: string | null;
  winner_name: string | null;
  winner_time_ms: number | null;
}

export interface RoomPlayer {
  user_id: string;
  player_name: string;
  character: CharacterLook;
  finish_time_ms: number | null;
}

export interface GhostPos {
  uid: string;
  name: string;
  look: CharacterLook;
  x: number;
  y: number;
  f: number;
  m: number;
  vx: number;
  vy: number;
  seq: number;
  sentAt: number;
  at: number;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const rpc = (fn: string, args: Record<string, unknown>) => (supabase.rpc as any)(fn, args);

function friendly(err: { message?: string } | null): Error {
  const m = err?.message ?? "Something went wrong";
  return new Error(m);
}

export async function createRoom(name: string, look: CharacterLook): Promise<Room> {
  const { data, error } = await rpc("create_room", { _name: name, _character: look });
  if (error) throw friendly(error);
  return data as Room;
}

export async function joinRoom(code: string, name: string, look: CharacterLook): Promise<Room> {
  const { data, error } = await rpc("join_room", { _code: code, _name: name, _character: look });
  if (error) throw friendly(error);
  return data as Room;
}

export async function startRoom(roomId: string) {
  const { error } = await rpc("start_room", { _room: roomId });
  if (error) throw friendly(error);
}

export async function finishRoom(roomId: string, timeMs: number): Promise<Room> {
  const { data, error } = await rpc("finish_room", { _room: roomId, _time_ms: Math.round(timeMs) });
  if (error) throw friendly(error);
  return data as Room;
}

export async function leaveRoom(roomId: string, userId: string) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase.from as any)("room_players").delete().eq("room_id", roomId).eq("user_id", userId);
}

export async function loadRoom(roomId: string): Promise<Room | null> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (supabase.from as any)("game_rooms").select("*").eq("id", roomId).maybeSingle();
  return (data as Room) ?? null;
}

export async function loadPlayers(roomId: string): Promise<RoomPlayer[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (supabase.from as any)("room_players")
    .select("user_id, player_name, character, finish_time_ms")
    .eq("room_id", roomId)
    .order("joined_at", { ascending: true });
  return (data as RoomPlayer[]) ?? [];
}

/** Subscribes to room + player changes. Returns an unsubscribe function. */
export function watchRoom(
  roomId: string,
  onRoom: (r: Room) => void,
  onPlayers: (p: RoomPlayer[]) => void,
) {
  let lastRoom = "";
  let lastPlayers = "";
  let timer = 0;
  const emitRoom = (r: Room) => {
    const k = JSON.stringify(r);
    if (k !== lastRoom) { lastRoom = k; onRoom(r); }
  };
  // debounce bursts of join/leave events into one fetch; skip identical results
  const refreshPlayers = () => {
    window.clearTimeout(timer);
    timer = window.setTimeout(() => void loadPlayers(roomId).then((p) => {
      const k = JSON.stringify(p);
      if (k !== lastPlayers) { lastPlayers = k; onPlayers(p); }
    }), 250);
  };
  const ch = supabase
    .channel(`room-db:${roomId}:${Math.random().toString(36).slice(2)}`)
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "game_rooms", filter: `id=eq.${roomId}` },
      (payload) => payload.new && emitRoom(payload.new as Room),
    )
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "room_players", filter: `room_id=eq.${roomId}` },
      refreshPlayers,
    )
    .subscribe();
  // polling fallback in case realtime drops
  const poll = window.setInterval(() => {
    void loadRoom(roomId).then((r) => r && emitRoom(r));
    refreshPlayers();
  }, 4000);
  return () => {
    window.clearInterval(poll);
    window.clearTimeout(timer);
    void supabase.removeChannel(ch);
  };
}

/** Live position channel for racers in the same room. */
export function raceChannel(roomId: string, onPos: (p: GhostPos) => void) {
  const ch = supabase.channel(`race:${roomId}`, { config: { broadcast: { self: false } } });
  const newest = new Map<string, number>();
  ch.on("broadcast", { event: "pos" }, ({ payload }) => {
    const raw = payload as Partial<GhostPos>;
    if (!raw.uid || typeof raw.x !== "number" || typeof raw.y !== "number") return;
    const incoming: GhostPos = {
      uid: raw.uid,
      name: raw.name ?? "Climber",
      look: raw.look ?? "normal",
      x: raw.x,
      y: raw.y,
      f: raw.f ?? 1,
      m: raw.m ?? 0,
      vx: Number.isFinite(raw.vx) ? (raw.vx ?? 0) : 0,
      vy: Number.isFinite(raw.vy) ? (raw.vy ?? 0) : 0,
      seq: raw.seq ?? Date.now(),
      sentAt: raw.sentAt ?? Date.now(),
      at: Date.now(),
    };
    if ((newest.get(incoming.uid) ?? -1) >= incoming.seq) return;
    newest.set(incoming.uid, incoming.seq);
    onPos(incoming);
  });
  ch.subscribe();
  return {
    send: (p: Omit<GhostPos, "at">) =>
      void ch.send({ type: "broadcast", event: "pos", payload: p }),
    close: () => void supabase.removeChannel(ch),
  };
}
