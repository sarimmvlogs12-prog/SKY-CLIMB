import { useState } from "react";
import { SkyBackdrop } from "./SkyBackdrop";
import { characterChoice } from "@/game/skins";
import type { Room, RoomPlayer } from "@/state/multiplayer";

export function MultiplayerLobby({
  room,
  players,
  userId,
  busy,
  error,
  onHost,
  onJoin,
  onStart,
  onLeave,
}: {
  room: Room | null;
  players: RoomPlayer[];
  userId: string;
  busy: boolean;
  error: string | null;
  onHost: () => void;
  onJoin: (code: string) => void;
  onStart: () => void;
  onLeave: () => void;
}) {
  const [code, setCode] = useState("");
  const [copied, setCopied] = useState(false);
  const isHost = room?.host_id === userId;

  return (
    <div className="relative flex h-full w-full items-center justify-center overflow-y-auto">
      <SkyBackdrop />
      <div className="animate-pop-in relative z-10 w-full max-w-md px-4 py-6">
        <div className="game-panel p-5 text-center">
          <h2 className="font-display text-3xl font-extrabold text-ink">MULTIPLAYER</h2>
          <p className="mt-1 text-sm font-semibold text-ink-soft">
            First to reach the final summit wins · up to 10 players
          </p>

          {!room ? (
            <div className="mt-5 grid gap-3">
              <button disabled={busy} onClick={onHost} className="btn-pop bg-flag px-6 py-3 text-xl text-ink disabled:opacity-60">
                HOST A RACE
              </button>
              <div className="flex items-center gap-2 text-xs font-bold text-ink-soft">
                <span className="h-px flex-1 bg-ink/20" /> OR JOIN WITH CODE <span className="h-px flex-1 bg-ink/20" />
              </div>
              <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-2">
                <input
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6))}
                  onKeyDown={(e) => e.key === "Enter" && code.length === 6 && onJoin(code)}
                  placeholder="ABC123"
                  inputMode="text"
                  autoCapitalize="characters"
                  className="min-w-0 rounded-xl border-[3px] border-ink bg-sky-low/60 px-3 py-2 text-center font-display text-2xl tracking-[0.3em] text-ink outline-none focus:bg-panel"
                />
                <button
                  disabled={busy || code.length !== 6}
                  onClick={() => onJoin(code)}
                  className="btn-pop bg-energy px-5 py-2 text-lg text-ink disabled:opacity-60"
                >
                  JOIN
                </button>
              </div>
            </div>
          ) : (
            <div className="mt-4">
              <p className="text-xs font-bold uppercase text-ink-soft">Room code — share with friends</p>
              <button
                onClick={() => {
                  void navigator.clipboard?.writeText(room.code);
                  setCopied(true);
                  window.setTimeout(() => setCopied(false), 1200);
                }}
                className="btn-pop mt-1 w-full bg-sky-low px-4 py-3 font-display text-4xl tracking-[0.35em] text-ink"
              >
                {room.code}
              </button>
              <p className="mt-1 h-4 text-xs font-bold text-flag-deep">{copied ? "Copied!" : "Tap to copy"}</p>

              <div className="mt-3 flex items-center justify-between font-display text-sm font-bold text-ink">
                <span>Players</span>
                <span>{players.length}/{room.max_players}</span>
              </div>
              <ul className="mt-2 grid max-h-56 gap-2 overflow-y-auto">
                {players.map((p) => (
                  <li key={p.user_id} className="ink-border flex min-w-0 items-center gap-3 rounded-xl bg-panel px-3 py-1.5">
                    <img src={characterChoice(p.character).src} alt="" className="h-8 w-8 shrink-0 object-contain" />
                    <span className="truncate font-display text-ink">{p.player_name}</span>
                    {p.user_id === room.host_id && (
                      <span className="ml-auto shrink-0 rounded-full bg-energy px-2 text-xs font-bold text-ink">HOST</span>
                    )}
                  </li>
                ))}
              </ul>

              <div className="mt-4 grid gap-2">
                {isHost ? (
                  <button
                    disabled={busy}
                    onClick={onStart}
                    className="btn-pop bg-flag px-6 py-3 text-xl text-ink disabled:opacity-60"
                  >
                    START RACE
                  </button>
                ) : (
                  <p className="animate-pulse font-display font-bold text-ink-soft">Waiting for host to start…</p>
                )}
              </div>
            </div>
          )}

          {error && <p className="mt-3 rounded-xl bg-destructive/15 px-3 py-2 text-sm font-bold text-destructive">{error}</p>}

          <button onClick={onLeave} className="btn-pop mt-4 w-full bg-panel px-6 py-2 text-sm text-ink">
            {room ? "LEAVE ROOM" : "BACK"}
          </button>
        </div>
      </div>
    </div>
  );
}
