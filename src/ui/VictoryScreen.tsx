import { AnimatedNumber } from "./AnimatedNumber";
import { formatTime } from "@/state/storage";

export interface RunResult {
  height: number;
  score: number;
  correct: number;
  answered: number;
  energyEarned: number;
  bestStreak: number;
  timeMs: number;
  level: number;
}

function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-2xl border-[3px] border-ink bg-sky-low/50 p-3 text-center">
      <p className="font-display text-2xl font-extrabold leading-none text-ink">{value}</p>
      <p className="mt-1 text-[10px] font-bold uppercase tracking-wide text-ink-soft">{label}</p>
    </div>
  );
}

export function VictoryScreen({
  result,
  onPlayAgain,
  onNextLevel,
  onLeaderboard,
  onMenu,
  isTop,
  onShare,
}: {
  isTop?: boolean;
  onShare?: () => void;
  result: RunResult;
  onPlayAgain: () => void;
  onNextLevel: () => void;
  onLeaderboard: () => void;
  onMenu: () => void;
}) {
  const accuracy = result.answered
    ? Math.round((result.correct / result.answered) * 100)
    : 0;

  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center bg-ink/70 p-4 backdrop-blur-sm">
      <div className="animate-pop-in max-h-full w-full max-w-xl overflow-y-auto game-panel p-4 text-center sm:p-5">
        <p className="animate-float-slow font-display text-4xl font-extrabold text-ink">
          🎉 LEVEL COMPLETE!
        </p>
        <p className="mt-1 font-display text-lg font-bold text-flag-deep">
          You reached the top of Level {result.level}
        </p>

        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
          <Stat label="Height" value={`${result.height}m`} />
          <Stat label="Score" value={<AnimatedNumber value={result.score} />} />
          <Stat label="Questions" value={`${result.correct}/${result.answered}`} />
          <Stat label="Accuracy" value={`${accuracy}%`} />
          <Stat label="Energy earned" value={`+${result.energyEarned}`} />
          <Stat label="Best streak" value={`🔥 ${result.bestStreak}`} />
        </div>
        <p className="mt-2 text-sm font-semibold text-ink-soft">
          Summit reached in {formatTime(result.timeMs)}
        </p>

        {onShare && (
          <div className="mt-3 rounded-2xl border-[3px] border-ink bg-energy/60 p-3">
            {isTop && <p className="font-display text-lg font-extrabold text-ink">🏆 You're #1 on the leaderboard!</p>}
            <button onClick={onShare} className="btn-pop mt-2 w-full bg-ink px-6 py-3 text-lg text-panel">
              POST ON X / TWITTER
            </button>
          </div>
        )}
        <div className="mt-5 grid gap-2">
          <button onClick={onPlayAgain} className="btn-pop bg-flag px-6 py-3 text-lg text-ink">
            RACE AGAIN
          </button>
          <div className="grid grid-cols-3 gap-2">
            <button onClick={onNextLevel} className="btn-pop bg-energy px-2 py-2 text-sm text-ink">NEW COURSE</button>
            <button
              onClick={onLeaderboard}
              className="btn-pop bg-panel px-2 py-2 text-sm text-ink"
            >
              LEADERBOARD
            </button>
            <button onClick={onMenu} className="btn-pop bg-panel px-2 py-2 text-sm text-ink">
              MENU
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
