import { formatTime, type LeaderboardEntry } from "@/state/storage";

export function Leaderboard({
  entries,
  playerName,
  onBack,
}: {
  entries: LeaderboardEntry[];
  playerName: string;
  onBack: () => void;
}) {
  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center bg-ink/65 p-4 backdrop-blur-sm">
      <div className="animate-pop-in w-full max-w-2xl game-panel p-5">
        <h2 className="font-display text-3xl font-extrabold text-ink">🏆 Leaderboard</h2>
        <p className="text-sm font-semibold text-ink-soft">
          Fastest finish wins. Completed runs are saved to every player's account.
        </p>

        <div className="mt-4 overflow-hidden rounded-2xl border-[3px] border-ink">
          <table className="w-full text-left text-sm">
            <thead className="bg-ink font-display text-panel">
              <tr>
                <th className="px-3 py-2">#</th>
                <th className="px-3 py-2">Player</th>
                <th className="px-3 py-2">Finish time</th>
                <th className="hidden px-3 py-2 sm:table-cell">Score</th>
                <th className="hidden px-3 py-2 sm:table-cell">Accuracy</th>
              </tr>
            </thead>
            <tbody className="font-semibold text-ink">
              {entries.map((e, i) => (
                <tr
                  key={`${e.name}-${e.score}-${i}`}
                  className={
                    !e.demo && e.name === playerName
                      ? "bg-energy/40"
                      : i % 2
                        ? "bg-sky-low/40"
                        : "bg-panel"
                  }
                >
                  <td className="px-3 py-2 font-display font-extrabold">{i + 1}</td>
                  <td className="px-3 py-2">{e.name}</td>
                  <td className="px-3 py-2 font-display text-base font-extrabold tabular-nums">{formatTime(e.timeMs)}</td>
                  <td className="hidden px-3 py-2 tabular-nums sm:table-cell">{e.score.toLocaleString()}</td>
                  <td className="hidden px-3 py-2 tabular-nums sm:table-cell">{e.accuracy}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <button onClick={onBack} className="btn-pop mt-5 w-full bg-panel px-6 py-3 text-lg text-ink">
          BACK
        </button>
      </div>
    </div>
  );
}
