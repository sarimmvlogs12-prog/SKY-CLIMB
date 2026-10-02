export function PauseOverlay({
  onResume,
  onRestart,
  onMenu,
}: {
  onResume: () => void;
  onRestart: () => void;
  onMenu: () => void;
}) {
  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center bg-ink/65 p-4 backdrop-blur-sm">
      <div className="animate-pop-in w-full max-w-xs game-panel p-5 text-center">
        <p className="font-display text-3xl font-extrabold text-ink">PAUSED</p>
        <div className="mt-4 grid gap-2">
          <button onClick={onResume} className="btn-pop bg-flag px-6 py-3 text-lg text-ink">
            RESUME
          </button>
          <button onClick={onRestart} className="btn-pop bg-energy px-6 py-2 text-sm text-ink">
            RESTART LEVEL
          </button>
          <button onClick={onMenu} className="btn-pop bg-panel px-6 py-2 text-sm text-ink">
            EXIT TO MENU
          </button>
        </div>
      </div>
    </div>
  );
}

export function GameOverScreen({
  height,
  score,
  onRetry,
  onContinue,
  onMenu,
}: {
  height: number;
  score: number;
  onRetry: () => void;
  onContinue: () => void;
  onMenu: () => void;
}) {
  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center bg-ink/70 p-4 backdrop-blur-sm">
      <div className="animate-pop-in w-full max-w-sm game-panel p-5 text-center">
        <p className="font-display text-4xl font-extrabold text-destructive">TIME'S UP!</p>
        <p className="mt-2 font-display text-lg text-ink">
          You climbed {height}m for {score.toLocaleString()} points.
        </p>
        <div className="mt-4 grid gap-2">
          <button onClick={onRetry} className="btn-pop bg-flag px-6 py-3 text-lg text-ink">
            RETRY LEVEL
          </button>
          <button onClick={onContinue} className="btn-pop bg-energy px-6 py-2 text-sm text-ink">
            RESTART FROM CHECKPOINT
          </button>
          <button onClick={onMenu} className="btn-pop bg-panel px-6 py-2 text-sm text-ink">
            EXIT TO MENU
          </button>
        </div>
      </div>
    </div>
  );
}

export function Toast({ text, tone }: { text: string; tone: "good" | "bad" | "info" }) {
  const bg =
    tone === "good" ? "bg-flag" : tone === "bad" ? "bg-destructive text-panel" : "bg-energy";
  return (
    <div className="pointer-events-none absolute left-1/2 top-24 z-30 -translate-x-1/2">
      <div
        className={`animate-pop-in ink-border rounded-2xl px-5 py-2 font-display text-xl font-extrabold text-ink shadow-panel ${bg}`}
      >
        {text}
      </div>
    </div>
  );
}
