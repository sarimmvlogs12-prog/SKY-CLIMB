import { formatTime } from "@/state/storage";
import { useEffect, useState } from "react";
import { SkyBackdrop } from "./SkyBackdrop";
import { CharacterPicker } from "./CharacterPicker";
import type { CharacterSkin } from "@/game/types";

export function MainMenu({
  playerName,
  skin,
  onSkinChange,
  onNameChange,
  onPlay,
  onMultiplayer,
  onHowTo,
  onLeaderboard,
  onSettings,
  onSignOut,
  best,
  topBoard = [],
}: {
  playerName: string;
  skin: CharacterSkin;
  onSkinChange: (s: CharacterSkin) => void;
  onNameChange: (n: string) => void;
  onPlay: () => void;
  onMultiplayer: () => void;
  onHowTo: () => void;
  onLeaderboard: () => void;
  onSettings: () => void;
  onSignOut: () => void;
  topBoard?: { name: string; timeMs: number }[];
  best: { highScore: number; bestHeight: number; bestStreak: number };
}) {
  const [name, setName] = useState(playerName);

  useEffect(() => {
    setName(playerName);
  }, [playerName]);

  const commitName = () => {
    const clean = name.trim().slice(0, 14) || "Climber";
    if (clean !== playerName) onNameChange(clean);
  };
  const start = () => {
    commitName();
    onPlay();
  };

  return (
    <div className="relative flex h-full w-full items-center justify-center overflow-hidden">
      <SkyBackdrop />
      <div className="animate-pop-in relative z-10 w-full max-w-md px-4 text-center">
        <div className="animate-float-slow">
          <h1 className="font-display text-5xl font-extrabold tracking-tight text-panel drop-shadow-[0_4px_0_rgba(32,48,74,1)] sm:text-6xl">
            DLICOM SKY <span className="text-energy">CLIMB</span>
          </h1>
          <p className="mt-1 font-display text-lg font-bold text-ink">
            Answer. Climb. Conquer.
          </p>
        </div>

        <div className="mt-6 game-panel p-5">
          <label className="block text-left font-display text-sm font-bold text-ink-soft">
            Your climber name
          </label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && start()}
            maxLength={14}
            placeholder="e.g. Nova"
            className="mt-1 w-full rounded-xl border-[3px] border-ink bg-sky-low/60 px-3 py-2 font-display text-lg text-ink outline-none placeholder:text-ink-soft/60 focus:bg-panel"
          />

          <CharacterPicker skin={skin} onChange={onSkinChange} />

          <div className="mt-4 grid gap-2">
            <button onClick={start} className="btn-pop bg-flag px-6 py-3 text-xl text-ink">
              PLAY SOLO
            </button>
            <button
              onClick={() => {
                commitName();
                onMultiplayer();
              }}
              className="btn-pop bg-energy px-6 py-3 text-xl text-ink"
            >
              MULTIPLAYER
            </button>
            <div className="grid grid-cols-3 gap-2">
              <button onClick={onHowTo} className="btn-pop bg-panel px-2 py-2 text-sm text-ink">
                HOW TO PLAY
              </button>
              <button
                onClick={onLeaderboard}
                className="btn-pop bg-panel px-2 py-2 text-sm text-ink"
              >
                LEADERBOARD
              </button>
              <button
                onClick={onSettings}
                className="btn-pop bg-panel px-2 py-2 text-sm text-ink"
              >
                SETTINGS
              </button>
            </div>
          </div>

          {topBoard.length > 0 && (
            <div className="mt-4 rounded-2xl border-[3px] border-ink bg-sky-low/50 p-2 text-left">
              <p className="px-1 font-display text-sm font-extrabold text-ink">🏆 Solo fastest</p>
              <ol className="mt-1 grid gap-0.5">
                {topBoard.slice(0, 5).map((e, i) => (
                  <li key={i} className="flex justify-between px-1 font-display text-sm text-ink">
                    <span className="truncate">{i + 1}. {e.name}</span>
                    <span className="tabular-nums">{formatTime(e.timeMs)}</span>
                  </li>
                ))}
              </ol>
            </div>
          )}
          <div className="mt-4 grid grid-cols-3 gap-2 text-center">
            {[
              { label: "Best score", value: best.highScore.toLocaleString() },
              { label: "Best height", value: `${best.bestHeight}m` },
              { label: "Best streak", value: `🔥 ${best.bestStreak}` },
            ].map((s) => (
              <div key={s.label} className="rounded-xl border-[3px] border-ink bg-sky-low/60 p-2">
                <p className="font-display text-base font-extrabold text-ink">{s.value}</p>
                <p className="text-[10px] font-bold uppercase text-ink-soft">{s.label}</p>
              </div>
            ))}
          </div>
          <button onClick={onSignOut} className="mt-4 font-display text-sm font-bold text-ink-soft underline decoration-2 underline-offset-4">
            SIGN OUT
          </button>
        </div>
      </div>
    </div>
  );
}
