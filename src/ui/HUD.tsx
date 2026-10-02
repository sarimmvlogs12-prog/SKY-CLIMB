import type { HudSnapshot } from "@/game/types";
import { formatTime } from "@/state/storage";
import { AnimatedNumber } from "./AnimatedNumber";

function Pill({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`ink-border flex items-center gap-2 rounded-2xl bg-panel/95 px-3 py-1.5 backdrop-blur ${className}`}
    >
      {children}
    </div>
  );
}

export function HUD({
  hud,
  onPause,
  onSettings,
  onAnswer,
  playerName,
  energyHint,
}: {
  hud: HudSnapshot;
  onPause: () => void;
  onSettings: () => void;
  onAnswer: () => void;
  playerName: string;
  energyHint: boolean;
}) {
  const warning = hud.timeLeftMs <= 30_000;
  const progress = Math.min(100, (hud.maxMeters / Math.max(1, hud.finishMeters)) * 100);
  const energyPct = Math.min(100, (hud.energy / 5000) * 100);

  return (
    <>
      {/* Top bar */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-20 flex items-start justify-between gap-2 p-3 sm:p-4">
        <div className="pointer-events-auto flex items-center gap-2">
          <div className="ink-border rounded-2xl bg-ink px-3 py-1.5">
            <span className="font-display text-lg font-extrabold tracking-tight text-panel sm:text-xl">
              DLICOM<span className="text-energy"> SKY CLIMB</span>
            </span>
          </div>
          <Pill className="hidden sm:flex">
            <span className="font-display text-sm text-ink">Level {hud.level}</span>
          </Pill>
        </div>

        <div className="pointer-events-auto flex items-center gap-2">
          <Pill>
            <span className="text-xs">⏱</span>
            <span
              className={`font-display text-lg font-extrabold tabular-nums text-ink ${
                warning ? "animate-warn" : ""
              }`}
            >
              {formatTime(hud.timeLeftMs)}
            </span>
          </Pill>
          <Pill className="hidden sm:flex">
            <span className="text-sm">🔥</span>
            <span
              key={hud.streak}
              className="animate-pop-in font-display text-lg font-extrabold text-streak"
            >
              {hud.streak}
            </span>
          </Pill>
        </div>

        <div className="pointer-events-auto flex items-center gap-2">
          <Pill>
            <span className="text-sm">⚡</span>
            <AnimatedNumber
              value={hud.energy}
              className="font-display text-lg font-extrabold text-energy-deep"
            />
          </Pill>
          <Pill className="hidden sm:flex">
            <span className="text-xs text-ink-soft">SCORE</span>
            <AnimatedNumber
              value={hud.score}
              className="font-display text-lg font-extrabold text-ink"
            />
          </Pill>
          <button
            onClick={onPause}
            aria-label="Pause"
            className="btn-pop bg-panel px-3 py-1.5 text-ink"
          >
            ❚❚
          </button>
          <button
            onClick={onSettings}
            aria-label="Settings"
            className="btn-pop bg-panel px-3 py-1.5 text-ink"
          >
            ⚙
          </button>
        </div>
      </div>

      {/* Left progress column */}
      <div className="pointer-events-none absolute left-3 top-1/2 z-20 hidden -translate-y-1/2 sm:block">
        <div className="ink-border w-40 rounded-3xl bg-panel/95 p-3 shadow-panel backdrop-blur">
          <p className="font-display text-xs uppercase tracking-wide text-ink-soft">Height</p>
          <p className="font-display text-3xl font-extrabold leading-none text-ink">
            {hud.meters}
            <span className="text-base">m</span>
          </p>
          <p className="mt-1 text-[11px] font-semibold text-ink-soft">
            Best {hud.maxMeters}m · Next {hud.finishMeters}m
          </p>

          <div className="mx-auto mt-3 flex h-36 w-7 flex-col justify-end overflow-hidden rounded-full border-[3px] border-ink bg-sky-low">
            <div
              className="w-full rounded-full bg-gradient-to-t from-flag-deep to-flag transition-[height] duration-300"
              style={{ height: `${Math.max(3, progress)}%` }}
            />
          </div>
          <p className="mt-2 text-center font-display text-sm font-bold text-flag-deep">
            Final summit · {hud.finishMeters}m
          </p>
          <p className="mt-1 hidden text-center text-[11px] sm:block font-semibold text-ink-soft">
            Checkpoints: {hud.checkpoint}/{hud.totalCheckpoints || 10}
          </p>
        </div>
      </div>

      {/* Energy bar + answer button */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 flex flex-col items-center gap-2 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:p-5">
        <div className="pointer-events-auto w-full max-w-[8rem] sm:max-w-md">
          <div className="ink-border h-5 w-full overflow-hidden rounded-full bg-panel">
            <div
              className="h-full rounded-full bg-gradient-to-r from-energy to-energy-deep transition-[width] duration-300"
              style={{ width: `${energyPct}%` }}
            />
          </div>
          <p className="mt-1 hidden text-center text-[11px] sm:block font-bold text-panel drop-shadow">
            ⚡ Jump costs 100 · double jump (tap again in air) costs 200
          </p>
        </div>
        <button
          onClick={onAnswer}
          className={`btn-pop pointer-events-auto bg-energy px-4 py-2 font-display text-sm text-ink sm:px-8 sm:py-3 sm:text-xl ${
            energyHint ? "animate-shake" : ""
          }`}
        >
          <span className="sm:hidden">⚡ ANSWER</span>
          <span className="hidden sm:inline">ANSWER QUESTION</span>
        </button>
      </div>
    </>
  );
}
